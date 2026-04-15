/**
 * Card de Taller para el feed de Mi Cuenta
 * Muestra fecha, hora y ubicación del taller
 */

'use client';

import Link from 'next/link';
import { Calendar, Clock, MapPin, ArrowRight, Gift } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatDateShort, formatDateLong, formatTime } from '@/lib/sanity/utils';

interface WorkshopCardProps {
  item: {
    id: string;
    name: string;
    slug: string;
    selectedDate?: {
      date: string;
      time?: string;
    };
    orderId: string;
    orderDate: string;
    paymentDate?: string;
    isGift?: boolean;
    giftSenderName?: string;
    giftSenderEmail?: string;
  };
}

export function WorkshopCard({ item }: WorkshopCardProps) {
  const workshopDate = item.selectedDate?.date
    ? new Date(item.selectedDate.date)
    : null;

  const isUpcoming = workshopDate && workshopDate > new Date();
  const isPast = workshopDate && workshopDate < new Date();

  const workshopDateLong = item.selectedDate?.date
    ? formatDateLong(item.selectedDate.date)
    : '';
  const workshopTime = item.selectedDate?.date
    ? formatTime(item.selectedDate.date)
    : '';

  return (
    <Link href={`/talleres/${item.slug}`}>
      <Card hover padding="lg" className="group h-full flex flex-col">
        <div className="space-y-4 flex flex-col flex-1">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-display text-xl font-bold text-forest group-hover:text-musgo transition-colors">
                {item.name}
              </h3>
              {item.isGift && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cream border border-musgo/30 text-musgo text-xs font-medium">
                  <Gift size={12} />
                  Regalo
                </span>
              )}
            </div>
            <p className="text-sm text-gray">
              {item.isGift && item.giftSenderName
                ? `Regalo de ${item.giftSenderName} • ${formatDateShort(item.orderDate)}`
                : `Reservado el ${formatDateShort(item.orderDate)}`}
            </p>
          </div>

          {/* Fecha y hora */}
          {workshopDate && (
            <div className="space-y-3 pt-2 border-t border-gray/20">
              <div className="flex items-start gap-3">
                <Calendar className="text-musgo mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-forest">
                    {workshopDateLong}
                  </p>
                  {workshopTime && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray">
                      <Clock size={16} />
                      <span>{workshopTime}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-2">
                {isUpcoming && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-musgo/20 text-musgo text-xs font-medium">
                    Próximamente
                  </span>
                )}
                {isPast && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray/20 text-gray text-xs font-medium">
                    Completado
                  </span>
                )}
              </div>

              {/* Ubicación */}
              <div className="flex items-start gap-3 pt-2 border-t border-gray/10">
                <MapPin className="text-musgo mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-forest text-sm">Ubicación</p>
                  <p className="text-sm text-gray">
                    Santa Isabel 676, Providencia, Santiago
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pt-2 mt-auto flex items-center gap-2 text-musgo font-medium group-hover:gap-3 transition-all">
            <span>Ver detalles del taller</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
