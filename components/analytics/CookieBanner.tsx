/**
 * Aviso de cookies publicitarias (Pixel de Meta).
 * Solo aparece donde el Pixel está habilitado (producción) y mientras la persona no
 * haya elegido; el enlace "Preferencias de cookies" del pie de página lo reabre.
 * Aceptar y Rechazar tienen el mismo peso visual.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui';
import { onOpenCookiePreferences, setAdsConsent, useAdsConsent } from '@/lib/analytics/useAdsConsent';

interface CookieBannerProps {
  /** Hay un Pixel configurado; sin él no hay nada que consentir */
  enabled: boolean;
}

const noopSubscribe = () => () => {};

export function CookieBanner({ enabled }: CookieBannerProps) {
  const pathname = usePathname();
  const consent = useAdsConsent();
  // false en el servidor y en la hidratación, true ya en el navegador
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [reopened, setReopened] = useState(false);

  // Se muestra recién tras montar: así quien ya eligió no ve un destello del aviso
  useEffect(() => onOpenCookiePreferences(() => setReopened(true)), []);

  if (!enabled || !mounted || pathname?.startsWith('/studio')) return null;
  if (consent !== 'unset' && !reopened) return null;

  const choose = (granted: boolean) => {
    setAdsConsent(granted);
    setReopened(false);
  };

  return (
    <section
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-190 p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl border border-line bg-surface p-5 shadow-natural-lg">
        <h2 className="font-display text-xl text-fg">Cookies de medición publicitaria</h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Usamos cookies de Meta (Facebook e Instagram) para medir si nuestros anuncios funcionan. Solo se activan si
          las aceptas, y puedes cambiar tu elección cuando quieras en «Preferencias de cookies», al final de la
          página.{' '}
          <Link href="/privacidad#cookies" className="text-brand underline hover:text-fg">
            Más información
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={() => choose(false)}>
            Rechazar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => choose(true)}>
            Aceptar
          </Button>
        </div>
      </div>
    </section>
  );
}
