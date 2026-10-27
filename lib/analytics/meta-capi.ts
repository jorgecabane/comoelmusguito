/**
 * API de conversiones de Meta (servidor): evento `Purchase`.
 *
 * Por qué desde el servidor: el Pixel del navegador pierde compras (bloqueadores,
 * iOS, o el comprador cierra la pestaña de Flow antes de volver al sitio). El
 * evento sale de `processSuccessfulPayment`, que corre una sola vez por pedido.
 * Se envía con `event_id = orderId`; el Pixel del navegador usa el mismo id y Meta
 * deduplica, así que no se cuenta doble.
 *
 * Solo actúa si existen META_CAPI_ACCESS_TOKEN y NEXT_PUBLIC_META_PIXEL_ID
 * (definidos únicamente en Vercel > Production). Nunca lanza errores: un fallo de
 * Meta no puede romper el webhook de pago (Flow reintentaría).
 */

import 'server-only';
import { createHash } from 'node:crypto';
import type { SanityOrder } from '@/lib/sanity/orders';

/** Versión de la Graph API. Meta retira las antiguas: subirla es un cambio de una línea */
const GRAPH_API_VERSION = 'v25.0';
const REQUEST_TIMEOUT_MS = 3000;
/** Meta rechaza eventos con más de 7 días de antigüedad */
const MAX_EVENT_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Meta exige el email normalizado (sin espacios, minúsculas) y hasheado con SHA-256 */
export function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

type PurchaseOrder = Pick<
  SanityOrder,
  'orderId' | 'customerEmail' | 'items' | 'total' | 'currency' | 'paymentDate' | 'metaAttribution'
>;

export function buildPurchaseEvent(order: PurchaseOrder, siteUrl: string, now: Date = new Date()) {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const paidAt = order.paymentDate ? Math.floor(new Date(order.paymentDate).getTime() / 1000) : NaN;
  const eventTime =
    Number.isFinite(paidAt) && nowSeconds - paidAt >= 0 && nowSeconds - paidAt <= MAX_EVENT_AGE_SECONDS
      ? paidAt
      : nowSeconds;

  const attribution = order.metaAttribution;

  return {
    event_name: 'Purchase',
    event_time: eventTime,
    event_id: order.orderId,
    action_source: 'website',
    event_source_url: `${siteUrl.replace(/\/$/, '')}/checkout/callback`,
    user_data: {
      em: [hashEmail(order.customerEmail)],
      ...(attribution?.fbp && { fbp: attribution.fbp }),
      ...(attribution?.fbc && { fbc: attribution.fbc }),
      ...(attribution?.clientIp && { client_ip_address: attribution.clientIp }),
      ...(attribution?.userAgent && { client_user_agent: attribution.userAgent }),
    },
    custom_data: {
      currency: order.currency,
      value: order.total,
      content_type: 'product',
      content_ids: order.items.map((item) => item.id),
      contents: order.items.map((item) => ({ id: item.id, quantity: item.quantity, item_price: item.price })),
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      order_id: order.orderId,
    },
  };
}

/** Envía el `Purchase` de un pedido recién pagado. No lanza nunca. */
export async function sendMetaPurchase(order: PurchaseOrder): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  if (!accessToken || !pixelId) return;
  // Sin consentimiento al crear el pedido no se envía nada a Meta
  if (!order.metaAttribution?.consent) return;

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
    const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE;

    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // El token va en el cuerpo para que no quede en URLs ni en logs de acceso
      body: JSON.stringify({
        data: [buildPurchaseEvent(order, siteUrl)],
        access_token: accessToken,
        ...(testEventCode && { test_event_code: testEventCode }),
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      console.error(`[meta-capi] Meta respondió ${response.status} para la orden ${order.orderId}: ${detail}`);
    }
  } catch (error) {
    console.error(`[meta-capi] No se pudo enviar el Purchase de la orden ${order.orderId}:`, error);
  }
}
