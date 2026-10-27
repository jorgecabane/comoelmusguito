/**
 * Enlace del pie de página para reabrir el aviso de cookies y cambiar la elección.
 * Solo se muestra donde el Pixel está habilitado.
 */

'use client';

import { openCookiePreferences } from '@/lib/analytics/useAdsConsent';

export function CookiePreferencesLink({ className }: { className?: string }) {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) return null;

  return (
    <button type="button" onClick={openCookiePreferences} className={className}>
      Preferencias de cookies
    </button>
  );
}
