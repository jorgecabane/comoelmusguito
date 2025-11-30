/**
 * Sanity Client Configuration
 * Cliente para consultar datos desde Next.js
 */

import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false, // Desactivar CDN temporalmente para debugging
  perspective: 'published', // Solo mostrar contenido publicado
  stega: {
    enabled: false,
    studioUrl: '/studio',
  },
});

// Cliente para preview (con token)
export const previewClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
  perspective: 'previewDrafts', // Ver borradores
});

// Helper para obtener el cliente correcto
export const getClient = (preview?: boolean) =>
  preview ? previewClient : client;

