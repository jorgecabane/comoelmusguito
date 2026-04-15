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
/**
 * Formatear precio con moneda (alias para compatibilidad)
 */
export function formatCurrency(amount: number, currency: 'CLP' | 'USD'): string {
  if (currency === 'CLP') {
    return `$${amount.toLocaleString('es-CL')} CLP`;
  } else {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  }
}

export function formatPrice(price: number, currency: 'CLP' | 'USD' = 'CLP'): string {
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  }
  return `$${price.toLocaleString('es-CL')} CLP`;
}

/**
 * Formatear precio con descuento (versión simple)
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

/**
 * Obtener precio de curso según moneda del usuario
 * Sin conversión - solo muestra el precio que existe para esa moneda
 */
export function getCoursePrice(
  course: {
    priceCLP?: number;
    priceUSD?: number;
    salePriceCLP?: number;
    salePriceUSD?: number;
    price?: number; // Compatibilidad
    salePrice?: number; // Compatibilidad
    currency?: 'CLP' | 'USD';
  },
  userCurrency: 'CLP' | 'USD'
): {
  price: number;
  salePrice?: number;
  currency: 'CLP' | 'USD';
} {
  // Si el usuario está en Chile, priorizar CLP
  if (userCurrency === 'CLP') {
    // Si existe precioCLP, usarlo
    if (course.priceCLP) {
      return {
        price: course.priceCLP,
        salePrice: course.salePriceCLP,
        currency: 'CLP',
      };
    }
    // Si no existe precioCLP pero existe price (compatibilidad), usarlo
    if (course.price) {
      return {
        price: course.price,
        salePrice: course.salePrice,
        currency: course.currency || 'CLP',
      };
    }
    // Si no hay precio en CLP, usar USD (sin conversión)
    if (course.priceUSD) {
      return {
        price: course.priceUSD,
        salePrice: course.salePriceUSD,
        currency: 'USD',
      };
    }
  }

  // Si el usuario está fuera de Chile, priorizar USD
  if (userCurrency === 'USD') {
    // Si existe priceUSD, usarlo
    if (course.priceUSD) {
      return {
        price: course.priceUSD,
        salePrice: course.salePriceUSD,
        currency: 'USD',
      };
    }
    // Si no existe priceUSD pero existe price (compatibilidad), usarlo
    if (course.price) {
      return {
        price: course.price,
        salePrice: course.salePrice,
        currency: course.currency || 'CLP',
      };
    }
    // Si no hay precio en USD, usar CLP (sin conversión)
    if (course.priceCLP) {
      return {
        price: course.priceCLP,
        salePrice: course.salePriceCLP,
        currency: 'CLP',
      };
    }
  }

  // Fallback: usar precio disponible
  return {
    price: course.priceCLP ?? course.priceUSD ?? course.price ?? 0,
    salePrice: course.salePriceCLP ?? course.salePriceUSD ?? course.salePrice,
    currency: course.currency || 'CLP',
  };
}

// ============ FECHAS ============
// Todas las fechas se muestran en hora local chilena (America/Santiago),
// sin importar el TZ del proceso. Las fechas vienen de Sanity como ISO UTC.

const CHILE_TZ = 'America/Santiago';

function toValidDate(dateString: string | undefined | null): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Fecha larga con hora: "lunes, 15 de mayo de 2025, 03:30 p. m."
 */
export function formatDate(dateString: string): string {
  const date = toValidDate(dateString);
  if (!date) return '';
  return date.toLocaleString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: CHILE_TZ,
  });
}

/**
 * Fecha corta sin hora: "15 may 2025"
 */
export function formatDateShort(dateString: string): string {
  const date = toValidDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: CHILE_TZ,
  });
}

/**
 * Fecha larga sin hora: "15 de mayo de 2025"
 */
export function formatDateLong(dateString: string): string {
  const date = toValidDate(dateString);
  if (!date) return '';
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: CHILE_TZ,
  });
}

/**
 * Hora en formato 12h chileno: "3:30 p. m."
 */
export function formatTime(dateString: string): string {
  const date = toValidDate(dateString);
  if (!date) return '';
  // Intl en es-CL devuelve "p. m." con espacios NBSP; normalizamos a espacios regulares.
  return date
    .toLocaleTimeString('es-CL', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: CHILE_TZ,
    })
    .replace(/\u202F|\u00A0/g, ' ');
}

/**
 * Fecha corta + hora separadas: { date: "15 may", time: "3:30 p. m." }
 */
export function formatWorkshopDateTime(dateString: string): {
  date: string;
  time: string;
} {
  const date = toValidDate(dateString);
  if (!date) return { date: '', time: '' };
  const dateStr = date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    timeZone: CHILE_TZ,
  });
  return { date: dateStr, time: formatTime(dateString) };
}

/**
 * Fecha completa combinada: "15 de mayo de 2025 a las 3:30 p. m."
 * Ideal para emails donde queremos un string único natural.
 */
export function formatWorkshopDateFull(dateString: string): string {
  const dateStr = formatDateLong(dateString);
  const timeStr = formatTime(dateString);
  if (!dateStr) return '';
  if (!timeStr) return dateStr;
  return `${dateStr} a las ${timeStr}`;
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

export const supplyCategoryLabels = {
  sustrato: '🌱 Sustrato',
  herramienta: '🔧 Herramienta',
  kit: '📦 Kit',
  frasco: '🍶 Frasco',
  urna: '🏺 Urna',
  accesorio: '✨ Accesorio',
  material: '🧱 Material',
} as const;
