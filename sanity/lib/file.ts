/**
 * Sanity File Helper
 * Utilidades para manejar archivos de Sanity
 */

import { createClient } from 'next-sanity';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
});

/**
 * Obtener URL de descarga de un archivo de Sanity
 */
export function getFileUrl(assetRef: string): string {
  if (!assetRef) return '';
  
  // Si ya es una URL completa, retornarla
  if (assetRef.startsWith('http')) {
    return assetRef;
  }
  
  // Construir URL de Sanity CDN
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  
  // Formato: https://cdn.sanity.io/files/{projectId}/{dataset}/{fileId}.{extension}
  // El assetRef viene como "file-{id}-{extension}"
  const fileId = assetRef.replace('file-', '').split('-').slice(0, -1).join('-');
  const extension = assetRef.split('.').pop() || 'pdf';
  
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${fileId}.${extension}`;
}

/**
 * Formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '';
  
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

