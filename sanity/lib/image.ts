/**
 * Sanity Image Helper
 * Utilidades para manejar imágenes de Sanity
 */

import { createClient } from 'next-sanity';
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Helper para obtener URL de imagen con opciones
export function getSanityImageUrl(
  source: SanityImageSource,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  }
) {
  let urlBuilder = builder.image(source).auto('format').fit('max');

  if (options?.width) urlBuilder = urlBuilder.width(options.width);
  if (options?.height) urlBuilder = urlBuilder.height(options.height);
  if (options?.quality) urlBuilder = urlBuilder.quality(options.quality);
  if (options?.format) urlBuilder = urlBuilder.format(options.format);

  return urlBuilder.url();
}

