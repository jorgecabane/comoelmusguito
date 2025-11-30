/**
 * Componente Cliente para Detalle de Curso
 * Incluye interactividad del carrito
 */

'use client';

import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Badge } from '@/components/ui';
import type { Course } from '@/types/sanity';
import type { CartItem } from '@/types/cart';
import { getImageUrl, formatPriceWithSale } from '@/lib/sanity/utils';
import { Play } from 'lucide-react';

interface CourseDetailProps {
  course: Course;
}

export function CourseDetail({ course }: CourseDetailProps) {
  const pricing = formatPriceWithSale(course.price, course.salePrice, course.currency);

  // Preparar item para el carrito
  const cartItem: CartItem = {
    id: course._id,
    type: 'course',
    name: course.name,
    slug: course.slug.current,
    image: getImageUrl(course.thumbnail, { width: 200, height: 200 }),
    price: course.salePrice || course.price,
    currency: course.currency,
    quantity: 1,
    duration: course.duration,
    maxQuantity: 1, // Un curso solo se compra una vez
    inStock: course.published || false,
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
              {Math.round(((course.price - (course.salePrice || course.price)) / course.price) * 100)}% OFF
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

