/**
 * API Route: Registrar nuevo usuario
 * POST /api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUser, emailExists } from '@/lib/auth/sanity-adapter';
import { linkOrdersToUser } from '@/lib/sanity/orders';
import { sendVerificationEmail } from '@/lib/resend/client';

export const dynamic = 'force-dynamic';

interface RegisterRequest {
  email: string;
  name?: string;
  password: string;
  recaptchaToken?: string;
}

/**
 * Verificar token de reCAPTCHA
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    // Si no hay secret key, permitir registro (modo desarrollo)
    console.warn('RECAPTCHA_SECRET_KEY no configurada, saltando verificación');
    return true;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    return data.success === true && data.score >= 0.5; // Score mínimo 0.5
  } catch (error) {
    console.error('Error verificando reCAPTCHA:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, recaptchaToken }: RegisterRequest = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email válido requerido' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar CAPTCHA si está configurado
    if (process.env.RECAPTCHA_SECRET_KEY) {
      console.log('🔒 Verificando reCAPTCHA en backend...');
      if (!recaptchaToken) {
        console.warn('⚠️ reCAPTCHA requerido pero no se recibió token');
        return NextResponse.json(
          { error: 'Verificación de seguridad requerida' },
          { status: 400 }
        );
      }

      console.log('📝 Token recibido:', recaptchaToken.substring(0, 20) + '...');
      const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
      console.log('✅ Resultado verificación reCAPTCHA:', isValidCaptcha);
      
      if (!isValidCaptcha) {
        return NextResponse.json(
          { error: 'Verificación de seguridad fallida. Por favor, intenta nuevamente.' },
          { status: 400 }
        );
      }
    } else {
      console.log('ℹ️ RECAPTCHA_SECRET_KEY no configurada, saltando verificación');
    }

    // Verificar si el email ya existe
    const exists = await emailExists(email);
    if (exists) {
      return NextResponse.json(
        { 
          error: 'Este email ya está registrado',
          existingUser: true,
          suggestion: '¿Quieres iniciar sesión en su lugar?'
        },
        { status: 400 }
      );
    }

    // Verificar si se requiere verificación de email
    // Variable de entorno: REQUIRE_EMAIL_VERIFICATION (default: true en producción, false en desarrollo)
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

    // Crear usuario
    const user = await createUser({
      email,
      name,
      password,
      provider: 'credentials',
      skipEmailVerification: !requireEmailVerification, // Si no se requiere, saltar verificación
    });

    // Vincular órdenes pasadas por email
    let linkedCount = 0;
    if (user._id) {
      linkedCount = await linkOrdersToUser(email, user._id);
    }

    // Enviar email de verificación solo si está habilitado
    let emailVerificationSent = false;
    if (requireEmailVerification && user.emailVerificationToken) {
      try {
        await sendVerificationEmail(
          user.email,
          user.name,
          user.emailVerificationToken
        );
        emailVerificationSent = true;
        console.log('✅ Email de verificación enviado a', user.email);
      } catch (emailError) {
        console.error('❌ Error enviando email de verificación:', emailError);
        // No fallar el registro si el email falla, pero loguear el error
      }
    } else if (!requireEmailVerification) {
      console.log('ℹ️ Verificación de email deshabilitada (REQUIRE_EMAIL_VERIFICATION=false)');
    }

    return NextResponse.json({
      success: true,
      userId: user._id,
      email: user.email,
      linkedOrders: linkedCount,
      emailVerificationSent,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('Error registrando usuario:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al registrar usuario',
      },
      { status: 500 }
    );
  }
}

