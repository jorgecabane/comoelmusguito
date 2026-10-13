/**
 * API Route: ¿El email tiene una cuenta pendiente de verificación?
 * GET /api/auth/check-email?email=...
 * Usado por el login para avisar "email no verificado". Rate-limited por IP.
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

    // Solo se distingue "cuenta pendiente de verificación" (lo que necesita el login).
    // Email inexistente y cuenta verificada responden igual para no permitir enumerar cuentas.
    return NextResponse.json({ pendingVerification: !!user && !user.emailVerified });
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

