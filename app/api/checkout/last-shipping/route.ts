/**
 * API Route: Obtener última dirección de despacho de un usuario
 * GET /api/checkout/last-shipping?userId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLastShippingAddressByUserId } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    const shippingAddress = await getLastShippingAddressByUserId(userId);

    return NextResponse.json({ shippingAddress });
  } catch (error) {
    console.error('Error obteniendo última dirección de despacho:', error);
    return NextResponse.json(
      { error: 'Error al obtener dirección de despacho' },
      { status: 500 }
    );
  }
}
