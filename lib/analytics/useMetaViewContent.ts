'use client';

/**
 * Dispara `ViewContent` una vez cuando se muestra el detalle de un producto.
 * Pensado para usarse dentro de los componentes de detalle (ya son de cliente).
 *
 * Algunas páginas montan el mismo componente de detalle varias veces (por ejemplo
 * el curso: cabecera, barra lateral y cierre) y en desarrollo React ejecuta los
 * efectos dos veces: la clave "ruta + producto" evita contar la vista más de una vez.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackMeta } from '@/lib/analytics/meta';

interface ViewedProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
}

let lastTracked = '';

export function useMetaViewContent({ id, name, price, currency }: ViewedProduct): void {
  const pathname = usePathname();

  useEffect(() => {
    const key = `${pathname}|${id}`;
    if (key === lastTracked) return;
    lastTracked = key;
    trackMeta('ViewContent', {
      content_ids: [id],
      content_type: 'product',
      content_name: name,
      value: price,
      currency,
    });
    // Al salir de la ruta se limpia la clave: volver al mismo producto más tarde cuenta otra vista
    return () => {
      lastTracked = '';
    };
    // Solo al ver un producto distinto: un cambio de precio o moneda no debe repetir el evento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, id]);
}
