/**
 * API Route: Verificar si email existe y está verificado
 * GET /api/auth/check-email?email=...
 * 
 * Endpoint privado: Solo devuelve información genérica para prevenir enumeración de usuarios
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { checkEmailRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';
import { sanitizeEmail } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await applyRateLimit(checkEmailRateLimit, ip);
    
    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.',
        },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    // Sanitizar email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(sanitizedEmail);

    // Siempre devolver la misma estructura para prevenir enumeración
    // No revelar si el email existe o no
    if (!user) {
      return NextResponse.json({
        exists: false,
        verified: false,
        // Mensaje genérico
        message: 'Si el email existe y no está verificado, puedes solicitar un nuevo enlace de verificación.',
      });
    }

    // Si el usuario existe, devolver información de verificación
    return NextResponse.json({
      exists: true,
      verified: user.emailVerified || false,
      message: user.emailVerified
        ? 'Email verificado'
        : 'Email no verificado. Puedes solicitar un nuevo enlace de verificación.',
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    // No revelar detalles del error
    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
      },
      { status: 500 }
    );
  }
}

