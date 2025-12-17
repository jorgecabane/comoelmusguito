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
 * GET /api/webhooks/flow
 * Retornar 405 para evitar redirecciones automáticas de Next.js
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { 
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST',
      }
    }
  );
}

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
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Validar firma de Flow (si está presente)
    if (s) {
      const isValid = verifyFlowSignature(flowData, process.env.FLOW_SECRET_KEY || '', s);
      if (!isValid) {
        console.error('Firma inválida en webhook de Flow');
        return NextResponse.json(
          { error: 'Firma inválida' },
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
    }

    // Usar los datos que Flow envía directamente en el webhook
    // Flow ya envía status, amount, currency, etc. No necesitamos consultar de nuevo
    // Solo consultamos si necesitamos datos adicionales como paymentDate
    const paymentStatusFromWebhook = {
      status: status ? parseInt(status, 10) : undefined,
      amount: amount ? parseFloat(amount) : undefined,
      currency: currency || 'CLP',
      commerceOrder: commerceOrder || '',
      flowOrder: flowOrder || '',
      payer: payer || '',
    };

    // Intentar obtener datos adicionales (paymentDate) consultando Flow, pero no fallar si no se puede
    let paymentDate: string | undefined;
    try {
      const fullPaymentStatus = commerceOrder
        ? await getPaymentStatusByOrder(commerceOrder)
        : token
        ? await getPaymentStatus(token)
        : null;
      
      if (fullPaymentStatus) {
        paymentDate = fullPaymentStatus.paymentDate;
        // Actualizar con datos completos si los tenemos
        if (fullPaymentStatus.status) paymentStatusFromWebhook.status = fullPaymentStatus.status;
        if (fullPaymentStatus.flowOrder) paymentStatusFromWebhook.flowOrder = fullPaymentStatus.flowOrder;
      }
    } catch (error) {
      // No fallar si no podemos consultar el estado - usar los datos del webhook
      console.warn('No se pudo consultar estado completo del pago, usando datos del webhook:', error);
    }

    // Validar que tenemos al menos el status
    if (!paymentStatusFromWebhook.status) {
      console.warn('No se pudo determinar el estado del pago desde el webhook');
      // Retornar 200 de todas formas - Flow espera 200 siempre
      return NextResponse.json(
        { 
          success: true, 
          message: 'Webhook recibido pero estado no disponible' 
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Solo procesar si el pago está confirmado (status = 2)
    if (paymentStatusFromWebhook.status !== 2) {
      console.log(`Pago ${commerceOrder || token} no está confirmado (status: ${paymentStatusFromWebhook.status})`);
      return NextResponse.json({ 
        success: true, 
        message: 'Pago no confirmado, email no enviado' 
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Evitar enviar emails duplicados
    const emailKey = `${commerceOrder || token}-${paymentStatusFromWebhook.status}`;
    if (sentEmails.has(emailKey)) {
      console.log(`Email ya enviado para orden ${commerceOrder || token}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Email ya enviado' 
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Obtener detalles de la orden desde Sanity
    const savedOrder = await getOrderByOrderId(paymentStatusFromWebhook.commerceOrder);
    
    if (!savedOrder) {
      console.warn(`Orden ${paymentStatusFromWebhook.commerceOrder} no encontrada en el sistema`);
      // Si no encontramos la orden, retornar éxito pero no enviar email
      // IMPORTANTE: Retornar 200 siempre - Flow espera 200
      return NextResponse.json({ 
        success: true, 
        message: 'Orden no encontrada, email no enviado' 
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Actualizar estado de pago en la orden guardada
    // Verificar estado actual para evitar actualizaciones duplicadas (idempotencia)
    if (savedOrder.paymentStatus !== paymentStatusFromWebhook.status) {
      console.log(`[Webhook] Actualizando orden ${paymentStatusFromWebhook.commerceOrder} de estado ${savedOrder.paymentStatus} a ${paymentStatusFromWebhook.status}`);
      try {
        await updateOrderPaymentStatus(
          paymentStatusFromWebhook.commerceOrder,
          paymentStatusFromWebhook.status,
          paymentDate,
          paymentStatusFromWebhook.flowOrder
        );
      } catch (error) {
        console.error('Error actualizando estado de la orden:', error);
        // No fallar el webhook si hay error actualizando
      }
    } else {
      console.log(`[Webhook] Orden ${paymentStatusFromWebhook.commerceOrder} ya tiene estado ${paymentStatusFromWebhook.status}, saltando actualización`);
    }

    // Si el pago está confirmado:
    // 1. Crear accesos a cursos (si hay usuario)
    // 2. Descontar stock de terrarios
    // 3. Descontar cupos de talleres
    if (paymentStatusFromWebhook.status === 2) {
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

    const flowOrderValue = paymentStatusFromWebhook.flowOrder || savedOrder.flowOrder;
    const emailData: EmailOrderData = {
      orderId: savedOrder.orderId,
      flowOrder: flowOrderValue ? String(flowOrderValue) : undefined,
      customerEmail: savedOrder.customerEmail,
      customerName: savedOrder.customerName,
      items: orderItems,
      total: savedOrder.total,
      currency: savedOrder.currency,
      paymentDate: paymentDate || new Date().toISOString(),
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

    // IMPORTANTE: Retornar explícitamente 200 OK con headers correctos
    // NO usar redirect() - Flow espera una respuesta JSON directa, no una redirección
    // El 307 que Flow recibía probablemente venía de retornar errores (500) o de alguna
    // configuración de Vercel/Next.js que redirige errores
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Webhook procesado correctamente' 
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          // Asegurar que no haya redirecciones
          'X-Content-Type-Options': 'nosniff',
        }
      }
    );

    return response;

  } catch (error) {
    console.error('Error procesando webhook de Flow:', error);
    // IMPORTANTE: Flow espera que siempre retornemos 200, incluso si hay errores
    // Si retornamos 500, Vercel/Next.js podría redirigir automáticamente (causando el 307)
    // Por eso siempre retornamos 200 con un mensaje de error en el body
    const errorResponse = NextResponse.json(
      { 
        success: true,
        message: 'Webhook recibido pero hubo un error procesándolo',
        error: error instanceof Error ? error.message : 'Error procesando webhook' 
      },
      { 
        status: 200, // Siempre retornar 200 para Flow - NO 500
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        }
      }
    );

    return errorResponse;
  }
}

