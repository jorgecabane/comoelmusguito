/**
 * Webhook de Flow
 * Recibe notificaciones cuando un pago se completa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/flow';
import { sendOrderConfirmationEmail, sendGiftEmail } from '@/lib/resend/client';
import { markGiftAsRedeemed } from '@/lib/sanity/gifts';
import {
  getOrderByOrderId,
  updateOrderPaymentStatus,
  createCourseAccess,
  markOrderEmailSent,
} from '@/lib/sanity/orders';
import { client } from '@/sanity/lib/client';
import {
  decreaseTerrariumStock,
  decreaseWorkshopSpots,
  decreaseSupplyStock,
} from '@/lib/sanity/inventory';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import type { EmailOrderData, EmailOrderItem, GiftEmailData } from '@/lib/resend/client';

export const dynamic = 'force-dynamic';

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
  const timestamp = new Date().toISOString();
  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
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

    const { token, commerceOrder, flowOrder, status, amount, currency, payer } = flowData;

    // 📝 LOG INICIAL: Registrar TODOS los webhooks que llegan
    console.log(`[Webhook Flow] ${timestamp} | IP: ${clientIP} | Token: ${token || 'N/A'} | CommerceOrder: ${commerceOrder || 'N/A'} | FlowOrder: ${flowOrder || 'N/A'} | Status: ${status || 'N/A'}`);

    // Validar que tenemos el token (Flow siempre envía token en webhooks)
    // Según documentación: Flow envía notificaciones con un token, no con firma
    // La firma se usa cuando el comercio consulta la API, no cuando Flow notifica
    if (!token) {
      console.error(`[Webhook Flow] ⚠️ ${timestamp} | IP: ${clientIP} | Webhook sin token - rechazado`);
      // IMPORTANTE: Retornar 200 siempre - Flow espera 200 incluso si el webhook es inválido
      // Si retornamos 400/500, Flow podría intentar reenviar el webhook
      return NextResponse.json(
        { 
          success: false,
          error: 'Token requerido',
          message: 'Webhook recibido pero sin token válido' 
        },
        { 
          status: 200, // Siempre 200 para Flow
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Según documentación de Flow: el webhook solo envía un token
    // Debemos consultar payment/getStatus con ese token para obtener los datos del pago
    // Esta consulta SÍ requiere firma (que generamos nosotros), pero el webhook no la trae
    let paymentStatusFromWebhook: {
      status: number;
      amount?: number;
      currency: string;
      commerceOrder: string;
      flowOrder?: string;
      payer?: string;
    };
    let paymentDate: string | undefined;

    try {
      // Consultar Flow API usando el token recibido en el webhook
      const fullPaymentStatus = await getPaymentStatus(token);
      
      if (!fullPaymentStatus) {
        console.warn(`[Webhook Flow] ⚠️ ${timestamp} | Token: ${token} | No se pudo obtener estado del pago desde Flow API`);
        return NextResponse.json(
          { 
            success: true, 
            message: 'Webhook recibido pero no se pudo obtener estado del pago' 
          },
          { 
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }

      // Usar los datos obtenidos de Flow API
      paymentStatusFromWebhook = {
        status: fullPaymentStatus.status || 0,
        amount: fullPaymentStatus.amount,
        currency: fullPaymentStatus.currency || 'CLP',
        commerceOrder: fullPaymentStatus.commerceOrder || '',
        flowOrder: fullPaymentStatus.flowOrder,
        payer: fullPaymentStatus.payer,
      };
      paymentDate = fullPaymentStatus.paymentDate;
    } catch (error) {
      console.error(`[Webhook Flow] ❌ ${timestamp} | Token: ${token} | Error consultando estado del pago desde Flow API:`, error);
      // Retornar 200 de todas formas - Flow espera 200 siempre
      return NextResponse.json(
        { 
          success: true, 
          message: 'Webhook recibido pero hubo error consultando estado' 
        },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Validar que tenemos al menos el status
    if (!paymentStatusFromWebhook.status) {
      console.warn(`[Webhook Flow] ⚠️ ${timestamp} | Token: ${token} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | No se pudo determinar el estado del pago desde el webhook`);
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
      console.log(`[Webhook Flow] ℹ️ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Pago no está confirmado (status: ${paymentStatusFromWebhook.status})`);
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

    // Obtener detalles de la orden desde Sanity
    const savedOrder = await getOrderByOrderId(paymentStatusFromWebhook.commerceOrder);
    
    if (!savedOrder) {
      console.warn(`[Webhook Flow] ⚠️ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Orden no encontrada en el sistema`);
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

    // 🔒 EVITAR EMAILS DUPLICADOS: Verificar en Sanity si ya se envió el email
    if (savedOrder.emailSent) {
      console.log(`[Webhook Flow] ✅ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Email ya enviado previamente`);
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
      // Si el estado ya es el mismo, verificar si falta paymentDate y actualizarlo
      if (paymentStatusFromWebhook.status === 2 && paymentDate && !savedOrder.paymentDate) {
        console.log(`[Webhook] Orden ${paymentStatusFromWebhook.commerceOrder} ya tiene estado confirmado, actualizando paymentDate`);
        try {
          await updateOrderPaymentStatus(
            paymentStatusFromWebhook.commerceOrder,
            paymentStatusFromWebhook.status,
            paymentDate,
            paymentStatusFromWebhook.flowOrder
          );
        } catch (error) {
          console.error('Error actualizando paymentDate:', error);
        }
      } else {
        console.log(`[Webhook] Orden ${paymentStatusFromWebhook.commerceOrder} ya tiene estado ${paymentStatusFromWebhook.status}, saltando actualización`);
      }
    }

    // Si el pago está confirmado:
    // 1. Crear accesos a cursos (si hay usuario o si es regalo)
    // 2. Descontar stock de terrarios
    // 3. Descontar cupos de talleres
    if (paymentStatusFromWebhook.status === 2) {
      // Manejar regalos
      if (savedOrder.isGift && savedOrder.recipientEmail && savedOrder.giftToken) {
        console.log(`[Webhook] Procesando regalo para ${savedOrder.recipientEmail}`);
        
        // Buscar si el destinatario tiene cuenta
        const recipientUser = await getUserByEmail(savedOrder.recipientEmail);
        
        if (recipientUser?._id && savedOrder._id) {
          // Destinatario tiene cuenta → crear acceso inmediatamente
          console.log(`[Webhook] Destinatario tiene cuenta, creando accesos inmediatamente`);
          let coursesCreated = 0;
          for (const item of savedOrder.items) {
            if (item.type === 'course') {
              try {
                // Verificar si ya tiene acceso (evitar duplicados)
                const existingAccess = await client.fetch(
                  `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
                  {
                    userId: recipientUser._id,
                    courseId: item.id,
                  }
                );

                if (!existingAccess) {
                  await createCourseAccess(
                    recipientUser._id,
                    item.id,
                    savedOrder._id
                  );
                  coursesCreated++;
                  console.log(`✅ Acceso a curso ${item.id} creado para destinatario ${savedOrder.recipientEmail}`);
                } else {
                  console.log(`⚠️ Destinatario ya tiene acceso a curso ${item.id}`);
                }
              } catch (error) {
                console.error(`Error creando acceso a curso ${item.id} para destinatario:`, error);
              }
            }
          }

          // 🔒 Marcar el regalo como canjeado si se crearon accesos
          if (coursesCreated > 0) {
            try {
              await markGiftAsRedeemed(savedOrder.orderId, recipientUser._id);
              console.log(`✅ Regalo ${savedOrder.orderId} marcado como canjeado automáticamente para destinatario ${savedOrder.recipientEmail}`);
            } catch (error) {
              console.error(`Error marcando regalo como canjeado en webhook:`, error);
              // No fallar el webhook si hay error marcando
            }
          }
        } else {
          // Destinatario no tiene cuenta → se creará acceso cuando se registre o canjee el token
          console.log(`[Webhook] Destinatario no tiene cuenta, acceso se creará al registrarse o canjear token`);
        }
      } else {
        // No es regalo → crear accesos para el comprador (comportamiento normal)
        if (savedOrder.userId?._ref && savedOrder._id) {
          for (const item of savedOrder.items) {
            if (item.type === 'course') {
              try {
                await createCourseAccess(
                  savedOrder.userId._ref,
                  item.id,
                  savedOrder._id
                );
              } catch (error) {
                console.error(`Error creando acceso a curso ${item.id}:`, error);
              }
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

      // Descontar stock de insumos
      for (const item of savedOrder.items) {
        if (item.type === 'supply') {
          try {
            await decreaseSupplyStock(item.id, item.quantity);
          } catch (error) {
            console.error(`Error descontando stock de insumo ${item.id}:`, error);
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
      isGift: savedOrder.isGift || false,
      recipientName: savedOrder.recipientName,
      recipientEmail: savedOrder.recipientEmail,
      giftMessage: savedOrder.giftMessage,
      requiresShipping: savedOrder.requiresShipping || false,
      shippingAddress: savedOrder.shippingAddress,
    };

    // Enviar emails
    if (emailData.customerEmail) {
      try {
        // Si es regalo, enviar email al destinatario
        if (savedOrder.isGift && savedOrder.recipientEmail && savedOrder.giftToken) {
          console.log(`[Webhook] Enviando email de regalo a ${savedOrder.recipientEmail}`);
          
          const giftEmailData: GiftEmailData = {
            giftToken: savedOrder.giftToken,
            recipientName: savedOrder.recipientName,
            recipientEmail: savedOrder.recipientEmail,
            senderName: savedOrder.customerName,
            senderEmail: savedOrder.customerEmail,
            giftMessage: savedOrder.giftMessage,
            items: orderItems,
            orderId: savedOrder.orderId,
            requiresShipping: savedOrder.requiresShipping || false,
            shippingAddress: savedOrder.shippingAddress,
          };

          try {
            await sendGiftEmail(giftEmailData);
            console.log(`✅ Email de regalo enviado a ${savedOrder.recipientEmail}`);
          } catch (giftEmailError) {
            console.error('Error enviando email de regalo:', giftEmailError);
            // No fallar el webhook si hay error enviando email de regalo
          }
        }

        // Enviar email de confirmación al comprador (siempre)
        await sendOrderConfirmationEmail(emailData);
        console.log(`✅ Email de confirmación enviado a ${emailData.customerEmail}`);
        
        // 🔒 MARCAR EMAIL COMO ENVIADO EN SANITY (idempotente)
        try {
          await markOrderEmailSent(paymentStatusFromWebhook.commerceOrder);
          console.log(`✅ Email marcado como enviado para orden ${paymentStatusFromWebhook.commerceOrder}`);
        } catch (error) {
          console.error('Error marcando email como enviado:', error);
          // No fallar el webhook si hay error marcando el email
        }
      } catch (emailError) {
        console.error('Error enviando emails:', emailError);
        // No fallar el webhook si hay error enviando email
      }
    }

    // 📝 LOG FINAL: Registrar webhook procesado exitosamente
    console.log(`[Webhook Flow] ✅ ${timestamp} | Orden ${paymentStatusFromWebhook.commerceOrder} procesada exitosamente`);

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
    // 📝 LOG ERROR: Registrar error pero también los datos recibidos
    console.error(`[Webhook Flow] ❌ ${timestamp} | IP: ${clientIP} | Error procesando webhook:`, error);
    if (error instanceof Error) {
      console.error(`[Webhook Flow] Stack trace:`, error.stack);
    }
    
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

