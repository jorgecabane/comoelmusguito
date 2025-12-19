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
    
    if (!user) {
      // No revelar si el email existe o no
      return NextResponse.json({
        success: true,
        message: 'Si el email existe y no está verificado, recibirás un nuevo enlace de verificación.',
      });
    }

    // Si el email ya está verificado, no hacer nada
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Tu email ya está verificado.',
      });
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

    return NextResponse.json({
      success: true,
      message: 'Email de verificación reenviado exitosamente',
    });
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
