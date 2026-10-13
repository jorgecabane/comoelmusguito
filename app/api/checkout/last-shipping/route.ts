/**
 * API Route: Obtener la última dirección de despacho del usuario de la sesión
 * GET /api/checkout/last-shipping
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getLastShippingAddressByUserId } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ shippingAddress: null });
    }

    const shippingAddress = await getLastShippingAddressByUserId(user._id);
    return NextResponse.json({ shippingAddress });
  } catch (error) {
    console.error('Error obteniendo última dirección de despacho:', error);
    return NextResponse.json(
      { error: 'Error al obtener dirección de despacho' },
      { status: 500 }
    );
  }
}
