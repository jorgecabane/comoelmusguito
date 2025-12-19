/**
 * API Route: Solicitar reset de contraseña
 * POST /api/auth/forgot-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPasswordResetToken, getUserByEmail } from '@/lib/auth/sanity-adapter';
import { sendPasswordResetEmail } from '@/lib/resend/client';
import { forgotPasswordRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';
import { sanitizeEmail } from '@/lib/utils/sanitize';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await applyRateLimit(forgotPasswordRateLimit, ip);
    
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

    // Verificar si el usuario existe y tiene contraseña
    const user = await getUserByEmail(sanitizedEmail);
    
    // Siempre devolver éxito para no revelar si el email existe
    // Pero solo enviar email si el usuario existe y tiene contraseña
    if (user && user.passwordHash) {
      const resetToken = await createPasswordResetToken(sanitizedEmail);
      
      if (resetToken) {
        try {
          await sendPasswordResetEmail(
            user.email,
            user.name,
            resetToken
          );
        } catch (emailError) {
          console.error('Error enviando email de reset:', emailError);
          // No fallar la petición, pero loguear el error
        }
      }
    }

    // Siempre devolver éxito (security best practice)
    return NextResponse.json({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
    });
  } catch (error) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      {
        error: 'Error procesando la solicitud',
      },
      { status: 500 }
    );
  }
}
