/**
 * Sanity Client Configuration
 * Cliente para consultar datos desde Next.js
 * 
 * Usamos un solo token con permisos de Editor para todas las operaciones
 * (lectura y escritura). Esto simplifica la configuración y es más seguro
 * ya que todo pasa por el servidor.
 */

import { createClient } from 'next-sanity';

// Cliente principal con token (permisos de Editor: read+write)
// Usamos el mismo cliente para lectura y escritura ya que todo pasa por el servidor
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false, // Desactivar CDN para operaciones de escritura
  token: process.env.SANITY_API_TOKEN, // Token con permisos de Editor (read+write)
  perspective: 'published', // Solo mostrar contenido publicado
  stega: {
    enabled: false,
    studioUrl: '/studio',
  },
});

// Cliente para preview (con token, para ver borradores)
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

// Alias para compatibilidad: writeClient ahora es igual a client
// (mantenemos esto para no romper código existente)
export const writeClient = client;

