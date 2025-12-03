/**
 * API Route: Obtener detalles de una orden
 * GET /api/checkout/order-details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderId } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId requerido' },
        { status: 400 }
      );
    }

    const order = await getOrderByOrderId(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Retornar items con información necesaria para el callback
    return NextResponse.json({
      success: true,
      items: order.items.map((item) => ({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        slug: item.slug, // Necesario para links a cursos
      })),
      customerEmail: order.customerEmail,
      customerName: order.customerName,
    });
  } catch (error) {
    console.error('Error obteniendo detalles de la orden:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al obtener detalles de la orden',
      },
      { status: 500 }
    );
  }
}

