/**
 * Eventos del Pixel de Meta desde el navegador.
 *
 * Si el Pixel no está habilitado (dev, vistas previas, local, CI: ver MetaPixel.tsx),
 * estas funciones no hacen nada; no hace falta revisar el entorno en cada llamada.
 */

import type { CartItem } from '@/types/cart';
import { parseAdsConsent } from '@/lib/analytics/consent';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    /** Eventos disparados antes de que cargue el Pixel; MetaPixel los envía al cargar */
    __metaPending?: unknown[][];
  }
}

/** Se resuelve en el build: sin ID (dev, vistas previas, local, CI) el Pixel no existe */
const PIXEL_ENABLED = Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);

type MetaStandardEvent = 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

export interface MetaEventParams {
  content_ids?: string[];
  content_type?: 'product';
  content_name?: string;
  contents?: { id: string; quantity: number; item_price: number }[];
  num_items?: number;
  value?: number;
  currency?: string;
  order_id?: string;
}

/**
 * Envía un evento estándar. `eventId` evita contarlo dos veces cuando el mismo
 * evento también llega por la API de servidor (Meta deduplica por nombre + id).
 */
export function trackMeta(event: MetaStandardEvent, params: MetaEventParams, eventId?: string): void {
  if (typeof window === 'undefined') return;
  // Sin consentimiento no se envía ni se encola nada: al aceptar después no se "reproduce" lo anterior
  if (parseAdsConsent(document.cookie) !== 'granted') return;
  const args = eventId ? ['track', event, params, { eventID: eventId }] : ['track', event, params];

  if (typeof window.fbq === 'function') {
    window.fbq(...args);
  } else if (PIXEL_ENABLED) {
    // El Pixel carga después de la hidratación (afterInteractive): un evento de la
    // primera pantalla (p. ej. ViewContent) llegaría antes. Se guarda y MetaPixel lo envía.
    (window.__metaPending ??= []).push(args);
  }
}

/** Parámetros de un producto del carrito (ViewContent / AddToCart) */
export function paramsFromCartItem(item: CartItem, quantity: number = item.quantity): MetaEventParams {
  return {
    content_ids: [item.id],
    content_type: 'product',
    content_name: item.name,
    contents: [{ id: item.id, quantity, item_price: item.price }],
    num_items: quantity,
    value: item.price * quantity,
    currency: item.currency,
  };
}
