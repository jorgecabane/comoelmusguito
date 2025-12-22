/**
 * API Route: Canjear regalo con token
 * POST /api/gifts/redeem
 * 
 * Permite a un usuario vincular un regalo a su cuenta usando el token de canje
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { client, writeClient } from '@/sanity/lib/client';
import { createCourseAccess } from '@/lib/sanity/orders';
import { isValidGiftToken } from '@/lib/utils/gift-token';
import { redeemGiftRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = await applyRateLimit(redeemGiftRateLimit, ip);
    
    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.',
        },
        { status: 429 }
      );
    }

    const session = await getSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Debes estar autenticado para canjear un regalo' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token de regalo requerido' },
        { status: 400 }
      );
    }

    // Validar formato del token
    if (!isValidGiftToken(token)) {
      return NextResponse.json(
        { error: 'Token de regalo inválido' },
        { status: 400 }
      );
    }

    // Buscar orden con ese token
    const orderQuery = `*[_type == "order" && giftToken == $token && paymentStatus == 2][0]`;
    const order = await client.fetch(orderQuery, { token });

    if (!order) {
      return NextResponse.json(
        { error: 'Regalo no encontrado o pago no confirmado' },
        { status: 404 }
      );
    }

    // Verificar que el regalo no haya sido ya canjeado
    // Si el destinatario ya tiene cuenta y se creó el acceso, el regalo ya fue "consumido"
    if (order.recipientEmail) {
      const recipientUser = await getUserByEmail(order.recipientEmail);
      if (recipientUser?._id) {
        // Verificar si ya tiene acceso a los cursos de esta orden
        const hasAccess = await client.fetch(
          `*[_type == "courseAccess" && user._ref == $userId && course._ref in $courseIds][0]`,
          {
            userId: recipientUser._id,
            courseIds: order.items
              .filter((item: any) => item.type === 'course')
              .map((item: any) => item.id),
          }
        );

        if (hasAccess) {
          return NextResponse.json(
            { error: 'Este regalo ya fue canjeado' },
            { status: 400 }
          );
        }
      }
    }

    // Obtener usuario actual
    const currentUser = await getUserByEmail(session.user.email);
    if (!currentUser?._id) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el email del usuario actual coincida con el destinatario
    // O permitir canje si el token es válido (flexibilidad)
    // Por ahora, permitimos canje si el token es válido, independiente del email
    // (el usuario puede haberse registrado con otro email)

    // Crear accesos a cursos para el usuario actual
    const courseItems = order.items.filter((item: any) => item.type === 'course');
    const createdAccesses: string[] = [];
    const errors: string[] = [];

    for (const item of courseItems) {
      try {
        // Verificar si ya tiene acceso (evitar duplicados)
        const existingAccess = await client.fetch(
          `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
          {
            userId: currentUser._id,
            courseId: item.id,
          }
        );

        if (existingAccess) {
          errors.push(`Ya tienes acceso al curso "${item.name}"`);
          continue;
        }

        // Crear acceso
        await createCourseAccess(
          currentUser._id,
          item.id,
          order._id
        );
        createdAccesses.push(item.name);
      } catch (error) {
        console.error(`Error creando acceso a curso ${item.name}:`, error);
        errors.push(`Error al crear acceso a "${item.name}"`);
      }
    }

    // Marcar el token como usado (opcional - podemos agregar un campo "redeemedBy" a la orden)
    // Por ahora, no marcamos como usado para permitir múltiples canjes si es necesario
    // (aunque ya verificamos que no haya acceso duplicado)

    return NextResponse.json({
      success: true,
      message: `Regalo canjeado exitosamente. ${createdAccesses.length > 0 ? `Acceso creado a: ${createdAccesses.join(', ')}` : ''}`,
      accesses: createdAccesses,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error canjeando regalo:', error);
    return NextResponse.json(
      { error: 'Error al canjear el regalo' },
      { status: 500 }
    );
  }
}
