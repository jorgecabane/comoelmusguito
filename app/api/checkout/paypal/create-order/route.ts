/**
 * POST /api/checkout/paypal/create-order
 * Creates a PayPal order after the main checkout has created a Sanity order.
 * Idempotent: returns existing paypalOrderId if one is already stored.
 */

import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'
import { getOrderByOrderId } from '@/lib/sanity/orders'
import { writeClient } from '@/sanity/lib/client'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId } = body as { orderId?: string }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const order = await getOrderByOrderId(orderId)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentStatus !== 1) {
      return NextResponse.json({ error: 'Order is already paid or rejected' }, { status: 409 })
    }

    if (order.paymentProvider !== 'paypal') {
      return NextResponse.json({ error: 'Order is not a PayPal order' }, { status: 409 })
    }

    // Idempotent: if PayPal order already created, return it
    if (order.paypalOrderId) {
      console.log(`[PayPal] Returning existing paypalOrderId ${order.paypalOrderId} for order ${orderId}`)
      return NextResponse.json({ success: true, paypalOrderId: order.paypalOrderId })
    }

    const items = order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      currency: order.currency,
    }))

    const paypalOrder = await createPayPalOrder({
      orderId: order.orderId,
      items,
      total: order.total,
      currency: order.currency,
    })

    // Persist paypalOrderId on the Sanity order
    await writeClient
      .patch(order._id!)
      .set({ paypalOrderId: paypalOrder.id, updatedAt: new Date().toISOString() })
      .commit()

    console.log(`[PayPal] Created paypalOrderId ${paypalOrder.id} for order ${orderId}`)

    return NextResponse.json({ success: true, paypalOrderId: paypalOrder.id })
  } catch (error) {
    console.error('[PayPal] Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
