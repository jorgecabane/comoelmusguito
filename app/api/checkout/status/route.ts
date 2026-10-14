/**
 * API Route: Consultar estado de pago
 * POST /api/checkout/status
 *
 * Este endpoint SOLO consulta el estado del pago y devuelve información al usuario.
 * NO modifica estados, NO crea accesos, NO descuenta stock, NO envía emails.
 *
 * Branching:
 * - PayPal: la orden en Sanity ya quedó actualizada por /api/checkout/paypal/capture-order,
 *   así que leemos directo de Sanity (PayPal no tiene un endpoint público de "status by orderId").
 * - Flow: consulta a Flow.cl por token o commerceOrder. El webhook de Flow es la fuente
 *   de verdad para actualizar la orden en Sanity.
 *
 * Es público (basta el orderId o token), así que no devuelve datos personales
 * (email, nombre, payer). El dueño con sesión los obtiene en /api/checkout/order-details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus, getPaymentStatusByOrder } from '@/lib/flow/client';
import { getOrderByOrderId } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

interface StatusRequest {
  token?: string;
  orderId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StatusRequest = await request.json();
    const { token, orderId } = body;

    if (!token && !orderId) {
      return NextResponse.json(
        { error: 'Token u orderId requerido' },
        { status: 400 }
      );
    }

    // Si tenemos orderId, primero detectamos el proveedor desde Sanity.
    // Las órdenes PayPal no se pueden consultar contra Flow.
    if (orderId) {
      const order = await getOrderByOrderId(orderId);

      if (order?.paymentProvider === 'paypal') {
        return NextResponse.json({
          success: true,
          paymentStatus: order.paymentStatus,
          amount: order.total,
          currency: order.currency,
          commerceOrder: order.orderId,
          paymentDate: order.paymentDate,
        });
      }
    }

    let paymentStatus;

    if (token) {
      paymentStatus = await getPaymentStatus(token);
    } else if (orderId) {
      paymentStatus = await getPaymentStatusByOrder(orderId);
    } else {
      return NextResponse.json(
        { error: 'Token u orderId requerido' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentStatus.status,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      commerceOrder: paymentStatus.commerceOrder,
      flowOrder: paymentStatus.flowOrder,
      paymentDate: paymentStatus.paymentDate,
    });
  } catch (error) {
    console.error('Error consultando estado de pago:', error);
    return NextResponse.json(
      { error: 'Error al consultar estado del pago' },
      { status: 500 }
    );
  }
}

