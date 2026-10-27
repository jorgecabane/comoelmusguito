/**
 * Pixel de Meta (Facebook / Instagram)
 * Mide visitas para campañas y audiencias. Se carga solo si existe
 * NEXT_PUBLIC_META_PIXEL_ID, que en Vercel está definida únicamente en
 * Production (dev, vistas previas, local y CI no la tienen) Y la persona aceptó
 * las cookies publicitarias (CookieBanner). Se excluye /studio (panel de contenido).
 *
 * No hay <noscript> de respaldo: sin JavaScript no se puede dar consentimiento.
 *
 * El snippet oficial dispara PageView una vez al cargar; en un sitio con
 * navegación del lado del cliente hay que disparar uno más en cada cambio de ruta.
 */

'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAdsConsent } from '@/lib/analytics/useAdsConsent';

interface MetaPixelProps {
  pixelId?: string;
}

export function MetaPixel({ pixelId }: MetaPixelProps) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const excluded = pathname?.startsWith('/studio') ?? false;
  const granted = useAdsConsent() === 'granted';

  useEffect(() => {
    if (isFirstRender.current) {
      // El PageView de la primera carga lo dispara el snippet
      isFirstRender.current = false;
      return;
    }
    if (pixelId && !excluded && granted) window.fbq?.('track', 'PageView');
    // Al aceptar a mitad de la sesión no se repite el PageView: lo dispara el snippet al cargar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, pixelId, excluded]);

  if (!pixelId || excluded || !granted) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
          (window.__metaPending || []).forEach(function(a){ fbq.apply(null, a); });
          window.__metaPending = [];
        `}
      </Script>
    </>
  );
}
