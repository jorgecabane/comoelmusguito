/**
 * API Route: Formulario de Contacto
 * POST /api/contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/resend/client';
import { contactRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';

export const dynamic = 'force-dynamic';

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const MAX_LENGTHS: Record<keyof ContactRequest, number> = {
  name: 100,
  email: 254,
  phone: 30,
  subject: 200,
  message: 5000,
};

function isTooLong(body: ContactRequest): boolean {
  return (Object.keys(MAX_LENGTHS) as (keyof ContactRequest)[]).some(
    (field) => String(body[field] ?? '').length > MAX_LENGTHS[field]
  );
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await applyRateLimit(contactRateLimit, getClientIP(request));
    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados mensajes. Por favor, espera un momento antes de intentar nuevamente.' },
        { status: 429 }
      );
    }

    const body: ContactRequest = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validaciones
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    if (isTooLong(body)) {
      return NextResponse.json(
        { error: 'Uno o más campos superan el largo máximo permitido' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Enviar email (el HTML se escapa al renderizar en lib/resend/client.ts)
    try {
      await sendContactEmail({
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
      });

      return NextResponse.json({
        success: true,
        message: 'Mensaje enviado correctamente. Te responderemos pronto.',
      });
    } catch (emailError) {
      console.error('Error enviando email de contacto:', emailError);
      return NextResponse.json(
        {
          error: 'Error al enviar el mensaje. Por favor, intenta nuevamente o contáctanos directamente por teléfono.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error procesando formulario de contacto:', error);
    return NextResponse.json(
      { error: 'Error al procesar el formulario' },
      { status: 500 }
    );
  }
}
