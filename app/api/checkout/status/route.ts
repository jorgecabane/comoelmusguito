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
          customerEmail: order.customerEmail,
          customerName: order.customerName,
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


    // Obtener email y nombre del cliente si la orden existe
    let customerEmail: string | undefined;
    let customerName: string | undefined;

    if (paymentStatus.commerceOrder) {
      try {
        const order = await getOrderByOrderId(paymentStatus.commerceOrder);
        if (order) {
          customerEmail = order.customerEmail;
          customerName = order.customerName;
        }
      } catch (error) {
        // No fallar si no se puede obtener la orden
        console.error('Error obteniendo email de la orden:', error);
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentStatus.status,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
      commerceOrder: paymentStatus.commerceOrder,
      flowOrder: paymentStatus.flowOrder,
      paymentDate: paymentStatus.paymentDate,
      payer: paymentStatus.payer,
      customerEmail,
      customerName,
    });
  } catch (error) {
    console.error('Error consultando estado de pago:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al consultar estado del pago',
      },
      { status: 500 }
    );
  }
}

