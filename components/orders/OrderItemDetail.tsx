/**
 * Componente para mostrar detalles de un item de orden
 * Permite hacer click para ver el producto (usando snapshot si existe)
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { ExternalLink, Package, BookOpen, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/sanity/utils';
import type { SanityOrder } from '@/lib/sanity/orders';

interface OrderItemDetailProps {
  item: SanityOrder['items'][0];
  orderId: string;
}

export function OrderItemDetail({ item, orderId }: OrderItemDetailProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Determinar si tenemos snapshot o si el producto aún existe
  const hasSnapshot = !!item.snapshot;
  const imageUrl = item.snapshot?.image || '/images/placeholder.jpg';
  const description = item.snapshot?.description || 'Producto comprado';

  // Icono según tipo
  const getIcon = () => {
    switch (item.type) {
      case 'terrarium':
        return <Package size={20} className="text-musgo" />;
      case 'course':
        return <BookOpen size={20} className="text-musgo" />;
      case 'workshop':
        return <Calendar size={20} className="text-musgo" />;
      default:
        return null;
    }
  };

  // Intentar link al producto (si aún existe)
  const productUrl =
    item.type === 'terrarium'
      ? `/terrarios/${item.slug}`
      : item.type === 'course'
      ? `/cursos/${item.slug}`
      : `/talleres/${item.slug}`;

  return (
    <div className="group">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between text-left p-3 rounded-lg hover:bg-cream/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-forest truncate">{item.name}</p>
            <p className="text-xs text-gray">
              {item.type === 'terrarium' && '🌿 Terrario'}
              {item.type === 'course' && '🎓 Curso Online'}
              {item.type === 'workshop' && '🤝 Taller Presencial'}
              {' · '}
              Cantidad: {item.quantity}
            </p>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="font-semibold text-forest">
            {formatCurrency(item.price * item.quantity, item.currency)}
          </p>
        </div>
      </button>

      {/* Detalles expandidos */}
      {showDetails && (
        <Card className="mt-2 p-4">
          <div className="flex gap-4">
            {imageUrl && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-semibold text-forest mb-2">
                {item.name}
              </h4>
              {description && (
                <p className="text-sm text-gray mb-3 line-clamp-2">
                  {description}
                </p>
              )}
              <div className="flex items-center gap-2">
                {hasSnapshot ? (
                  <span className="text-xs text-gray italic">
                    (Vista del producto al momento de compra)
                  </span>
                ) : (
                  <Link
                    href={productUrl}
                    className="text-xs text-musgo hover:text-forest flex items-center gap-1 transition-colors"
                  >
                    Ver producto actual
                    <ExternalLink size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}


