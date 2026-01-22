/**
 * Card de Insumo para el feed de Mi Cuenta
 * Muestra información del insumo
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Wrench, Package, ArrowRight, Gift } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { getFirstImage, formatDateShort, supplyCategoryLabels } from '@/lib/sanity/utils';
import type { Supply, SupplyCategory } from '@/types/sanity';

interface SupplyCardProps {
  item: {
    id: string;
    name: string;
    slug: string;
    quantity: number;
    orderId: string;
    orderDate: string;
    supply: Supply | null;
    isGift?: boolean;
    giftSenderName?: string;
    giftSenderEmail?: string;
  };
}

export function SupplyCard({ item }: SupplyCardProps) {
  const supply = item.supply;
  const imageUrl = supply?.images
    ? getFirstImage(supply.images, { width: 800 })
    : '/images/placeholder.jpg';
  
  const categoryLabel = supply?.category 
    ? supplyCategoryLabels[supply.category as SupplyCategory] 
    : 'Insumo';

  return (
    <Link href={`/insumos/${item.slug}`}>
      <Card hover padding="none" className="group h-full flex flex-col overflow-hidden">
        {/* Imagen */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          
          {/* Badge de regalo */}
          {item.isGift && (
            <div className="absolute top-4 right-4">
              <Badge variant="default" size="sm" className="bg-vida/90 text-white">
                <Gift size={14} className="mr-1" />
                Regalo
              </Badge>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="default" size="sm">
              {categoryLabel}
            </Badge>
            {item.isGift && (
              <span className="text-xs text-gray">
                De: {item.giftSenderName || 'Un amigo'}
              </span>
            )}
          </div>

          <h3 className="font-display text-xl font-semibold text-forest mb-2 group-hover:text-musgo transition-colors">
            {item.name}
          </h3>

          {supply?.brand && (
            <p className="text-sm text-gray mb-3">
              Marca: {supply.brand}
            </p>
          )}

          <div className="mt-auto pt-4 border-t border-gray/20 flex items-center justify-between">
            <div className="text-sm text-gray">
              Comprado el {formatDateShort(item.orderDate)}
            </div>
            <ArrowRight 
              size={18} 
              className="text-musgo opacity-0 group-hover:opacity-100 transition-opacity" 
            />
          </div>
        </div>
      </Card>
    </Link>
  );
}
