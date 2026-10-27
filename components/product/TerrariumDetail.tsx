/**
 * Componente Cliente para Detalle de Terrario
 * Incluye interactividad del carrito
 */

'use client';

import { Badge } from '@/components/ui';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Heart } from 'lucide-react';
import Image from 'next/image';
import type { Terrarium } from '@/types/sanity';
import type { CartItem } from '@/types/cart';
import { useMetaViewContent } from '@/lib/analytics/useMetaViewContent';
import { getImageUrl, formatPrice, sizeLabels, categoryLabels } from '@/lib/sanity/utils';

interface TerrariumDetailProps {
  terrarium: Terrarium;
}

export function TerrariumDetail({ terrarium }: TerrariumDetailProps) {
  const sizeLabel = terrarium.size ? sizeLabels[terrarium.size] : 'N/A';
  const categoryLabel = terrarium.category ? categoryLabels[terrarium.category] : 'N/A';

  // Preparar item para el carrito
  // Solo considerar shippingAvailable si localPickupOnly es false
  // Esto previene contradicciones donde ambos están en true
  const cartItem: CartItem = {
    id: terrarium._id,
    type: 'terrarium',
    name: terrarium.name,
    slug: terrarium.slug.current,
    image: getImageUrl(terrarium.images?.[0], { width: 200, height: 200 }),
    price: terrarium.price,
    currency: terrarium.currency,
    quantity: 1,
    size: sizeLabel,
    maxQuantity: terrarium.stock,
    inStock: terrarium.inStock,
    // Solo marcar como disponible para envío si shippingAvailable es true Y localPickupOnly es false
    shippingAvailable: terrarium.shippingAvailable === true && terrarium.localPickupOnly !== true,
  };

  useMetaViewContent(cartItem);

  return (
    <>
      {/* Price & CTA */}
      <div className="border-t border-b border-line py-6">
        <div className="text-4xl font-display font-bold text-fg mb-6">
          {formatPrice(terrarium.price, terrarium.currency)}
        </div>

        <div className="flex gap-4">
          <AddToCartButton item={cartItem} className="flex-1">
            {terrarium.inStock ? 'Adoptar Terrario' : 'Agotado'}
          </AddToCartButton>
          <button
            className="px-6 py-3 rounded-xl border-2 border-line hover:border-brand hover:bg-bg transition-all"
            aria-label="Guardar en favoritos"
          >
            <Heart size={24} className="text-muted hover:text-brand transition-colors" />
          </button>
        </div>

        {terrarium.localPickupOnly && (
          <p className="text-sm text-muted mt-4">
            📍 Solo retiro en persona (Santiago, Chile)
          </p>
        )}
        {terrarium.shippingAvailable && !terrarium.localPickupOnly && (
          <p className="text-sm text-muted mt-4">
            🚚 Envío disponible a todo Chile
          </p>
        )}
      </div>
    </>
  );
}

