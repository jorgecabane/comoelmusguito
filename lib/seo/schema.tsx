/**
 * Structured Data (JSON-LD) Components
 * Para mejorar el SEO con rich snippets
 */

import { SITE_CONFIG } from './metadata';

interface SchemaProps {
  children?: never;
}

/**
 * Schema de Organización (va en layout raíz)
 */
export function OrganizationSchema({}: SchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    alternateName: 'El Musguito',
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    description: SITE_CONFIG.description,
    founder: {
      '@type': 'Person',
      name: 'Tomás Barrera',
      jobTitle: 'Artista y Educador de Terrarios',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hola@comoelmusguito.com',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.youtube,
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CL',
      addressLocality: 'Santiago',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de Producto (para terrarios)
 */
export function ProductSchema({
  name,
  description,
  images,
  price,
  currency = 'CLP',
  slug,
  inStock = true,
  reviews = [],
}: {
  name: string;
  description: string;
  images: string[];
  price: number;
  currency?: string;
  slug: string;
  inStock?: boolean;
  reviews?: Array<{
    rating: number;
    author: string;
    date: string;
    text: string;
  }>;
}) {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : undefined;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images,
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_CONFIG.url}/terrarios/${slug}`,
      priceCurrency: currency,
      price: price.toString(),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
      },
    },
    ...(averageRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de Curso
 */
export function CourseSchema({
  name,
  description,
  thumbnail,
  price,
  currency = 'CLP',
  duration,
  level = 'Beginner',
}: {
  name: string;
  description: string;
  thumbnail: string;
  price: number;
  currency?: string;
  duration: number; // en horas
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    image: thumbnail,
    offers: {
      '@type': 'Offer',
      category: 'Online',
      priceCurrency: currency,
      price: price.toString(),
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${duration}H`,
    },
    inLanguage: 'es',
    educationalLevel: level,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de Breadcrumbs
 */
export function BreadcrumbSchema({
  items,
}: {
  items: Array<{ name: string; url: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de Artículo (para blog)
 */
export function ArticleSchema({
  title,
  excerpt,
  coverImage,
  slug,
  publishedAt,
  modifiedAt,
  authorName = 'Tomás Barrera',
}: {
  title: string;
  excerpt: string;
  coverImage: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  authorName?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: excerpt,
    image: coverImage,
    datePublished: publishedAt,
    dateModified: modifiedAt || publishedAt,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `${SITE_CONFIG.url}/sobre`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/blog/${slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de Video
 */
export function VideoSchema({
  title,
  description,
  thumbnail,
  url,
  embedUrl,
  uploadDate,
  duration, // en segundos
}: {
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  uploadDate: string;
  duration: number;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description,
    thumbnailUrl: thumbnail,
    uploadDate,
    duration: `PT${duration}S`,
    contentUrl: url,
    embedUrl,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de FAQPage (para páginas con preguntas frecuentes)
 */
export function FAQSchema({
  questions,
}: {
  questions: Array<{ question: string; answer: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Schema de Evento (para talleres presenciales)
 */
export function EventSchema({
  name,
  description,
  image,
  startDate,
  endDate,
  location,
  price,
  currency = 'CLP',
  availability = 'InStock',
}: {
  name: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
    city: string;
  };
  price: number;
  currency?: string;
  availability?: 'InStock' | 'SoldOut';
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    image,
    startDate,
    endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: location.address,
        addressLocality: location.city,
        addressCountry: 'CL',
      },
    },
    offers: {
      '@type': 'Offer',
      url: SITE_CONFIG.url,
      price: price.toString(),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
    },
    organizer: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

