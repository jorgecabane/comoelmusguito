'use client';

/**
 * Estado del consentimiento publicitario en el navegador, y sus acciones.
 * Ver lib/analytics/consent.ts para el formato de la cookie.
 */

import { useSyncExternalStore } from 'react';
import {
  META_COOKIES,
  consentCookieString,
  parseAdsConsent,
  type AdsConsent,
} from '@/lib/analytics/consent';

const CHANGE_EVENT = 'cem:consent-change';
const OPEN_EVENT = 'cem:open-cookie-preferences';

export function readAdsConsent(): AdsConsent {
  if (typeof document === 'undefined') return 'unset';
  return parseAdsConsent(document.cookie);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

/** Consentimiento actual; 'unset' en el servidor y en el primer render */
export function useAdsConsent(): AdsConsent {
  return useSyncExternalStore(subscribe, readAdsConsent, () => 'unset');
}

/** Guarda la elección. Al rechazar o retirar, además se borran las cookies de Meta y se revoca el Pixel. */
export function setAdsConsent(granted: boolean): void {
  document.cookie = consentCookieString(granted, window.location.protocol === 'https:');

  if (!granted) {
    window.fbq?.('consent', 'revoke');
    for (const name of META_COOKIES) {
      document.cookie = `${name}=; Max-Age=0; Path=/`;
      // El Pixel también puede crearlas en el dominio raíz
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${window.location.hostname}`;
    }
    window.__metaPending = [];
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Vuelve a mostrar el aviso (enlace "Preferencias de cookies" del pie de página) */
export function openCookiePreferences(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenCookiePreferences(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
