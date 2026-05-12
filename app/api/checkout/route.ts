/**
 * API Route: Crear orden de pago (Flow o PayPal)
 * POST /api/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder } from '@/lib/flow/client';
import { getUserCurrency } from '@/lib/utils/geolocation';
import { saveOrderToSanity } from '@/lib/sanity/orders';
import { calculateOrderTotals, CheckoutValidationError } from '@/lib/checkout/calculateOrderTotals';
import { generateGiftToken } from '@/lib/utils/gift-token';
import { sanitizeEmail, sanitizeString } from '@/lib/utils/sanitize';
import type { CartItem } from '@/types/cart';

// Límites de seguridad
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_ORDER = 20;

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  items: CartItem[];
  email: string;
  customerName?: string;
  userId?: string; // ID del usuario si está registrado
  gateway?: 'flow' | 'paypal'; // Pasarela de pago (default: 'flow')
  // Campos de Regalo
  isGift?: boolean;
  recipientEmail?: string;
  recipientName?: string;
  giftMessage?: string;
  // Campos de Despacho
  requiresShipping?: boolean;
  shippingAddress?: {
    region: string;
    comuna: string;
    address: string;
    number: string;
    details?: string;
    contactEmail: string;
    phone: string;
    rut: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, email, customerName, userId, gateway = 'flow', isGift, recipientEmail, recipientName, giftMessage, requiresShipping, shippingAddress } = body;

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

    // Validar datos de regalo si es regalo
    if (isGift) {
      if (!recipientEmail || !recipientEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Email del destinatario es requerido para regalos' },
          { status: 400 }
        );
      }
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return NextResponse.json(
          { error: 'Email del destinatario inválido' },
          { status: 400 }
        );
      }
      // Validar longitud del mensaje
      if (giftMessage && giftMessage.length > 500) {
        return NextResponse.json(
          { error: 'El mensaje personalizado no puede exceder 500 caracteres' },
          { status: 400 }
        );
      }
      // No permitir que el destinatario sea el mismo que el comprador
      if (recipientEmail.toLowerCase() === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'No puedes regalarte algo a ti mismo' },
          { status: 400 }
        );
      }
    }

    // Validar datos de despacho si requiere despacho
    if (requiresShipping) {
      if (!shippingAddress) {
        return NextResponse.json(
          { error: 'Dirección de despacho es requerida' },
          { status: 400 }
        );
      }
      if (!shippingAddress.region || !shippingAddress.comuna || !shippingAddress.address || !shippingAddress.number) {
        return NextResponse.json(
          { error: 'Todos los campos de dirección son requeridos para despacho' },
          { status: 400 }
        );
      }
      // Validar que la dirección no esté vacía o solo espacios
      if (shippingAddress.address.trim().length === 0 || shippingAddress.number.trim().length === 0) {
        return NextResponse.json(
          { error: 'Dirección y número no pueden estar vacíos' },
          { status: 400 }
        );
      }
      // Validar datos de contacto para despacho
      if (!shippingAddress.contactEmail || !shippingAddress.contactEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Email de contacto válido es requerido para despacho' },
          { status: 400 }
        );
      }
      if (!shippingAddress.phone || shippingAddress.phone.trim().length === 0) {
        return NextResponse.json(
          { error: 'Teléfono de contacto es requerido para despacho' },
          { status: 400 }
        );
      }
      if (!shippingAddress.rut || shippingAddress.rut.trim().length === 0) {
        return NextResponse.json(
          { error: 'RUT es requerido para despacho' },
          { status: 400 }
        );
      }
    }

    // Validar límites de cantidad
    if (items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json(
        { error: `Máximo ${MAX_ITEMS_PER_ORDER} productos por orden` },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (item.quantity > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json(
          { error: `Máximo ${MAX_QUANTITY_PER_ITEM} unidades por producto` },
          { status: 400 }
        );
      }
    }

    // Detectar moneda del usuario (basada en headers de Vercel)
    const userCurrency = await getUserCurrency();

    let validatedItems: CartItem[];
    let finalAmount: number;
    let finalCurrency: 'CLP' | 'USD';
    try {
      const result = await calculateOrderTotals({
        items,
        gateway,
        isGift: !!isGift,
        userCurrency,
      });
      validatedItems = result.validatedItems;
      finalAmount = result.total;
      finalCurrency = result.currency;
    } catch (err) {
      if (err instanceof CheckoutValidationError) {
        return NextResponse.json(
          {
            error: err.message,
            ...(err.availabilityIssue
              ? {
                  availabilityIssue: true,
                  itemId: err.itemId,
                  itemType: err.itemType,
                  itemName: err.itemName,
                  ...(err.outOfStock ? { outOfStock: true } : {}),
                }
              : {}),
          },
          { status: err.status },
        );
      }
      throw err;
    }

    // Generar ID único para la orden
    const commerceOrder = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear descripción del pedido
    const subject = items.length === 1
      ? items[0].name
      : `${items.length} productos - comoelmusguito`;

    // URL de retorno (después del pago)
    // Usamos el API route que maneja tanto POST como GET de Flow
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const urlReturn = `${baseUrl}/api/checkout/callback?order=${commerceOrder}`;

    // URL de confirmación (webhook - opcional)
    const urlConfirmation = `${baseUrl}/api/webhooks/flow`;

    // Generar token de regalo si es regalo
    const giftToken = isGift ? generateGiftToken() : undefined;

    // Sanitizar datos de regalo
    const sanitizedRecipientEmail = recipientEmail ? (sanitizeEmail(recipientEmail) || undefined) : undefined;
    const sanitizedRecipientName = recipientName ? (sanitizeString(recipientName) || undefined) : undefined;
    const sanitizedGiftMessage = giftMessage ? (sanitizeString(giftMessage).substring(0, 500) || undefined) : undefined;

    // Datos comunes para guardar la orden en Sanity
    const orderData = {
      orderId: commerceOrder,
      customerEmail: email,
      customerName: customerName,
      userId: userId,
      items: validatedItems,
      total: finalAmount,
      currency: finalCurrency,
      paymentProvider: gateway,
      // Campos de regalo
      isGift: isGift || false,
      recipientEmail: sanitizedRecipientEmail,
      recipientName: sanitizedRecipientName,
      giftMessage: sanitizedGiftMessage,
      giftToken,
      // Campos de despacho
      requiresShipping: requiresShipping || false,
      shippingAddress: requiresShipping && shippingAddress ? {
        region: shippingAddress.region.trim(),
        comuna: shippingAddress.comuna.trim(),
        address: shippingAddress.address.trim(),
        number: shippingAddress.number.trim(),
        details: shippingAddress.details?.trim() || undefined,
        contactEmail: shippingAddress.contactEmail.trim().toLowerCase(),
        phone: shippingAddress.phone.trim(),
        rut: shippingAddress.rut.trim(),
      } : undefined,
    };

    if (gateway === 'paypal') {
      // PayPal: no llamar a Flow, guardar orden y devolver orderId para el SDK de PayPal
      await saveOrderToSanity(orderData);

      return NextResponse.json({
        success: true,
        gateway: 'paypal',
        commerceOrder,
        total: finalAmount,
        currency: finalCurrency,
      });
    }

    // Flow path (existente, sin cambios)
    const paymentResponse = await createPaymentOrder({
      commerceOrder,
      subject,
      currency: finalCurrency,
      amount: Math.round(finalAmount), // Flow requiere números enteros
      email,
      urlReturn,
      urlConfirmation,
      paymentMethod: 9, // 9 = Todos los métodos disponibles
      items: validatedItems.map((item) => ({
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

    // Guardar orden en Sanity con flowOrder
    await saveOrderToSanity({
      ...orderData,
      flowOrder: paymentResponse.flowOrder,
    });

    return NextResponse.json({
      success: true,
      gateway: 'flow',
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

