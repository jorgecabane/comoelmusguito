/**
 * Webhook de Flow
 * Recibe notificaciones cuando un pago se completa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/flow';
import {
  getOrderByOrderId,
  updateOrderPaymentStatus,
  processSuccessfulPayment,
} from '@/lib/sanity/orders';

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

    // Manejar pagos rechazados (status=3) o anulados (status=4)
    if (paymentStatusFromWebhook.status === 3 || paymentStatusFromWebhook.status === 4) {
      const statusLabel = paymentStatusFromWebhook.status === 3 ? 'Rechazado' : 'Anulado';
      console.log(`[Webhook Flow] ℹ️ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Pago ${statusLabel} (status: ${paymentStatusFromWebhook.status})`);

      const rejectedOrder = await getOrderByOrderId(paymentStatusFromWebhook.commerceOrder);

      if (!rejectedOrder) {
        console.warn(`[Webhook Flow] ⚠️ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Orden no encontrada en el sistema`);
      } else if (rejectedOrder.paymentStatus !== paymentStatusFromWebhook.status) {
        console.log(`[Webhook] Actualizando orden ${paymentStatusFromWebhook.commerceOrder} de estado ${rejectedOrder.paymentStatus} a ${paymentStatusFromWebhook.status} (${statusLabel})`);
        try {
          await updateOrderPaymentStatus(
            paymentStatusFromWebhook.commerceOrder,
            paymentStatusFromWebhook.status,
            paymentDate,
            paymentStatusFromWebhook.flowOrder
          );
        } catch (error) {
          console.error(`Error actualizando estado de orden ${statusLabel}:`, error);
          // No fallar el webhook si hay error actualizando
        }
      } else {
        console.log(`[Webhook] Orden ${paymentStatusFromWebhook.commerceOrder} ya tiene estado ${paymentStatusFromWebhook.status} (${statusLabel}), saltando actualización`);
      }

      return NextResponse.json(
        { success: true, message: `Pago ${statusLabel} procesado` },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Solo continuar si el pago está confirmado (status = 2)
    if (paymentStatusFromWebhook.status !== 2) {
      console.log(`[Webhook Flow] ℹ️ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Estado de pago desconocido (status: ${paymentStatusFromWebhook.status}), sin acción`);
      return NextResponse.json(
        { success: true, message: 'Estado de pago desconocido, sin acción' },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Procesar pago exitoso usando la función compartida
    try {
      const result = await processSuccessfulPayment({
        orderId: paymentStatusFromWebhook.commerceOrder,
        paymentDate,
        providerOrderId: paymentStatusFromWebhook.flowOrder,
      });

      if (result.alreadyProcessed) {
        console.log(`[Webhook Flow] ✅ ${timestamp} | CommerceOrder: ${paymentStatusFromWebhook.commerceOrder} | Ya procesado previamente`);
      }
    } catch (error) {
      console.error(`[Webhook Flow] ❌ ${timestamp} | Error procesando pago exitoso para orden ${paymentStatusFromWebhook.commerceOrder}:`, error);
      // No fallar el webhook - retornar 200 de todas formas
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

