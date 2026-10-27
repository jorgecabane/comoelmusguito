/**
 * Componente Cliente para Detalle de Insumo
 * Incluye interactividad del carrito
 */

'use client';

import { Badge } from '@/components/ui';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Heart } from 'lucide-react';
import type { Supply } from '@/types/sanity';
import type { CartItem } from '@/types/cart';
import { useMetaViewContent } from '@/lib/analytics/useMetaViewContent';
import { getImageUrl, formatPrice, supplyCategoryLabels } from '@/lib/sanity/utils';

interface SupplyDetailProps {
  supply: Supply;
}

export function SupplyDetail({ supply }: SupplyDetailProps) {
  const categoryLabel = supply.category ? supplyCategoryLabels[supply.category] : 'N/A';

  // Preparar item para el carrito
  // Solo considerar shippingAvailable si localPickupOnly es false
  // Esto previene contradicciones donde ambos están en true
  const cartItem: CartItem = {
    id: supply._id,
    type: 'supply',
    name: supply.name,
    slug: supply.slug.current,
    image: getImageUrl(supply.images?.[0], { width: 200, height: 200 }),
    price: supply.price,
    currency: supply.currency,
    quantity: 1,
    category: categoryLabel,
    weight: supply.weight,
    maxQuantity: supply.stock,
    inStock: supply.inStock,
    // Solo marcar como disponible para envío si shippingAvailable es true Y localPickupOnly es false
    shippingAvailable: supply.shippingAvailable === true && supply.localPickupOnly !== true,
  };

  useMetaViewContent(cartItem);

  return (
    <>
      {/* Price & CTA */}
      <div className="border-t border-b border-line py-6">
        <div className="text-4xl font-display font-bold text-fg mb-6">
          {formatPrice(supply.price, supply.currency)}
        </div>

        <div className="flex gap-4">
          <AddToCartButton item={cartItem} className="flex-1">
            {supply.inStock ? 'Agregar al Carrito' : 'Agotado'}
          </AddToCartButton>
          <button
            className="px-6 py-3 rounded-xl border-2 border-line hover:border-brand hover:bg-bg transition-all"
            aria-label="Guardar en favoritos"
          >
            <Heart size={24} className="text-muted hover:text-brand transition-colors" />
          </button>
        </div>

        {supply.localPickupOnly && (
          <p className="text-sm text-muted mt-4">
            📍 Solo retiro en persona (Santiago, Chile)
          </p>
        )}
        {supply.shippingAvailable && !supply.localPickupOnly && (
          <p className="text-sm text-muted mt-4">
            🚚 Envío disponible a todo Chile
          </p>
        )}
      </div>
    </>
  );
}
