/**
 * Componente Cliente para Detalle de Curso
 * Incluye interactividad del carrito
 */

'use client';

import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Badge } from '@/components/ui';
import type { Course } from '@/types/sanity';
import type { CartItem } from '@/types/cart';
import { getImageUrl, formatPriceWithSale, getCoursePrice } from '@/lib/sanity/utils';
import { Play } from 'lucide-react';
import { useMemo } from 'react';

interface CourseDetailProps {
  course: Course;
  userCurrency: 'CLP' | 'USD';
}

export function CourseDetail({ course, userCurrency }: CourseDetailProps) {
  // Obtener precio según moneda del usuario (sin conversión)
  const coursePricing = useMemo(
    () => getCoursePrice(course, userCurrency),
    [course, userCurrency]
  );

  const pricing = formatPriceWithSale(
    coursePricing.price,
    coursePricing.salePrice,
    coursePricing.currency
  );

  // Preparar item para el carrito
  const cartItem: CartItem = {
    id: course._id,
    type: 'course',
    name: course.name,
    slug: course.slug.current,
    image: getImageUrl(course.thumbnail, { width: 200, height: 200 }),
    price: coursePricing.salePrice || coursePricing.price,
    currency: coursePricing.currency,
    quantity: 1,
    duration: course.duration,
    maxQuantity: 1, // Un curso solo se compra una vez
    inStock: course.published !== false, // Habilitado por defecto, solo deshabilitado si explícitamente published: false
  };

  return (
    <div className="border-t border-b border-gray/20 py-6">
      <div className="space-y-2 mb-6">
        <div className="text-4xl font-display font-bold text-forest">
          {pricing.current}
        </div>
        {pricing.hasDiscount && pricing.original && (
          <div className="flex items-center gap-3">
            <div className="text-xl text-gray line-through">
              {pricing.original}
            </div>
            <Badge variant="error">
              {Math.round(((coursePricing.price - (coursePricing.salePrice || coursePricing.price)) / coursePricing.price) * 100)}% OFF
            </Badge>
          </div>
        )}
      </div>

      <AddToCartButton item={cartItem} className="w-full">
        Comenzar mi Viaje
      </AddToCartButton>

      <p className="text-sm text-gray text-center mt-4">
        ✓ Acceso de por vida • ✓ Material descargable • ✓ Aprende a tu ritmo
      </p>
    </div>
  );
}

