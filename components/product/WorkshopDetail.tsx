/**
 * Componente Cliente para Detalle de Taller
 * Incluye selector de fecha y carrito
 */

'use client';

import { useState } from 'react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Badge } from '@/components/ui';
import type { Workshop } from '@/types/sanity';
import type { CartItem } from '@/types/cart';
import { getImageUrl, formatPrice, formatDateShort } from '@/lib/sanity/utils';
import { Calendar } from 'lucide-react';

interface WorkshopDetailProps {
  workshop: Workshop;
}

export function WorkshopDetail({ workshop }: WorkshopDetailProps) {
  // Filtrar fechas futuras y disponibles
  const fechasDisponibles = workshop.dates
    ?.filter((date) => {
      const fechaTaller = new Date(date.date);
      return fechaTaller > new Date() && date.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const [selectedDateIndex, setSelectedDateIndex] = useState<number | null>(
    fechasDisponibles && fechasDisponibles.length > 0 ? 0 : null
  );

  const selectedDate = selectedDateIndex !== null && fechasDisponibles 
    ? fechasDisponibles[selectedDateIndex] 
    : null;

  const hayCuposDisponibles = fechasDisponibles?.some((f) => f.status !== 'sold_out');

  // Preparar item para el carrito (solo si hay fecha seleccionada)
  const cartItem: CartItem | null = selectedDate ? {
    id: workshop._id,
    type: 'workshop',
    name: workshop.name,
    slug: workshop.slug.current,
    image: getImageUrl(workshop.images?.[0], { width: 200, height: 200 }),
    price: workshop.price,
    currency: workshop.currency,
    quantity: 1,
    selectedDate: {
      date: selectedDate.date,
      spotsAvailable: selectedDate.spotsAvailable,
      price: workshop.price,
    },
    maxQuantity: selectedDate.spotsAvailable,
    inStock: selectedDate.status !== 'sold_out',
  } : null;

  return (
    <div className="sticky top-24 space-y-6">
      <div className="bg-white border border-gray/20 rounded-2xl p-6 space-y-6">
        <div>
          <div className="text-3xl font-display font-bold text-forest mb-2">
            {formatPrice(workshop.price, workshop.currency)}
          </div>
          <p className="text-sm text-gray">por persona</p>
        </div>

        {/* Selector de Fechas */}
        <div>
          <h3 className="font-display text-lg font-semibold text-forest mb-4">
            Fechas Disponibles
          </h3>
          {fechasDisponibles && fechasDisponibles.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fechasDisponibles.map((fecha, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDateIndex(index)}
                  disabled={fecha.status === 'sold_out'}
                  className={`w-full border-2 rounded-lg p-3 flex items-center justify-between transition-all ${
                    selectedDateIndex === index
                      ? 'border-musgo bg-vida/5'
                      : 'border-gray/20 hover:border-gray/40'
                  } ${fecha.status === 'sold_out' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Calendar size={16} className="text-musgo" />
                    <div>
                      <div className="font-semibold text-forest text-sm">
                        {new Date(fecha.date).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-xs text-gray">
                        {new Date(fecha.date).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      fecha.status === 'available'
                        ? 'success'
                        : fecha.status === 'limited'
                        ? 'warning'
                        : 'error'
                    }
                    size="sm"
                  >
                    {fecha.status === 'sold_out'
                      ? 'Agotado'
                      : `${fecha.spotsAvailable} cupos`}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray">
              <p className="mb-2">Sin fechas disponibles</p>
              <p className="text-sm">Estamos organizando nuevas fechas pronto</p>
            </div>
          )}
        </div>

        {cartItem ? (
          <AddToCartButton item={cartItem} className="w-full">
            Reservar Cupo
          </AddToCartButton>
        ) : (
          <button
            disabled
            className="w-full py-3 px-6 rounded-xl bg-gray/20 text-gray cursor-not-allowed"
          >
            {!hayCuposDisponibles ? 'Sin Cupos' : 'Selecciona una fecha'}
          </button>
        )}

        <p className="text-xs text-gray text-center">
          Al reservar, aceptas nuestra política de cancelación
        </p>
      </div>
    </div>
  );
}

