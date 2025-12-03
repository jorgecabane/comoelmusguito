/**
 * API Route: Crear orden de pago en Flow
 * POST /api/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder } from '@/lib/flow/client';
import { getUserCurrency, getUserCountry } from '@/lib/utils/geolocation';
import { convertUSDToCLP } from '@/lib/utils/currency';
import { saveOrderToSanity } from '@/lib/sanity/orders';
import { checkTerrariumStock, checkWorkshopSpots } from '@/lib/sanity/inventory';
import type { CartItem } from '@/types/cart';

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  items: CartItem[];
  email: string;
  customerName?: string;
  userId?: string; // ID del usuario si está registrado
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, email, customerName, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El carrito está vacío' },
        { status: 400 }
      );
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email válido requerido' },
        { status: 400 }
      );
    }

    // Validar stock/cupos disponibles antes de procesar el pago
    for (const item of items) {
      if (item.type === 'terrarium') {
        const stockCheck = await checkTerrariumStock(item.id, item.quantity);
        if (!stockCheck.available) {
          return NextResponse.json(
            {
              error: `Lo sentimos, "${item.name}" ya no está disponible. Solo quedan ${stockCheck.currentStock} unidades.`,
              outOfStock: true,
              itemId: item.id,
              itemName: item.name,
            },
            { status: 400 }
          );
        }
      } else if (item.type === 'workshop' && item.selectedDate) {
        const spotsCheck = await checkWorkshopSpots(
          item.id,
          item.selectedDate.date,
          item.quantity
        );
        if (!spotsCheck.available) {
          return NextResponse.json(
            {
              error: `Lo sentimos, no hay suficientes cupos disponibles para "${item.name}" en la fecha seleccionada. Solo quedan ${spotsCheck.currentSpots} cupos.`,
              outOfStock: true,
              itemId: item.id,
              itemName: item.name,
            },
            { status: 400 }
          );
        }
      }
    }

    // Detectar país y moneda del usuario
    const userCountry = await getUserCountry();
    const userCurrency = await getUserCurrency();
    
    // Calcular totales por moneda
    const totalsByCurrency: Record<string, number> = {};
    items.forEach((item) => {
      const currency = item.currency;
      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = 0;
      }
      totalsByCurrency[currency] += item.price * item.quantity;
    });

    // Si hay items en USD y el usuario está en Chile, convertir a CLP
    // Si hay items en USD y el usuario está fuera, mantener USD pero convertir a CLP para Flow
    let finalAmount = 0;
    let finalCurrency: 'CLP' | 'USD' = 'CLP';

    if (userCountry === 'CL') {
      // Usuario en Chile: todo en CLP
      finalAmount = totalsByCurrency['CLP'] || 0;
      if (totalsByCurrency['USD']) {
        // Convertir USD a CLP
        const usdAmount = totalsByCurrency['USD'];
        const clpAmount = await convertUSDToCLP(usdAmount);
        finalAmount += clpAmount;
      }
      finalCurrency = 'CLP';
    } else {
      // Usuario fuera de Chile: convertir todo a CLP para Flow
      finalAmount = totalsByCurrency['CLP'] || 0;
      if (totalsByCurrency['USD']) {
        const usdAmount = totalsByCurrency['USD'];
        const clpAmount = await convertUSDToCLP(usdAmount);
        finalAmount += clpAmount;
      }
      finalCurrency = 'CLP'; // Flow siempre procesa en CLP
    }

    if (finalAmount <= 0) {
      return NextResponse.json(
        { error: 'Monto inválido' },
        { status: 400 }
      );
    }

    // Generar ID único para la orden
    const commerceOrder = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear descripción del pedido
    const subject = items.length === 1
      ? items[0].name
      : `${items.length} productos - comoelmusguito`;

    // URL de retorno (después del pago)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const urlReturn = `${baseUrl}/checkout/callback?order=${commerceOrder}`;

    // URL de confirmación (webhook - opcional)
    const urlConfirmation = `${baseUrl}/api/webhooks/flow`;

    // Crear orden en Flow
    const paymentResponse = await createPaymentOrder({
      commerceOrder,
      subject,
      currency: finalCurrency,
      amount: Math.round(finalAmount), // Flow requiere números enteros
      email,
      urlReturn,
      urlConfirmation,
      paymentMethod: 9, // 9 = Todos los métodos disponibles
      items: items.map((item) => ({
        name: item.name,
        amount: item.price,
        quantity: item.quantity,
      })),
    });

    if (!paymentResponse.url) {
      return NextResponse.json(
        { error: 'No se pudo generar la URL de pago' },
        { status: 500 }
      );
    }

    // Guardar orden en Sanity
    await saveOrderToSanity({
      orderId: commerceOrder,
      flowOrder: paymentResponse.flowOrder,
      customerEmail: email,
      customerName: customerName,
      userId: userId, // Si el usuario está registrado, vincular desde el inicio
      items,
      total: finalAmount,
      currency: finalCurrency,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.url,
      token: paymentResponse.token,
      flowOrder: paymentResponse.flowOrder,
      commerceOrder,
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}

