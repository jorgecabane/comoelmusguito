/**
 * Utilidades de Geolocalización (cliente)
 * No usar next/headers aquí — este módulo se importa desde Client Components.
 */

export function getUserCountryClient(): string {
  if (typeof window !== 'undefined') {
    const storedCountry = localStorage.getItem('user-country');
    if (storedCountry) {
      return storedCountry;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Santiago') || timezone.includes('America/Santiago')) {
      return 'CL';
    }

    const language = navigator.language ?? navigator.languages?.[0];
    if (language?.includes('es-CL')) {
      return 'CL';
    }
  }

  return 'CL';
}
