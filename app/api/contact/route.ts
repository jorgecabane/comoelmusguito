/**
 * API Route: Formulario de Contacto
 * POST /api/contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/resend/client';

export const dynamic = 'force-dynamic';

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validaciones
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Enviar email
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
      {
        error: error instanceof Error ? error.message : 'Error al procesar el formulario',
      },
      { status: 500 }
    );
  }
}

