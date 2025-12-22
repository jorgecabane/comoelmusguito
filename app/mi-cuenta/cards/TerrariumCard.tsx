/**
 * Card de Terrario para el feed de Mi Cuenta
 * Muestra información del terrario y cuidados básicos
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sprout, Droplet, Sun, Info, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui';
import { getFirstImage } from '@/lib/sanity/utils';
import { formatDateShort } from '@/lib/sanity/utils';

interface TerrariumCardProps {
  item: {
    id: string;
    name: string;
    slug: string;
    quantity: number;
    orderId: string;
    orderDate: string;
    terrarium: any;
  };
}

const careLevelLabels: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Intermedio',
  advanced: 'Avanzado',
};

const lightLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export function TerrariumCard({ item }: TerrariumCardProps) {
  const terrarium = item.terrarium;
  const imageUrl = terrarium?.images
    ? getFirstImage(terrarium.images, { width: 800 })
    : '/images/placeholder-terrarium.jpg';

  return (
    <Link href={`/terrarios/${item.slug}`}>
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
          
          {/* Overlay con info al hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-white">
            {terrarium?.plants && terrarium.plants.length > 0 && (
              <p className="text-sm mb-2 opacity-90">
                {terrarium.plants.slice(0, 2).join(' • ')}
              </p>
            )}
            <p className="font-semibold">
              Ver detalles y cuidados completos →
            </p>
          </div>

          {/* Badge de cantidad */}
          {item.quantity > 1 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-semibold text-forest">
              x{item.quantity}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 flex flex-col flex-1">
          <div>
            <h3 className="font-display text-xl font-bold text-forest mb-2 group-hover:text-musgo transition-colors">
              {item.name}
            </h3>
            <p className="text-sm text-gray">
              Comprado el {formatDateShort(item.orderDate)}
            </p>
          </div>

          {/* Info del terrario */}
          {terrarium && (
            <div className="space-y-3 pt-2 border-t border-gray/20">
              {terrarium.size && (
                <div className="flex items-center gap-2 text-sm text-gray">
                  <Info size={16} />
                  <span>Tamaño: {terrarium.size}</span>
                </div>
              )}
              
              {terrarium.careLevel && (
                <div className="flex items-center gap-2 text-sm text-gray">
                  <Sprout size={16} />
                  <span>Cuidado: {careLevelLabels[terrarium.careLevel] || terrarium.careLevel}</span>
                </div>
              )}

              {terrarium.lightRequirement && (
                <div className="flex items-center gap-2 text-sm text-gray">
                  <Sun size={16} />
                  <span>Luz: {lightLabels[terrarium.lightRequirement] || terrarium.lightRequirement}</span>
                </div>
              )}

              {terrarium.wateringFrequency && (
                <div className="flex items-center gap-2 text-sm text-gray">
                  <Droplet size={16} />
                  <span>Riego: {terrarium.wateringFrequency}</span>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="pt-2 flex items-center gap-2 text-musgo font-medium group-hover:gap-3 transition-all">
            <span>Ver cuidados completos</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
