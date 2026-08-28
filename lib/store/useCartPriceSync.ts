/**
 * Refresca los precios del carrito contra Sanity al montar la vista.
 * El carrito vive en localStorage con un precio congelado; si el precio cambia
 * en Studio, el checkout lo rechazaría por anti-tampering. Aquí lo reconciliamos
 * antes de que el usuario pague.
 */

'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from './useCartStore';
import { useCartHydrated } from './useCartHydrated';

export function useCartPriceSync(): boolean {
  const [pricesUpdated, setPricesUpdated] = useState(false);
  const hydrated = useCartHydrated();

  useEffect(() => {
    if (!hydrated) return;

    const { items } = useCartStore.getState();
    if (items.length === 0) return;

    const controller = new AbortController();

    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // gateway 'flow' mantiene cada item en su moneda original (paypal convierte a USD).
      body: JSON.stringify({ items, gateway: 'flow' }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.items) return;
        setPricesUpdated(useCartStore.getState().syncPrices(data.items));
      })
      .catch(() => {
        // Sin red o item inválido: se mantiene el precio local y el checkout valida igual.
      });

    return () => controller.abort();
  }, [hydrated]);

  return pricesUpdated;
}
