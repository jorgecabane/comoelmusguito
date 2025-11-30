/**
 * Utilidades para generar metadata SEO consistente
 */

import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.com';
const SITE_NAME = 'comoelmusguito';
const SITE_DESCRIPTION = 'Descubre terrarios artesanales únicos y aprende a crear ecosistemas autosustentables con el Musguito. Cursos online, talleres presenciales y terrarios hechos a mano en Chile.';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  modifiedAt?: string;
  noIndex?: boolean;
}

/**
 * Genera metadata completa para SEO
 */
export function generateSEOMetadata({
  title,
  description = SITE_DESCRIPTION,
  keywords = [],
  image = '/og/default.jpg',
  url = SITE_URL,
  type = 'website',
  publishedAt,
  modifiedAt,
  noIndex = false,
}: SEOProps): Metadata {
  const fullTitle = title.includes(SITE_NAME) 
    ? title 
    : `${title} | ${SITE_NAME}`;
  
  const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;
  
  return {
    title: fullTitle,
    description,
    keywords: [...keywords, 'terrarios Chile', 'terrarios artesanales', SITE_NAME],
    authors: [{ name: 'Tomás Barrera (comoelmusguito)' }],
    creator: 'Tomás Barrera',
    publisher: SITE_NAME,
    
    openGraph: {
      type,
      locale: 'es_CL',
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedAt && { publishedTime: publishedAt }),
      ...(modifiedAt && { modifiedTime: modifiedAt }),
    },
    
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@comoelmusguito',
    },
    
    alternates: {
      canonical: url,
      languages: {
        'es-CL': url,
      },
    },
    
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Metadata para productos
 */
export function generateProductMetadata({
  name,
  description,
  images,
  price,
  currency = 'CLP',
  slug,
  category,
  inStock = true,
}: {
  name: string;
  description: string;
  images: string[];
  price: number;
  currency?: string;
  slug: string;
  category?: string;
  inStock?: boolean;
}): Metadata {
  return generateSEOMetadata({
    title: `${name} - Terrario Artesanal`,
    description,
    keywords: [
      name,
      'terrario artesanal',
      'terrario Chile',
      'comprar terrario',
      category || '',
    ].filter(Boolean),
    image: images[0],
    url: `${SITE_URL}/terrarios/${slug}`,
    type: 'website', // Productos usan schema.org para metadata rica
  });
}

/**
 * Metadata para cursos
 */
export function generateCourseMetadata({
  name,
  description,
  thumbnail,
  slug,
  topics = [],
}: {
  name: string;
  description: string;
  thumbnail: string;
  slug: string;
  topics?: string[];
}): Metadata {
  return generateSEOMetadata({
    title: `${name} - Curso Online`,
    description: `${description} Aprende a crear terrarios a tu propio ritmo.`,
    keywords: [
      'curso terrarios online',
      'aprender terrarios',
      'curso online Chile',
      name,
      ...topics,
    ],
    image: thumbnail,
    url: `${SITE_URL}/cursos/${slug}`,
    type: 'website',
  });
}

/**
 * Metadata para blog posts
 */
export function generateBlogMetadata({
  title,
  excerpt,
  coverImage,
  slug,
  publishedAt,
  modifiedAt,
  tags = [],
}: {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  tags?: string[];
}): Metadata {
  return generateSEOMetadata({
    title,
    description: excerpt,
    keywords: [...tags, 'terrarios', 'blog terrarios'],
    image: coverImage,
    url: `${SITE_URL}/blog/${slug}`,
    type: 'article',
    publishedAt,
    modifiedAt,
  });
}

/**
 * Constantes de metadata reutilizables
 */
export const DEFAULT_KEYWORDS = [
  'terrarios Chile',
  'terrarios artesanales',
  'curso terrarios online',
  'taller terrarios Santiago',
  'ecosistemas en frasco',
  'musgo terrarios',
  'comoelmusguito',
  'Tomás Barrera',
];

export const SITE_CONFIG = {
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  social: {
    instagram: 'https://www.instagram.com/comoelmusguito',
    youtube: 'https://www.youtube.com/@comoelmusguito',
    twitter: '@comoelmusguito',
  },
};

