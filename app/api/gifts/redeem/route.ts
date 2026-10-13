/**
 * API Route: Canjear regalo con token
 * POST /api/gifts/redeem
 * 
 * Permite a un usuario vincular un regalo a su cuenta usando el token de canje
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { createCourseAccess } from '@/lib/sanity/orders';
import { getOrderByGiftToken, markGiftAsRedeemed } from '@/lib/sanity/gifts';
import { isValidGiftToken } from '@/lib/utils/gift-token';
import { redeemGiftRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';

export const dynamic = 'force-dynamic';

interface RedeemGiftRequest {
  token: string;
}

const PHYSICAL_LABELS = [
  ['workshop', 'Taller(es)'],
  ['terrarium', 'Terrario(s)'],
  ['supply', 'Insumo(s)'],
] as const;

type GiftOrder = NonNullable<Awaited<ReturnType<typeof getOrderByGiftToken>>>;

/** Crea los accesos a cursos (en paralelo) y lista los ítems físicos del regalo. */
async function redeemItems(order: GiftOrder, userId: string) {
  const courseItems = order.items.filter((item) => item.type === 'course');
  const createdAccesses: string[] = [];
  const errors: string[] = [];
  let failedCourses = 0;

  // createCourseAccess es idempotente: false = el usuario ya tenía el curso
  const results = await Promise.allSettled(
    courseItems.map((item) => createCourseAccess(userId, item.id, order._id))
  );
  results.forEach((result, i) => {
    const { name } = courseItems[i];
    if (result.status === 'rejected') {
      console.error(`Error creando acceso a curso ${name}:`, result.reason);
      errors.push(`Error al crear acceso a "${name}"`);
      failedCourses++;
    } else if (result.value) {
      createdAccesses.push(`Curso: ${name}`);
    } else {
      errors.push(`Ya tienes acceso al curso "${name}"`);
    }
  });

  // Talleres, terrarios e insumos no crean documentos de acceso: se muestran en
  // "Mi Cuenta" desde los regalos recibidos (getGiftsReceivedByEmail).
  for (const [type, label] of PHYSICAL_LABELS) {
    const names = order.items.filter((item) => item.type === type).map((item) => item.name);
    if (names.length > 0) createdAccesses.push(`${label}: ${names.join(', ')}`);
  }

  return { createdAccesses, errors, failedCourses };
}

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

    const body: RedeemGiftRequest = await request.json();
    const { token: rawToken } = body;

    // Validar y tipar token explícitamente
    if (!rawToken || typeof rawToken !== 'string') {
      return NextResponse.json(
        { error: 'Token de regalo requerido' },
        { status: 400 }
      );
    }

    // Validar formato del token
    if (!isValidGiftToken(rawToken)) {
      return NextResponse.json(
        { error: 'Token de regalo inválido' },
        { status: 400 }
      );
    }

    // Extraer token como string tipado explícitamente
    const token: string = rawToken;

    // Orden y usuario son independientes: se leen en paralelo
    const [order, currentUser] = await Promise.all([
      getOrderByGiftToken(token),
      getUserByEmail(session.user.email),
    ]);

    if (!order) {
      return NextResponse.json(
        { error: 'Regalo no encontrado o pago no confirmado' },
        { status: 404 }
      );
    }

    // 🔒 VERIFICAR SI EL REGALO YA FUE CANJEADO
    if (order.giftRedeemedAt || order.giftRedeemedBy) {
      return NextResponse.json(
        { error: 'Este regalo ya fue canjeado anteriormente' },
        { status: 400 }
      );
    }

    if (!currentUser?._id) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Se permite canjear con cualquier email: el token es la credencial
    // (el destinatario puede haberse registrado con otro email).
    const { createdAccesses, errors, failedCourses } = await redeemItems(order, currentUser._id);

    if (createdAccesses.length === 0) {
      return failedCourses > 0
        ? NextResponse.json(
            { error: 'No pudimos canjear el regalo. Por favor, intenta nuevamente.' },
            { status: 500 }
          )
        : NextResponse.json(
            { error: 'Ya tienes acceso a todos los cursos de este regalo' },
            { status: 409 }
          );
    }

    // 🔒 MARCAR EL REGALO COMO CANJEADO
    try {
      await markGiftAsRedeemed(order.orderId, currentUser._id);
    } catch (error) {
      // No fallar el canje si hay error marcando, pero loguear el error
      console.error('Error marcando regalo como canjeado:', error);
    }

    return NextResponse.json({
      success: true,
      message: `Regalo canjeado exitosamente. Acceso creado a: ${createdAccesses.join(', ')}`,
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
