/**
 * POST /api/checkout/paypal/capture-order
 * Captures payment after the buyer approves in the PayPal popup.
 * Idempotent: returns success if order is already paid.
 */

import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { amountMatchesOrder } from '@/lib/paypal/amount'
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

    // Only capture the PayPal order we created for this order (create-order)
    if (paypalOrderId !== order.paypalOrderId) {
      console.warn(`[PayPal] paypalOrderId mismatch for order ${orderId}, refusing capture`)
      return NextResponse.json({ error: 'PayPal order does not match' }, { status: 409 })
    }

    const result = await capturePayPalOrder(paypalOrderId)
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0]

    if (result.status === 'COMPLETED' && capture?.status === 'COMPLETED' && amountMatchesOrder(capture.amount, order)) {
      const captureId = capture.id
      const captureDate = capture.create_time ?? new Date().toISOString()

      console.log(`[PayPal] Payment captured for order ${orderId}, captureId: ${captureId}`)

      await processSuccessfulPayment({
        orderId,
        paymentDate: captureDate,
        providerOrderId: captureId,
      })

      return NextResponse.json({ success: true, alreadyProcessed: false })
    }

    // Not completed, or captured amount/currency differs from the order — mark as rejected
    console.warn(
      `[PayPal] Capture not accepted for order ${orderId}: status ${result.status}/${capture?.status}, ` +
        `amount ${capture?.amount?.value} ${capture?.amount?.currency_code} vs ${order.total} ${order.currency}`
    )
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
