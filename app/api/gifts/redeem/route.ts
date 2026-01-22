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
import { getOrderByGiftToken, markGiftAsRedeemed } from '@/lib/sanity/gifts';
import { isValidGiftToken } from '@/lib/utils/gift-token';
import { redeemGiftRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';

export const dynamic = 'force-dynamic';

interface RedeemGiftRequest {
  token: string;
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

    // Buscar orden con ese token usando función helper (mismo patrón que otras funciones en lib/sanity/gifts.ts)
    const order = await getOrderByGiftToken(token);

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

    // Procesar todos los tipos de items del regalo
    const courseItems = order.items.filter((item: any) => item.type === 'course');
    const workshopItems = order.items.filter((item: any) => item.type === 'workshop');
    const terrariumItems = order.items.filter((item: any) => item.type === 'terrarium');
    const supplyItems = order.items.filter((item: any) => item.type === 'supply');
    
    const createdAccesses: string[] = [];
    const errors: string[] = [];
    let hasProcessedItems = false;

    // 1. Crear accesos a cursos para el usuario actual
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
        createdAccesses.push(`Curso: ${item.name}`);
        hasProcessedItems = true;
      } catch (error) {
        console.error(`Error creando acceso a curso ${item.name}:`, error);
        errors.push(`Error al crear acceso a "${item.name}"`);
      }
    }

    // 2. Para talleres, terrarios e insumos, no necesitamos crear documentos de acceso
    // porque se mostrarán desde los regalos recibidos (giftsReceived) en "Mi Cuenta"
    // La orden se mantiene con el userId del comprador (no se cambia)
    // El destinatario verá sus regalos a través de getGiftsReceivedByEmail
    if (workshopItems.length > 0 || terrariumItems.length > 0 || supplyItems.length > 0) {
      // Agregar items procesados al mensaje
      if (workshopItems.length > 0) {
        createdAccesses.push(`Taller(es): ${workshopItems.map((i: any) => i.name).join(', ')}`);
        hasProcessedItems = true;
      }
      if (terrariumItems.length > 0) {
        createdAccesses.push(`Terrario(s): ${terrariumItems.map((i: any) => i.name).join(', ')}`);
        hasProcessedItems = true;
      }
      if (supplyItems.length > 0) {
        createdAccesses.push(`Insumo(s): ${supplyItems.map((i: any) => i.name).join(', ')}`);
        hasProcessedItems = true;
      }

      console.log(`✅ Regalo ${order.orderId} canjeado - talleres/terrarios/insumos disponibles para ${currentUser._id}`);
    }

    // 🔒 MARCAR EL REGALO COMO CANJEADO (si se procesó al menos un item)
    if (hasProcessedItems) {
      try {
        await markGiftAsRedeemed(order.orderId, currentUser._id);
        console.log(`✅ Regalo ${order.orderId} marcado como canjeado por usuario ${currentUser._id}`);
      } catch (error) {
        console.error('Error marcando regalo como canjeado:', error);
        // No fallar el canje si hay error marcando, pero loguear el error
      }
    }

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
