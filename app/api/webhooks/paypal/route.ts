/**
 * PayPal Webhook
 * Backup receiver for PayPal payment notifications
 * (primary flow is client-side capture-order)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal/webhook';
import type { PayPalWebhookEvent, PayPalWebhookHeaders } from '@/lib/paypal/types';
import { writeClient } from '@/sanity/lib/client';
import {
  updateOrderPaymentStatus,
  processSuccessfulPayment,
} from '@/lib/sanity/orders';
import type { SanityOrder } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

const ok = () => NextResponse.json({ received: true }, { status: 200 });

async function getOrderByPaypalOrderId(paypalOrderId: string): Promise<SanityOrder | null> {
  return writeClient.fetch<SanityOrder | null>(
    `*[_type == "order" && paypalOrderId == $paypalOrderId][0]`,
    { paypalOrderId }
  );
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();

  let webhookEvent: PayPalWebhookEvent;

  try {
    const rawBody = await request.text();
    webhookEvent = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    console.warn(`[Webhook PayPal] ${timestamp} | Error parsing body`);
    return ok();
  }

  // Extract PayPal signature headers
  const webhookHeaders: PayPalWebhookHeaders = {
    'paypal-auth-algo': request.headers.get('paypal-auth-algo') ?? '',
    'paypal-cert-url': request.headers.get('paypal-cert-url') ?? '',
    'paypal-transmission-id': request.headers.get('paypal-transmission-id') ?? '',
    'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') ?? '',
    'paypal-transmission-time': request.headers.get('paypal-transmission-time') ?? '',
  };

  const isValid = await verifyPayPalWebhook(webhookHeaders, webhookEvent);
  if (!isValid) {
    console.warn(`[Webhook PayPal] ${timestamp} | Signature verification failed — ignoring`);
    // Return 200 to prevent PayPal retries on invalid signatures
    return ok();
  }

  const { event_type: eventType, resource } = webhookEvent;
  console.log(`[Webhook PayPal] ${timestamp} | Event: ${eventType}`);

  try {
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const paypalOrderId = (
          resource as { supplementary_data?: { related_ids?: { order_id?: string } } }
        ).supplementary_data?.related_ids?.order_id;

        if (!paypalOrderId) {
          console.warn(`[Webhook PayPal] PAYMENT.CAPTURE.COMPLETED | Missing order_id in resource`);
          break;
        }

        const order = await getOrderByPaypalOrderId(paypalOrderId);
        if (!order) {
          console.warn(`[Webhook PayPal] PAYMENT.CAPTURE.COMPLETED | Order not found for paypalOrderId: ${paypalOrderId}`);
          break;
        }

        if (order.emailSent) {
          console.log(`[Webhook PayPal] PAYMENT.CAPTURE.COMPLETED | Order ${order.orderId} already processed — skipping`);
          break;
        }

        const capture = resource as { create_time?: string; id?: string };
        await processSuccessfulPayment({
          orderId: order.orderId,
          paymentDate: capture.create_time,
          providerOrderId: capture.id,
        });
        console.log(`[Webhook PayPal] ✅ PAYMENT.CAPTURE.COMPLETED | Order ${order.orderId} processed`);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        const paypalOrderId = (
          resource as { supplementary_data?: { related_ids?: { order_id?: string } } }
        ).supplementary_data?.related_ids?.order_id;

        if (!paypalOrderId) {
          console.warn(`[Webhook PayPal] PAYMENT.CAPTURE.DENIED | Missing order_id in resource`);
          break;
        }

        const order = await getOrderByPaypalOrderId(paypalOrderId);
        if (!order) {
          console.warn(`[Webhook PayPal] PAYMENT.CAPTURE.DENIED | Order not found for paypalOrderId: ${paypalOrderId}`);
          break;
        }

        await updateOrderPaymentStatus(order.orderId, 3);
        console.log(`[Webhook PayPal] ✅ PAYMENT.CAPTURE.DENIED | Order ${order.orderId} marked rejected`);
        break;
      }

      case 'CHECKOUT.ORDER.VOIDED': {
        const paypalOrderId = (resource as { id?: string }).id;

        if (!paypalOrderId) {
          console.warn(`[Webhook PayPal] CHECKOUT.ORDER.VOIDED | Missing resource.id`);
          break;
        }

        const order = await getOrderByPaypalOrderId(paypalOrderId);
        if (!order) {
          console.warn(`[Webhook PayPal] CHECKOUT.ORDER.VOIDED | Order not found for paypalOrderId: ${paypalOrderId}`);
          break;
        }

        await updateOrderPaymentStatus(order.orderId, 4);
        console.log(`[Webhook PayPal] ✅ CHECKOUT.ORDER.VOIDED | Order ${order.orderId} marked cancelled`);
        break;
      }

      case 'CUSTOMER.DISPUTE.CREATED': {
        console.warn(`[PayPal Dispute]`, webhookEvent);
        break;
      }

      default:
        console.log(`[Webhook PayPal] ${timestamp} | Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[Webhook PayPal] ${timestamp} | Error handling event ${eventType}:`, error);
    // Always return 200 — PayPal retries on non-2xx
  }

  return ok();
}
