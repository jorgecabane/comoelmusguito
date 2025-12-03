/**
 * Webhook de Flow
 * Recibe notificaciones cuando un pago se completa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatusByOrder, getPaymentStatus, verifyFlowSignature } from '@/lib/flow';
import { sendOrderConfirmationEmail } from '@/lib/resend/client';
import {
  getOrderByOrderId,
  updateOrderPaymentStatus,
  createCourseAccess,
} from '@/lib/sanity/orders';
import {
  decreaseTerrariumStock,
  decreaseWorkshopSpots,
} from '@/lib/sanity/inventory';
import type { EmailOrderData, EmailOrderItem } from '@/lib/resend/client';

export const dynamic = 'force-dynamic';

// Cache simple para evitar emails duplicados (en producción usar Redis o DB)
const sentEmails = new Set<string>();

/**
 * POST /api/webhooks/flow
 * Recibe notificaciones de Flow cuando un pago se completa
 */
export async function POST(request: NextRequest) {
  try {
    // Flow envía los datos como form-urlencoded o JSON
    const contentType = request.headers.get('content-type') || '';
    
    let flowData: Record<string, string>;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      flowData = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      flowData = await request.json();
    }

    const { token, commerceOrder, flowOrder, status, amount, currency, payer, s } = flowData;

    // Validar que tenemos los datos mínimos
    if (!commerceOrder && !token) {
      return NextResponse.json(
        { error: 'Falta token o commerceOrder' },
        { status: 400 }
      );
    }

    // Validar firma de Flow (si está presente)
    if (s) {
      const isValid = verifyFlowSignature(flowData, process.env.FLOW_SECRET_KEY || '', s);
      if (!isValid) {
        console.error('Firma inválida en webhook de Flow');
        return NextResponse.json(
          { error: 'Firma inválida' },
          { status: 401 }
        );
      }
    }

    // Consultar estado completo del pago
    let paymentStatus;
    try {
      paymentStatus = commerceOrder
        ? await getPaymentStatusByOrder(commerceOrder)
        : token
        ? await getPaymentStatus(token)
        : null;
      
      if (!paymentStatus) {
        return NextResponse.json(
          { error: 'No se pudo obtener estado del pago' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error consultando estado del pago:', error);
      return NextResponse.json(
        { error: 'Error consultando estado del pago' },
        { status: 500 }
      );
    }

    // Solo procesar si el pago está confirmado (status = 2)
    if (paymentStatus.status !== 2) {
      console.log(`Pago ${commerceOrder || token} no está confirmado (status: ${paymentStatus.status})`);
      return NextResponse.json({ 
        success: true, 
        message: 'Pago no confirmado, email no enviado' 
      });
    }

    // Evitar enviar emails duplicados
    const emailKey = `${commerceOrder || token}-${paymentStatus.status}`;
    if (sentEmails.has(emailKey)) {
      console.log(`Email ya enviado para orden ${commerceOrder || token}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Email ya enviado' 
      });
    }

    // Obtener detalles de la orden desde Sanity
    const savedOrder = await getOrderByOrderId(paymentStatus.commerceOrder);
    
    if (!savedOrder) {
      console.warn(`Orden ${paymentStatus.commerceOrder} no encontrada en el sistema`);
      // Si no encontramos la orden, retornar éxito pero no enviar email
      return NextResponse.json({ 
        success: true, 
        message: 'Orden no encontrada, email no enviado' 
      });
    }

    // Actualizar estado de pago en la orden guardada
    // Verificar estado actual para evitar actualizaciones duplicadas (idempotencia)
    if (savedOrder.paymentStatus !== paymentStatus.status) {
      console.log(`[Webhook] Actualizando orden ${paymentStatus.commerceOrder} de estado ${savedOrder.paymentStatus} a ${paymentStatus.status}`);
      await updateOrderPaymentStatus(
        paymentStatus.commerceOrder,
        paymentStatus.status,
        paymentStatus.paymentDate,
        paymentStatus.flowOrder
      );
    } else {
      console.log(`[Webhook] Orden ${paymentStatus.commerceOrder} ya tiene estado ${paymentStatus.status}, saltando actualización`);
    }

    // Si el pago está confirmado:
    // 1. Crear accesos a cursos (si hay usuario)
    // 2. Descontar stock de terrarios
    // 3. Descontar cupos de talleres
    if (paymentStatus.status === 2) {
      // Crear accesos a cursos
      if (savedOrder.userId?._ref && savedOrder._id) {
        for (const item of savedOrder.items) {
          if (item.type === 'course') {
            try {
              await createCourseAccess(
                savedOrder.userId._ref,
                item.id,
                savedOrder._id // Usar el _id de la orden en Sanity
              );
            } catch (error) {
              console.error(`Error creando acceso a curso ${item.id}:`, error);
              // No fallar el webhook si hay error creando acceso
            }
          }
        }
      }

      // Descontar stock de terrarios
      for (const item of savedOrder.items) {
        if (item.type === 'terrarium') {
          try {
            await decreaseTerrariumStock(item.id, item.quantity);
          } catch (error) {
            console.error(`Error descontando stock de terrario ${item.id}:`, error);
            // No fallar el webhook si hay error descontando stock
          }
        }
      }

      // Descontar cupos de talleres
      for (const item of savedOrder.items) {
        if (item.type === 'workshop' && item.selectedDate) {
          try {
            await decreaseWorkshopSpots(
              item.id,
              item.selectedDate.date,
              item.quantity
            );
          } catch (error) {
            console.error(`Error descontando cupos de taller ${item.id}:`, error);
            // No fallar el webhook si hay error descontando cupos
          }
        }
      }
    }

    // Convertir items de la orden al formato del email
    const orderItems: EmailOrderItem[] = savedOrder.items.map((item) => {
      let selectedDate: { date: string; time: string } | undefined;
      
      if (item.selectedDate) {
        selectedDate = {
          date: item.selectedDate.date,
          time: item.selectedDate.time || '',
        };
      }
      
      return {
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        slug: item.slug,
        selectedDate,
      };
    });

    // Verificar si el usuario tiene cuenta (si userId existe, tiene cuenta)
    const hasAccount = !!savedOrder.userId?._ref;

    const flowOrderValue = paymentStatus.flowOrder || savedOrder.flowOrder;
    const emailData: EmailOrderData = {
      orderId: savedOrder.orderId,
      flowOrder: flowOrderValue ? String(flowOrderValue) : undefined,
      customerEmail: savedOrder.customerEmail,
      customerName: savedOrder.customerName,
      items: orderItems,
      total: savedOrder.total,
      currency: savedOrder.currency,
      paymentDate: paymentStatus.paymentDate || new Date().toISOString(),
      hasAccount,
    };

    // Enviar email de confirmación
    if (emailData.customerEmail) {
      await sendOrderConfirmationEmail(emailData);
      sentEmails.add(emailKey);
      
      // Limpiar cache después de 24 horas (simple, en producción usar TTL)
      setTimeout(() => {
        sentEmails.delete(emailKey);
      }, 24 * 60 * 60 * 1000);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook procesado correctamente' 
    });

  } catch (error) {
    console.error('Error procesando webhook de Flow:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error procesando webhook' 
      },
      { status: 500 }
    );
  }
}

