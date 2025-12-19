/**
 * Utilidades para sanitizar inputs
 */

/**
 * Sanitizar string: trim, eliminar caracteres peligrosos
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .slice(0, 10000); // Limitar longitud
}

/**
 * Sanitizar email: validar formato y normalizar
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  const trimmed = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

/**
 * Sanitizar número entero
 */
export function sanitizeInteger(input: unknown, min?: number, max?: number): number | null {
  if (typeof input === 'number') {
    const value = Math.floor(input);
    if (min !== undefined && value < min) return null;
    if (max !== undefined && value > max) return null;
    return value;
  }
  
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    if (isNaN(parsed)) return null;
    if (min !== undefined && parsed < min) return null;
    if (max !== undefined && parsed > max) return null;
    return parsed;
  }
  
  return null;
}

/**
 * Sanitizar número decimal
 */
export function sanitizeFloat(input: unknown, min?: number, max?: number): number | null {
  if (typeof input === 'number') {
    if (min !== undefined && input < min) return null;
    if (max !== undefined && input > max) return null;
    return input;
  }
  
  if (typeof input === 'string') {
    const parsed = parseFloat(input);
    if (isNaN(parsed)) return null;
    if (min !== undefined && parsed < min) return null;
    if (max !== undefined && parsed > max) return null;
    return parsed;
  }
  
  return null;
}

/**
 * Sanitizar URL
 */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  
  try {
    const url = new URL(input);
    // Solo permitir http y https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitizar objeto: aplicar sanitización recursiva
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  schema: Record<keyof T, (value: unknown) => unknown>
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (key in schema) {
      const sanitizer = schema[key as keyof T];
      const sanitizedValue = sanitizer(value);
      if (sanitizedValue !== null && sanitizedValue !== undefined) {
        sanitized[key as keyof T] = sanitizedValue as T[keyof T];
      }
    }
  }
  
  return sanitized;
}
