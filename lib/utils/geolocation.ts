/**
 * Utilidades de Geolocalización (servidor)
 * Detecta país del usuario usando headers de Vercel.
 */

import { headers } from 'next/headers';

export async function getUserCountry(): Promise<string> {
  try {
    const headersList = await headers();
    const country = headersList.get('x-vercel-ip-country');
    return country || 'CL';
  } catch (error) {
    console.error('Error obteniendo país:', error);
    return 'CL';
  }
}

export async function isUserInChile(): Promise<boolean> {
  const country = await getUserCountry();
  return country === 'CL';
}

export async function getUserCurrency(): Promise<'CLP' | 'USD'> {
  const country = await getUserCountry();
  return country === 'CL' ? 'CLP' : 'USD';
}
