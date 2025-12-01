/**
 * Utilidades de Geolocalización
 * Detecta país del usuario usando headers de Vercel
 */

import { headers } from 'next/headers';

/**
 * Obtener país del usuario desde headers de Vercel
 * @returns Código de país ISO (ej: 'CL', 'US', 'AR')
 */
export async function getUserCountry(): Promise<string> {
  try {
    const headersList = await headers();
    const country = headersList.get('x-vercel-ip-country');
    
    // Si Vercel no proporciona el header, usar 'CL' como default (Chile)
    return country || 'CL';
  } catch (error) {
    console.error('Error obteniendo país:', error);
    return 'CL'; // Default a Chile
  }
}

/**
 * Determinar si el usuario está en Chile
 * @returns true si está en Chile, false en caso contrario
 */
export async function isUserInChile(): Promise<boolean> {
  const country = await getUserCountry();
  return country === 'CL';
}

/**
 * Obtener moneda preferida según país
 * @returns 'CLP' para Chile, 'USD' para otros países
 */
export async function getUserCurrency(): Promise<'CLP' | 'USD'> {
  const country = await getUserCountry();
  return country === 'CL' ? 'CLP' : 'USD';
}

/**
 * Obtener país del usuario (versión cliente)
 * Usa headers de request si está disponible, sino usa fallback
 */
export function getUserCountryClient(): string {
  // En cliente, intentar obtener del servidor o usar fallback
  if (typeof window !== 'undefined') {
    // Intentar obtener de cookies o localStorage si está disponible
    const storedCountry = localStorage.getItem('user-country');
    if (storedCountry) {
      return storedCountry;
    }
    
    // Fallback: detectar por timezone o language
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Santiago') || timezone.includes('America/Santiago')) {
      return 'CL';
    }
    
    const language = navigator.language || navigator.languages?.[0];
    if (language.includes('es-CL') || language.includes('es-CL')) {
      return 'CL';
    }
  }
  
  return 'CL'; // Default
}

