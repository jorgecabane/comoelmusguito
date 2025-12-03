/**
 * API Route: Suscribirse al Newsletter
 * POST /api/newsletter/subscribe
 */

import { NextRequest, NextResponse } from 'next/server';
import { subscribeToNewsletter } from '@/lib/sanity/newsletter';

export const dynamic = 'force-dynamic';

interface SubscribeRequest {
  email: string;
  name?: string;
  source?: 'footer-home' | 'footer-general' | 'contact-page' | 'other';
  recaptchaToken?: string;
}

/**
 * Verificar token de reCAPTCHA
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  if (!secretKey) {
    // Si no hay secret key, permitir suscripción (modo desarrollo)
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
    const body: SubscribeRequest = await request.json();
    const { email, name, source, recaptchaToken } = body;

    // Validaciones básicas
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email válido requerido' },
        { status: 400 }
      );
    }

    // Verificar CAPTCHA si está configurado
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: 'Verificación de seguridad requerida' },
          { status: 400 }
        );
      }

      const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidCaptcha) {
        return NextResponse.json(
          { error: 'Verificación de seguridad fallida. Por favor, intenta nuevamente.' },
          { status: 400 }
        );
      }
    }

    // Suscribir al newsletter
    try {
      const result = await subscribeToNewsletter({
        email,
        name,
        source: source || 'footer-home',
      });

      if (result.alreadySubscribed) {
        return NextResponse.json({
          success: true,
          message: 'Ya estás suscrito a nuestro newsletter',
          alreadySubscribed: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: '¡Te has suscrito exitosamente! Revisa tu email para confirmar.',
        subscriberId: result.subscriberId,
      });
    } catch (error) {
      console.error('Error suscribiendo al newsletter:', error);
      return NextResponse.json(
        {
          error: 'Error al procesar la suscripción. Por favor, intenta nuevamente.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error procesando suscripción:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al procesar la suscripción',
      },
      { status: 500 }
    );
  }
}

