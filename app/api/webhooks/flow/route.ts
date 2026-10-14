/**
 * Webhook de Flow (urlConfirmation)
 *
 * Flow sólo envía un `token`; el estado real se consulta con payment/getStatus.
 * Flow reintenta la notificación si no recibe un 2xx, así que:
 * - 200: lo que NO debe reintentarse (sin token, body ilegible, orden inexistente,
 *   estado pendiente/desconocido, rechazo/anulación aplicados, pago ya procesado).
 * - 500: fallos transitorios (Flow getStatus o Sanity caídos) para que Flow reintente.
 *   Es seguro: processSuccessfulPayment es idempotente (claim atómico con ifRevisionId)
 *   y el rechazo/anulación sólo se escribe si el estado cambió.
 * Un token inválido que no viene de Flow también termina en 500, pero nadie lo reintenta.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus } from '@/lib/flow';
import {
  getOrderByOrderId,
  updateOrderPaymentStatus,
  processSuccessfulPayment,
} from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'X-Content-Type-Options': 'nosniff',
};

const STATUS_LABELS: Record<number, string> = { 3: 'Rechazado', 4: 'Anulado' };

const reply = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: HEADERS });

/**
 * GET /api/webhooks/flow
 * Retornar 405 para evitar redirecciones automáticas de Next.js
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } }
  );
}

async function readToken(request: NextRequest): Promise<string | undefined> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const value = (await request.formData()).get('token');
    return typeof value === 'string' ? value : undefined;
  }
  return (await request.json())?.token;
}

async function handleRejected(commerceOrder: string, status: number, paymentDate?: string, flowOrder?: string) {
  const label = STATUS_LABELS[status];
  const order = await getOrderByOrderId(commerceOrder);
  if (!order) {
    console.warn(`[Webhook Flow] ${commerceOrder} | Orden no encontrada (pago ${label})`);
  } else if (order.paymentStatus !== status) {
    await updateOrderPaymentStatus(commerceOrder, status, paymentDate, flowOrder);
  }
  return reply({ success: true, message: `Pago ${label} procesado` });
}

async function handlePaid(commerceOrder: string, paymentDate?: string, flowOrder?: string) {
  if (!(await getOrderByOrderId(commerceOrder))) {
    console.warn(`[Webhook Flow] ${commerceOrder} | Orden no encontrada, pago sin procesar`);
    return reply({ success: false, message: 'Orden no encontrada' });
  }
  const result = await processSuccessfulPayment({ orderId: commerceOrder, paymentDate, providerOrderId: flowOrder });
  console.log(`[Webhook Flow] ✅ ${commerceOrder} | ${result.alreadyProcessed ? 'Ya procesado previamente' : 'Procesado'}`);
  return reply({ success: true, message: 'Webhook procesado correctamente' });
}

/**
 * POST /api/webhooks/flow
 */
export async function POST(request: NextRequest) {
  let token: string | undefined;
  try {
    token = await readToken(request);
  } catch {
    console.warn('[Webhook Flow] Body ilegible - ignorado');
  }
  if (!token) {
    return reply({ success: false, error: 'Token requerido', message: 'Webhook recibido pero sin token válido' });
  }

  try {
    const { status, commerceOrder, flowOrder, paymentDate } = await getPaymentStatus(token);
    console.log(`[Webhook Flow] CommerceOrder: ${commerceOrder} | Status: ${status}`);

    if (STATUS_LABELS[status]) return await handleRejected(commerceOrder, status, paymentDate, flowOrder);
    if (status === 2) return await handlePaid(commerceOrder, paymentDate, flowOrder);
    return reply({ success: true, message: 'Estado de pago pendiente o desconocido, sin acción' });
  } catch (error) {
    console.error('[Webhook Flow] ❌ Error transitorio procesando webhook, Flow reintentará:', error);
    return reply({ success: false, message: 'Error procesando webhook, reintentar' }, 500);
  }
}
