/**
 * API Route: Consultar estado de pago en Flow
 * POST /api/checkout/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStatus, getPaymentStatusByOrder } from '@/lib/flow/client';

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
      payer: paymentStatus.payer,
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

