/**
 * API Route: Consultar estado de pago en Flow
 * POST /api/checkout/status
 * 
 * También actualiza el estado en Sanity si el pago está confirmado
 * Esto sirve como backup al webhook de Flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus, getPaymentStatusByOrder } from '@/lib/flow/client';
import { updateOrderPaymentStatus, getOrderByOrderId, createCourseAccess } from '@/lib/sanity/orders';
import { decreaseTerrariumStock, decreaseWorkshopSpots } from '@/lib/sanity/inventory';
import { client } from '@/sanity/lib/client';

export const dynamic = 'force-dynamic';

interface StatusRequest {
  token?: string;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StatusRequest = await request.json();
    const { token, orderId } = body;

    if (!token && !orderId) {
      return NextResponse.json(
        { error: 'Token u orderId requerido' },
        { status: 400 }
      );
    }

    let paymentStatus;

    if (token) {
      paymentStatus = await getPaymentStatus(token);
    } else if (orderId) {
      paymentStatus = await getPaymentStatusByOrder(orderId);
    } else {
      return NextResponse.json(
        { error: 'Token u orderId requerido' },
        { status: 400 }
      );
    }

    // Si el pago está confirmado (status = 2), actualizar en Sanity
    // Esto es idempotente: si ya está confirmado, no hace nada
    if (paymentStatus.status === 2 && paymentStatus.commerceOrder) {
      try {
        // Verificar estado actual de la orden para evitar actualizaciones innecesarias
        const currentOrder = await getOrderByOrderId(paymentStatus.commerceOrder);
        
        // Solo actualizar si el estado actual NO es confirmado (2)
        // Esto previene actualizaciones duplicadas si el webhook ya llegó
        if (currentOrder && currentOrder.paymentStatus !== 2) {
          console.log(`[Callback] Actualizando orden ${paymentStatus.commerceOrder} a estado confirmado`);
          await updateOrderPaymentStatus(
            paymentStatus.commerceOrder,
            paymentStatus.status,
            paymentStatus.paymentDate,
            paymentStatus.flowOrder
          );

          // Crear accesos a cursos si hay usuario y la orden tiene cursos
          if (currentOrder.userId?._ref && currentOrder._id) {
            for (const item of currentOrder.items) {
              if (item.type === 'course') {
                try {
                  // Verificar si ya existe el acceso (idempotencia)
                  const existingAccess = await client.fetch(
                    `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
                    { userId: currentOrder.userId._ref, courseId: item.id }
                  );

                  if (!existingAccess) {
                    await createCourseAccess(
                      currentOrder.userId._ref,
                      item.id,
                      currentOrder._id
                    );
                    console.log(`[Callback] Acceso a curso ${item.id} creado para orden ${paymentStatus.commerceOrder}`);
                  }
                } catch (error) {
                  console.error(`[Callback] Error creando acceso a curso ${item.id}:`, error);
                  // No fallar si hay error creando acceso
                }
              }
            }
          }

          // Descontar stock de terrarios y cupos de talleres (backup del webhook)
          // Solo si el estado NO era confirmado antes de actualizar
          for (const item of currentOrder.items) {
            if (item.type === 'terrarium') {
              try {
                await decreaseTerrariumStock(item.id, item.quantity);
                console.log(`[Callback] Stock de terrario ${item.id} descontado para orden ${paymentStatus.commerceOrder}`);
              } catch (error) {
                console.error(`[Callback] Error descontando stock de terrario ${item.id}:`, error);
                // No fallar si hay error descontando stock
              }
            } else if (item.type === 'workshop' && item.selectedDate) {
              try {
                await decreaseWorkshopSpots(
                  item.id,
                  item.selectedDate.date,
                  item.quantity
                );
                console.log(`[Callback] Cupos de taller ${item.id} descontados para orden ${paymentStatus.commerceOrder}`);
              } catch (error) {
                console.error(`[Callback] Error descontando cupos de taller ${item.id}:`, error);
                // No fallar si hay error descontando cupos
              }
            }
          }
        } else if (currentOrder && currentOrder.paymentStatus === 2) {
          console.log(`[Callback] Orden ${paymentStatus.commerceOrder} ya está confirmada, saltando actualización y descuento de stock`);
        }
      } catch (updateError) {
        // No fallar la respuesta si la actualización falla
        // El webhook puede llegar después y actualizar
        console.error('Error actualizando estado de orden en callback:', updateError);
      }
    }

    // Obtener email y nombre del cliente si la orden existe
    let customerEmail: string | undefined;
    let customerName: string | undefined;
    
    if (paymentStatus.commerceOrder) {
      try {
        const order = await getOrderByOrderId(paymentStatus.commerceOrder);
        if (order) {
          customerEmail = order.customerEmail;
          customerName = order.customerName;
        }
      } catch (error) {
        // No fallar si no se puede obtener la orden
        console.error('Error obteniendo email de la orden:', error);
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentStatus.status,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      commerceOrder: paymentStatus.commerceOrder,
      flowOrder: paymentStatus.flowOrder,
      paymentDate: paymentStatus.paymentDate,
      payer: paymentStatus.payer,
      customerEmail,
      customerName,
    });
  } catch (error) {
    console.error('Error consultando estado de pago:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al consultar estado del pago',
      },
      { status: 500 }
    );
  }
}

