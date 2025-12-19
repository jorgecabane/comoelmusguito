/**
 * Componente para prefetch de páginas importantes
 * Mejora la velocidad de navegación
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PrefetchLinks() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch de páginas importantes
    const importantPages = [
      '/terrarios',
      '/cursos',
      '/talleres',
      '/sobre',
      '/auth/login',
      '/auth/register',
      '/mi-cuenta',
      '/carrito',
    ];

    // Prefetch después de un pequeño delay para no bloquear el render inicial
    const timeout = setTimeout(() => {
      importantPages.forEach((page) => {
        router.prefetch(page);
      });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return null;
}
