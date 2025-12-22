/**
 * Utilidades para tokens de regalo
 */

import { randomBytes } from 'crypto';

/**
 * Generar token único para canjeo de regalo
 * Formato: GIFT-{timestamp}-{randomHex}
 */
export function generateGiftToken(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(8).toString('hex').toUpperCase();
  return `GIFT-${timestamp}-${random}`;
}

/**
 * Validar formato de token de regalo
 */
export function isValidGiftToken(token: string): boolean {
  return /^GIFT-[A-Z0-9]+-[A-F0-9]{16}$/.test(token);
}
