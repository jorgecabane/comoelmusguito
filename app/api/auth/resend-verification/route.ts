/**
 * API Route: Reenviar email de verificación
 * POST /api/auth/resend-verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, regenerateVerificationToken } from '@/lib/auth/sanity-adapter';
import { sendVerificationEmail } from '@/lib/resend/client';
import { resendVerificationRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';
import { sanitizeEmail } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

const GENERIC_RESPONSE = {
  success: true,
  message: 'Si el email existe y no está verificado, recibirás un nuevo enlace de verificación.',
};

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await applyRateLimit(resendVerificationRateLimit, ip);
    
    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Sanitizar email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const user = await getUserByEmail(sanitizedEmail);
    
    // Email inexistente o ya verificado: misma respuesta que el caso exitoso (no revela cuentas)
    if (!user || user.emailVerified) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Regenerar token de verificación
    const verificationToken = await regenerateVerificationToken(sanitizedEmail);
    
    if (verificationToken) {
      try {
        await sendVerificationEmail(
          user.email,
          user.name,
          verificationToken
        );
      } catch (emailError) {
        console.error('Error enviando email de verificación:', emailError);
        return NextResponse.json(
          { error: 'Error enviando email de verificación' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Error en resend-verification:', error);
    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
      },
      { status: 500 }
    );
  }
}
