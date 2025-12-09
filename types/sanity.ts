/**
 * Tipos TypeScript para datos de Sanity
 */

// ============ BASE TYPES ============

export interface SanityImage {
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  caption?: string;
  hotspot?: {
    x: number;
    y: number;
  };
}

export interface Slug {
  current: string;
  _type: 'slug';
}

// ============ TERRARIUM ============

export interface Terrarium {
  _id: string;
  name: string;
  slug: Slug;
  description: string;
  longDescription?: any[]; // Rich text blocks
  images: SanityImage[];
  price: number; // Solo CLP (productos físicos solo para Chile)
  currency: 'CLP';
  inStock: boolean;
  stock: number;
  size: 'mini' | 'small' | 'medium' | 'large';
  category: 'bosque' | 'tropical' | 'desertico' | 'colgante' | 'paisaje';
  plants?: string[];
  hardscape?: string[];
  careLevel?: 'easy' | 'medium' | 'advanced';
  lightRequirement?: 'low' | 'medium' | 'high';
  wateringFrequency?: string;
  shippingAvailable?: boolean;
  shippingRegions?: string[];
  localPickupOnly?: boolean;
  featured?: boolean;
  order?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

// ============ COURSE ============

export interface CourseLesson {
  title: string;
  description?: string;
  duration: number; // minutos
  videoUrl: string;
  videoProvider: 'vimeo' | 'youtube' | 'bunny';
  isFree?: boolean;
  downloadables?: Array<{
    _key?: string;
    _type: string;
    title?: string;
    asset?: {
      _id: string;
      _type: string;
      url: string;
      originalFilename?: string;
      size?: number;
      mimeType?: string;
    };
  }>;
  order: number;
}

export interface CourseModule {
  title: string;
  description?: string;
  order: number;
  lessons: CourseLesson[];
}

export interface Course {
  _id: string;
  name: string;
  slug: Slug;
  shortDescription: string;
  longDescription?: any[]; // Rich text blocks
  thumbnail: SanityImage;
  promoVideo?: {
    url: string;
    provider: 'vimeo' | 'youtube' | 'bunny';
  };
  // Precios multi-moneda
  priceCLP?: number;
  priceUSD?: number;
  salePriceCLP?: number;
  salePriceUSD?: number;
  currency: 'CLP' | 'USD'; // Moneda principal (para compatibilidad)
  // Compatibilidad: mantener price y salePrice para migración gradual
  price?: number;
  salePrice?: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // horas
  lessonCount: number;
  modules?: CourseModule[];
  learningOutcomes?: string[];
  requirements?: string[];
  materials?: string[];
  instructor?: {
    name: string;
    bio?: string;
    photo?: SanityImage;
  };
  accessType?: 'lifetime' | '1year' | '6months';
  certificate?: boolean;
  published?: boolean;
  featured?: boolean;
  order?: number;
  enrollmentCount?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

// ============ WORKSHOP ============

export interface WorkshopDate {
  date: string; // ISO datetime
  spotsAvailable: number;
  spotsTotal: number;
  status: 'available' | 'limited' | 'sold_out' | 'cancelled';
}

export interface WorkshopLocation {
  venue: string;
  address: string;
  city: string;
  region: string;
  mapUrl?: string;
}

export interface Workshop {
  _id: string;
  name: string;
  slug: Slug;
  description: string;
  longDescription?: any[]; // Rich text blocks
  images?: SanityImage[];
  dates: WorkshopDate[];
  location: WorkshopLocation;
  price: number; // Solo CLP (talleres presenciales solo en Chile)
  currency: 'CLP';
  duration: number; // horas
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  includes?: string[];
  learningOutcomes?: string[];
  requirements?: string[];
  cancellationPolicy?: string;
  published?: boolean;
  featured?: boolean;
  order?: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

// ============ HELPERS ============

export type Product = Terrarium | Course | Workshop;

// Para tipo seguro de nivel
export const levelLabels = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  all: 'Todos los Niveles',
} as const;

// Para tipo seguro de tamaño
export const sizeLabels = {
  mini: 'Mini',
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
} as const;

// Para tipo seguro de categoría
export const categoryLabels = {
  bosque: 'Bosque Húmedo',
  tropical: 'Tropical',
  desertico: 'Desértico',
  colgante: 'Colgante',
  paisaje: 'Paisaje',
} as const;

