/**
 * POST /api/checkout/paypal/capture-order
 * Captures payment after the buyer approves in the PayPal popup.
 * Idempotent: returns success if order is already paid.
 */

import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import {
  getOrderByOrderId,
  updateOrderPaymentStatus,
  processSuccessfulPayment,
} from '@/lib/sanity/orders'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paypalOrderId } = body as {
      orderId?: string
      paypalOrderId?: string
    }

    if (!orderId || !paypalOrderId) {
      return NextResponse.json(
        { error: 'orderId and paypalOrderId are required' },
        { status: 400 }
      )
    }

    const order = await getOrderByOrderId(orderId)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentProvider !== 'paypal') {
      return NextResponse.json({ error: 'Order is not a PayPal order' }, { status: 409 })
    }

    // Idempotent: already paid
    if (order.paymentStatus === 2) {
      console.log(`[PayPal] Order ${orderId} already paid, skipping capture`)
      return NextResponse.json({ success: true, alreadyProcessed: true })
    }

    if (order.paymentStatus !== 1) {
      return NextResponse.json({ error: 'Order is not in pending state' }, { status: 409 })
    }

    const result = await capturePayPalOrder(paypalOrderId)

    if (result.status === 'COMPLETED') {
      const capture = result.purchase_units?.[0]?.payments?.captures?.[0]
      const captureId = capture?.id
      const captureDate = capture?.create_time ?? new Date().toISOString()

      console.log(`[PayPal] Payment captured for order ${orderId}, captureId: ${captureId}`)

      await processSuccessfulPayment({
        orderId,
        paymentDate: captureDate,
        providerOrderId: captureId,
      })

      return NextResponse.json({ success: true, alreadyProcessed: false })
    }

    // Payment not completed — mark as rejected
    console.warn(`[PayPal] Capture status ${result.status} for order ${orderId}`)
    await updateOrderPaymentStatus(orderId, 3)

    return NextResponse.json(
      { success: false, error: 'Payment was not completed' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[PayPal] Error capturing order:', error)
    return NextResponse.json(
      { error: 'Failed to capture PayPal payment' },
      { status: 500 }
    )
  }
}
