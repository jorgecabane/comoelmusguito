/**
 * Explicit order cancellation endpoint
 * Called when the user closes the PayPal popup or abandons checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderByOrderId, updateOrderPaymentStatus } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  let orderId: string | undefined;

  try {
    const body = await request.json();
    orderId = body?.orderId;
  } catch {
    console.warn(`[Cancel] ${timestamp} | Invalid request body`);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!orderId) {
    console.warn(`[Cancel] ${timestamp} | Missing orderId`);
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }

  try {
    const order = await getOrderByOrderId(orderId);
    if (!order) {
      console.warn(`[Cancel] ${timestamp} | Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus === 2) {
      console.warn(`[Cancel] ${timestamp} | Order ${orderId} already paid — cannot cancel`);
      return NextResponse.json(
        { error: 'Order already paid, cannot cancel' },
        { status: 409 }
      );
    }

    if (order.paymentStatus === 4) {
      console.log(`[Cancel] ${timestamp} | Order ${orderId} already cancelled — idempotent`);
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    await updateOrderPaymentStatus(orderId, 4);
    console.log(`[Cancel] ${timestamp} | Order ${orderId} cancelled (was status ${order.paymentStatus})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[Cancel] ${timestamp} | Error cancelling order ${orderId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
