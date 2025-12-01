/**
 * Sanity Utilities
 * Helpers para trabajar con datos de Sanity
 */

import { getSanityImageUrl } from '@/sanity/lib/image';
import type { SanityImage, Slug } from '@/types/sanity';

// ============ IMÁGENES ============

/**
 * Obtener URL de imagen de Sanity
 */
export function getImageUrl(
  image: SanityImage | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  if (!image?.asset) {
    return '/images/placeholder.jpg'; // Fallback
  }

  return getSanityImageUrl(image, {
    width: options?.width || 800,
    quality: options?.quality || 90,
    format: 'webp',
    ...options,
  });
}

/**
 * Obtener primera imagen de un array
 */
export function getFirstImage(
  images: SanityImage[] | undefined,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  if (!images || images.length === 0) {
    return '/images/placeholder.jpg';
  }

  return getImageUrl(images[0], options);
}

// ============ PRECIOS ============

/**
 * Formatear precio según moneda
 */
export function formatPrice(price: number, currency: 'CLP' | 'USD' = 'CLP'): string {
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US')} USD`;
  }
  return `$${price.toLocaleString('es-CL')} CLP`;
}

/**
 * Formatear precio con descuento
 */
export function formatPriceWithSale(
  price: number,
  salePrice: number | undefined,
  currency: 'CLP' | 'USD' = 'CLP'
): {
  current: string;
  original?: string;
  hasDiscount: boolean;
} {
  const hasDiscount = salePrice && salePrice < price;
  
  return {
    current: formatPrice(hasDiscount ? salePrice : price, currency),
    original: hasDiscount ? formatPrice(price, currency) : undefined,
    hasDiscount: !!hasDiscount,
  };
}

// ============ FECHAS ============

/**
 * Formatear fecha para talleres
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatear fecha corta
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Formatear hora de forma consistente (evita errores de hidratación)
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  // Usar formato manual para evitar diferencias servidor/cliente
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
  const hours12 = hours % 12 || 12;
  const minutesStr = minutes.toString().padStart(2, '0');
  return `${hours12}:${minutesStr} ${ampm}`;
}

/**
 * Formatear fecha y hora para talleres
 */
export function formatWorkshopDateTime(dateString: string): {
  date: string;
  time: string;
} {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
  });
  const timeStr = formatTime(dateString);
  return { date: dateStr, time: timeStr };
}

// ============ SLUG ============

/**
 * Obtener string del slug
 */
export function getSlugString(slug: Slug | string | undefined): string {
  if (!slug) return '';
  if (typeof slug === 'string') return slug;
  return slug.current;
}

// ============ RICH TEXT ============

/**
 * Extraer texto plano de rich text blocks (para previews)
 */
export function extractPlainText(blocks: any[] | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return '';
  
  return blocks
    .filter((block) => block._type === 'block')
    .map((block) => {
      if (!block.children) return '';
      return block.children
        .filter((child: any) => child._type === 'span')
        .map((child: any) => child.text)
        .join('');
    })
    .join(' ');
}

// ============ LABELS ============

export const sizeLabels = {
  mini: 'Mini',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
} as const;

export const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  all: 'Todos los Niveles',
} as const;

export const categoryLabels = {
  bosque: 'Bosque Húmedo',
  tropical: 'Tropical',
  desertico: 'Desértico',
  colgante: 'Colgante',
  paisaje: 'Paisaje',
} as const;

