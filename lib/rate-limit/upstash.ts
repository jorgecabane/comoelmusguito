/**
 * Rate Limiting con Upstash Redis
 * Configuración para diferentes endpoints
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Inicializar Redis (usar variables de entorno)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Obtener IP del request
 */
export function getClientIP(request: Request): string {
  // En Vercel, usar x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Fallback a x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Rate limiter para login
 * 5 intentos por 15 minutos por IP
 */
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/login',
    })
  : null;

/**
 * Rate limiter para registro
 * 3 registros por hora por IP
 */
export const registerRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/register',
    })
  : null;

/**
 * Rate limiter para forgot-password
 * 3 solicitudes por hora por IP
 */
export const forgotPasswordRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/forgot-password',
    })
  : null;

/**
 * Rate limiter para checkout
 * 10 intentos por 10 minutos por IP
 */
export const checkoutRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/checkout',
    })
  : null;

/**
 * Rate limiter para check-email
 * 10 verificaciones por hora por IP
 */
export const checkEmailRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/check-email',
    })
  : null;

/**
 * Rate limiter para resend-verification
 * 3 solicitudes por hora por IP
 */
export const resendVerificationRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit/resend-verification',
    })
  : null;

/**
 * Rate limiter para canjear regalos
 * 5 intentos por 15 minutos por IP
 */
export const redeemGiftRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/redeem-gift',
    })
  : null;

/**
 * Rate limiter genérico para endpoints API
 * 100 requests por minuto por IP
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/api',
    })
  : null;

/**
 * Aplicar rate limiting a un endpoint
 * Si Redis/Upstash no está disponible (DNS, red, etc.), se permite la request y se loguea el error.
 */
export async function applyRateLimit(
  rateLimiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  if (!rateLimiter) {
    // Si no hay Redis configurado, permitir todas las requests (modo desarrollo)
    console.warn('Rate limiting deshabilitado: Upstash Redis no configurado');
    return { success: true, limit: Infinity, remaining: Infinity, reset: Date.now() };
  }

  try {
    const result = await rateLimiter.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limit (Upstash) no disponible, permitiendo request:', error instanceof Error ? error.message : error);
    return { success: true, limit: Infinity, remaining: Infinity, reset: Date.now() };
  }
}
