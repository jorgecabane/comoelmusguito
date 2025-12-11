/**
 * Sanity Queries
 * Queries GROQ para obtener datos
 */

import { groq } from 'next-sanity';

// ============ TERRARIOS ============

export const terrariumsQuery = groq`
  *[_type == "terrarium" && inStock == true] | order(order asc, _createdAt desc) {
    _id,
    name,
    slug,
    description,
    images,
    price,
    currency,
    inStock,
    stock,
    size,
    category,
    plants,
    careLevel,
    featured
  }
`;

export const featuredTerrariumsQuery = groq`
  *[_type == "terrarium" && featured == true && inStock == true] | order(order asc) [0...6] {
    _id,
    name,
    slug,
    description,
    images,
    price,
    currency,
    inStock,
    stock,
    size,
    category,
    plants
  }
`;

export const terrariumBySlugQuery = groq`
  *[_type == "terrarium" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    longDescription,
    images,
    price,
    currency,
    inStock,
    stock,
    size,
    category,
    plants,
    hardscape,
    careLevel,
    lightRequirement,
    wateringFrequency,
    shippingAvailable,
    shippingRegions,
    localPickupOnly,
    seo
  }
`;

// ============ CURSOS ============

export const coursesQuery = groq`
  *[_type == "course" && published == true] | order(order asc, _createdAt desc) {
    _id,
    name,
    slug,
    shortDescription,
    thumbnail,
    priceCLP,
    priceUSD,
    salePriceCLP,
    salePriceUSD,
    price,
    currency,
    salePrice,
    level,
    duration,
    lessonCount,
    featured
  }
`;

export const featuredCoursesQuery = groq`
  *[_type == "course" && featured == true && published == true] | order(order asc) [0...3] {
    _id,
    name,
    slug,
    shortDescription,
    thumbnail,
    priceCLP,
    priceUSD,
    salePriceCLP,
    salePriceUSD,
    price,
    currency,
    salePrice,
    level,
    duration,
    lessonCount
  }
`;

export const courseBySlugQuery = groq`
  *[_type == "course" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    shortDescription,
    longDescription,
    thumbnail,
    promoVideo,
    priceCLP,
    priceUSD,
    salePriceCLP,
    salePriceUSD,
    price,
    currency,
    salePrice,
    level,
    duration,
    lessonCount,
    modules[] {
      title,
      description,
      order,
      lessons[] {
        title,
        description,
        duration,
        videoUrl,
        videoProvider,
        isFree,
        downloadables[] {
          _key,
          _type,
          title,
          asset-> {
            _id,
            _type,
            url,
            originalFilename,
            size,
            mimeType
          }
        },
        order
      }
    },
    learningOutcomes,
    requirements,
    materials,
    instructor,
    accessType,
    certificate,
    seo
  }
`;

// ============ TALLERES ============

export const workshopsQuery = groq`
  *[_type == "workshop" && published == true] | order(order asc, _createdAt desc) {
    _id,
    name,
    slug,
    description,
    images,
    dates[] {
      date,
      spotsAvailable,
      spotsTotal,
      status
    },
    location,
    price,
    currency,
    duration,
    level,
    includes,
    featured
  }
`;

export const featuredWorkshopsQuery = groq`
  *[_type == "workshop" && featured == true && published == true] | order(order asc) [0...3] {
    _id,
    name,
    slug,
    description,
    images,
    dates[] {
      date,
      spotsAvailable,
      spotsTotal,
      status
    },
    location,
    price,
    currency,
    duration,
    level
  }
`;

export const workshopBySlugQuery = groq`
  *[_type == "workshop" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    longDescription,
    images,
    dates[] {
      date,
      spotsAvailable,
      spotsTotal,
      status
    },
    location,
    price,
    currency,
    duration,
    level,
    includes,
    learningOutcomes,
    requirements,
    cancellationPolicy,
    seo
  }
`;

// ============ HELPERS ============

// Obtener todos los productos destacados (terrarios + cursos)
export const allFeaturedQuery = groq`
  {
    "terrarios": *[_type == "terrarium" && featured == true && inStock == true] | order(order asc) [0...3],
    "cursos": *[_type == "course" && featured == true && published == true] | order(order asc) [0...3]
  }
`;

