/**
 * POST /api/checkout/quote
 * Stateless: devuelve { total, currency } para el carrito sin persistir nada,
 * usando la misma lógica de validación + conversión que /api/checkout.
 * Se usa para mostrar el monto real en `PaymentMethodSelector` antes de pagar.
 */

import { NextResponse } from 'next/server';
import { getUserCurrency } from '@/lib/utils/geolocation';
import { calculateOrderTotals, CheckoutValidationError } from '@/lib/checkout/calculateOrderTotals';
import type { CartItem } from '@/types/cart';

export const dynamic = 'force-dynamic';

interface QuoteRequest {
  items: CartItem[];
  gateway: 'flow' | 'paypal';
  isGift?: boolean;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequest;
    const { items, gateway, isGift } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
    }

    const userCurrency = await getUserCurrency();

    const { validatedItems, total, currency } = await calculateOrderTotals({
      items,
      gateway,
      isGift: !!isGift,
      userCurrency,
      skipAvailabilityChecks: true,
    });

    return NextResponse.json({ total, currency, items: validatedItems });
  } catch (err) {
    if (err instanceof CheckoutValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[quote] error:', err);
    return NextResponse.json({ error: 'Error calculando total' }, { status: 500 });
  }
}
