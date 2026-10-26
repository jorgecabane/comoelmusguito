/**
 * Pixel de Meta (Facebook / Instagram)
 * Mide visitas para campañas y audiencias. Solo se carga en producción
 * (ver lib/config/analytics.ts). Se excluye /studio (panel de contenido).
 *
 * El snippet oficial dispara PageView una vez al cargar; en un sitio con
 * navegación del lado del cliente hay que disparar uno más en cada cambio de ruta.
 */

'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

interface MetaPixelProps {
  pixelId: string | null;
}

export function MetaPixel({ pixelId }: MetaPixelProps) {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const excluded = pathname?.startsWith('/studio') ?? false;

  useEffect(() => {
    if (isFirstRender.current) {
      // El PageView de la primera carga lo dispara el snippet
      isFirstRender.current = false;
      return;
    }
    if (pixelId && !excluded) window.fbq?.('track', 'PageView');
  }, [pathname, pixelId, excluded]);

  if (!pixelId || excluded) return null;

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
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          className="hidden"
          alt=""
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
