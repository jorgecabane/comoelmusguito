/**
 * Conditional Recaptcha Provider
 * Carga reCAPTCHA solo si hay formularios en la página
 * Mejora FCP al no cargar en páginas sin formularios (ej: /studio)
 */

'use client';

import { ReactNode, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
const SCRIPT_PROPS = { async: true, defer: true, appendTo: 'head' } as const;

interface LazyRecaptchaProviderProps {
  children: ReactNode;
}

// Rutas que sabemos que tienen formularios
const ROUTES_WITH_FORMS = [
  '/auth/register',
  '/auth/login',
  '/checkout',
  '/contacto',
  // Cualquier ruta que no sea /studio (el footer tiene NewsletterForm)
];

export function LazyRecaptchaProvider({ children }: LazyRecaptchaProviderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const pathname = usePathname();

  // Array de dependencias constante usando useMemo para evitar cambios
  const emptyDeps = useMemo(() => [], []);

  useEffect(() => {
    // Estrategia 1: Verificar si la ruta actual tiene formularios conocidos
    // Cargar inmediatamente en estas rutas (no esperar a que el formulario esté en el DOM)
    const isKnownFormRoute = pathname && ROUTES_WITH_FORMS.some(route => pathname.startsWith(route));
    
    // Estrategia 2: Si no es /studio, probablemente hay NewsletterForm en el footer
    const hasFooterForm = pathname && !pathname.startsWith('/studio');

    // Estrategia 3: Verificar si hay formularios en el DOM (inmediato)
    const hasFormsNow = typeof document !== 'undefined' && document.querySelector('form');

    if (isKnownFormRoute || hasFooterForm || hasFormsNow) {
      // Cargar reCAPTCHA inmediatamente si sabemos que hay formularios
      setShouldLoad(true);
      return;
    }

    // Si no estamos seguros, usar MutationObserver para detectar formularios que se agregan después
    // (útil para páginas con lazy loading o Suspense)
    const observer = new MutationObserver(() => {
      const hasForms = document.querySelector('form');
      if (hasForms) {
        setShouldLoad(true);
        observer.disconnect();
      }
    });

    // Observar cambios en el DOM
    if (typeof document !== 'undefined' && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // También verificar periódicamente (fallback para casos edge)
    const checkInterval = setInterval(() => {
      const hasForms = document.querySelector('form');
      if (hasForms) {
        setShouldLoad(true);
        clearInterval(checkInterval);
        observer.disconnect();
      }
    }, 500);

    // Limpiar después de 3 segundos (si no hay formularios, no cargar)
    const timeout = setTimeout(() => {
      clearInterval(checkInterval);
      observer.disconnect();
    }, 3000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [pathname, emptyDeps]);

  // Árbol estable: el provider se renderiza siempre. Cambiar el wrapper tras
  // montar remontaba SessionProvider (sesión "unauthenticated" por caché de
  // next-auth). El script de Google solo se inyecta cuando hay reCaptchaKey.
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={shouldLoad ? RECAPTCHA_SITE_KEY : ''}
      scriptProps={SCRIPT_PROPS}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
