/**
 * Sanity Studio Page
 * Acceso al CMS en /studio
 */

'use client';

import dynamic from 'next/dynamic';
import config from '@/sanity/sanity.config';

// Importar StudioWrapper dinámicamente para evitar problemas con React 19
// El wrapper suprime warnings conocidos de compatibilidad entre React 19 y Sanity Studio
const StudioWrapper = dynamic(
  () => import('@/components/studio/StudioWrapper').then((mod) => mod.StudioWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-gray">Cargando Sanity Studio...</p>
        </div>
      </div>
    ),
  }
);

export default function StudioPage() {
  return (
    // El Studio se dimensiona al 100% de su contenedor. Fijándolo bajo el header
    // (h-20) su propia barra superior deja de quedar tapada por el del sitio.
    <div className="fixed inset-x-0 bottom-0 top-20">
      <StudioWrapper config={config} />
    </div>
  );
}

