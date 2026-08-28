/**
 * `true` cuando zustand terminó de rehidratar el carrito desde localStorage.
 * Los efectos de mount corren antes de la rehidratación, así que sin esto el
 * carrito se ve vacío por un instante (redirects y fetches falsos).
 */

'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from './useCartStore';

export function useCartHydrated(): boolean {
  // Arranca en false para que el render del servidor y el primer render del
  // cliente coincidan; el efecto lo levanta apenas termina la rehidratación.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // zustand v5 no adjunta `persist` si no hay storage disponible (SSR).
    const persist = useCartStore.persist;
    if (!persist || persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
