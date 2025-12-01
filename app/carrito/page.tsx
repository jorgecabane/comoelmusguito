/**
 * Página del Carrito de Compras
 * Lista de productos, totales y checkout
 */

'use client';

import { useCartStore } from '@/lib/store/useCartStore';
import { Button, Badge } from '@/components/ui';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatWorkshopDateTime } from '@/lib/sanity/utils';

export default function CarritoPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCartStore();

  // Carrito vacío
  if (items.length === 0) {
    return (
      <div className="pt-32 pb-16">
        <div className="container max-w-4xl">
          <div className="text-center py-20">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-8xl mb-6"
            >
              🌱
            </motion.div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-forest mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-gray text-lg mb-8">
              ¿Listo para crear vida? Explora nuestros productos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/terrarios">
                <Button variant="primary" size="lg">
                  Ver Terrarios
                </Button>
              </Link>
              <Link href="/cursos">
                <Button variant="secondary" size="lg">
                  Ver Cursos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agrupar items por tipo
  const terrarios = items.filter((item) => item.type === 'terrarium');
  const cursos = items.filter((item) => item.type === 'course');
  const talleres = items.filter((item) => item.type === 'workshop');

  // Calcular totales por moneda
  const totalesPorMoneda = items.reduce((acc, item) => {
    const total = item.price * item.quantity;
    if (!acc[item.currency]) {
      acc[item.currency] = 0;
    }
    acc[item.currency] += total;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="pt-32 pb-16">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray hover:text-musgo transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Seguir comprando
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-forest">
                Tu Carrito 🌱
              </h1>
              <p className="text-gray mt-2">
                {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en tu jardín
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('¿Estás seguro de vaciar el carrito?')) {
                  clearCart();
                }
              }}
              className="text-error hover:text-error/80"
            >
              <Trash2 size={18} />
              Vaciar carrito
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Terrarios */}
            {terrarios.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest mb-4">
                  Terrarios
                </h2>
                <div className="space-y-4">
                  {terrarios.map((item) => (
                    <CartItemCard
                      key={`${item.id}-${item.type}`}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cursos */}
            {cursos.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest mb-4">
                  Cursos Online
                </h2>
                <div className="space-y-4">
                  {cursos.map((item) => (
                    <CartItemCard
                      key={`${item.id}-${item.type}`}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Talleres */}
            {talleres.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest mb-4">
                  Talleres Presenciales
                </h2>
                <div className="space-y-4">
                  {talleres.map((item) => (
                    <CartItemCard
                      key={`${item.id}-${item.type}`}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumen de compra */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-cream rounded-2xl p-6 space-y-6">
              <h2 className="font-display text-2xl font-semibold text-forest">
                Resumen
              </h2>

              <div className="space-y-3 py-4 border-y border-gray/20">
                <div className="flex justify-between text-gray">
                  <span>Productos ({itemCount})</span>
                  <div className="text-right">
                    {Object.entries(totalesPorMoneda).map(([currency, total]) => (
                      <div key={currency}>
                        ${total.toLocaleString('es-CL')} {currency}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-gray">
                  <span>Envío</span>
                  <span>Calculado en checkout</span>
                </div>
              </div>

              <div className="py-4 border-b border-gray/20">
                <div className="flex justify-between items-baseline">
                  <span className="font-display text-xl font-semibold text-forest">
                    Total
                  </span>
                  <div className="text-right">
                    {Object.entries(totalesPorMoneda).map(([currency, total]) => (
                      <div
                        key={currency}
                        className="font-display text-2xl font-bold text-forest"
                      >
                        ${total.toLocaleString('es-CL')} {currency}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Link href="/checkout">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={<ShoppingBag size={20} />}
                >
                  Proceder al Pago
                </Button>
              </Link>

              <div className="text-center text-sm text-gray">
                <p>Pago seguro con Flow</p>
                <p className="mt-2">🔒 Tus datos están protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para cada item del carrito
function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: any;
  onUpdateQuantity: (id: string, type: any, quantity: number) => void;
  onRemove: (id: string, type: any) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray/10">
      <div className="flex gap-4">
        {/* Imagen */}
        <Link href={`/${getTypeUrl(item.type)}/${item.slug}`} className="shrink-0">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover hover:scale-110 transition-transform"
              sizes="96px"
            />
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link
              href={`/${getTypeUrl(item.type)}/${item.slug}`}
              className="hover:text-musgo transition-colors"
            >
              <h3 className="font-semibold text-forest line-clamp-1">
                {item.name}
              </h3>
            </Link>
            <button
              onClick={() => onRemove(item.id, item.type)}
              className="text-gray hover:text-error transition-colors p-1"
              aria-label="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Detalles */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="default" size="sm">
              {getTypeLabel(item.type)}
            </Badge>
            {item.size && (
              <Badge variant="default" size="sm">
                {item.size}
              </Badge>
            )}
            {item.duration && (
              <Badge variant="default" size="sm">
                {item.duration}h
              </Badge>
            )}
          </div>

          {/* Fecha seleccionada (talleres) */}
          {item.selectedDate && (
            <p className="text-sm text-gray mb-3">
              📅 {(() => {
                const { date, time } = formatWorkshopDateTime(item.selectedDate.date);
                const fullDate = new Date(item.selectedDate.date).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                return `${fullDate} a las ${time}`;
              })()}
            </p>
          )}

          {/* Cantidad y precio */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.type, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 rounded-lg border border-gray/20 flex items-center justify-center hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.type, item.quantity + 1)}
                disabled={item.maxQuantity && item.quantity >= item.maxQuantity}
                className="w-8 h-8 rounded-lg border border-gray/20 flex items-center justify-center hover:bg-cream disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="text-right">
              <div className="font-semibold text-forest">
                ${(item.price * item.quantity).toLocaleString('es-CL')} {item.currency}
              </div>
              {item.quantity > 1 && (
                <div className="text-sm text-gray">
                  ${item.price.toLocaleString('es-CL')} c/u
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function getTypeUrl(type: string) {
  const urls: Record<string, string> = {
    terrarium: 'terrarios',
    course: 'cursos',
    workshop: 'talleres',
  };
  return urls[type] || 'terrarios';
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    terrarium: 'Terrario',
    course: 'Curso Online',
    workshop: 'Taller',
  };
  return labels[type] || type;
}

