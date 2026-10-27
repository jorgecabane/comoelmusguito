/**
 * API Route: Obtener detalles de una orden
 * GET /api/checkout/order-details?orderId=...
 *
 * Quien conoce el orderId (el comprador, vía la URL de retorno) ve los items y flags de la orden.
 * Los datos personales (email, regalo, dirección) solo se devuelven al dueño con sesión iniciada.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { isOrderOwner } from '@/lib/auth/order-owner';
import { getOrderByOrderId } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    const order = await getOrderByOrderId(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const details = {
      success: true,
      total: order.total,
      currency: order.currency,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        slug: item.slug, // Necesario para links a cursos
        shippingPreference: item.shippingPreference,
      })),
      isGift: order.isGift || false,
      requiresShipping: order.requiresShipping || false,
    };

    if (!isOrderOwner(order, await getSession())) {
      return NextResponse.json(details);
    }

    return NextResponse.json({
      ...details,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      recipientEmail: order.recipientEmail,
      recipientName: order.recipientName,
      giftMessage: order.giftMessage,
      shippingAddress: order.shippingAddress,
    });
  } catch (error) {
    console.error('Error obteniendo detalles de la orden:', error);
    return NextResponse.json({ error: 'Error al obtener detalles de la orden' }, { status: 500 });
  }
}
