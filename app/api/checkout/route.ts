/**
 * API Route: Crear orden de pago en Flow
 * POST /api/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder } from '@/lib/flow/client';
import { getUserCurrency, getUserCountry } from '@/lib/utils/geolocation';
import { convertUSDToCLP } from '@/lib/utils/currency';
import { saveOrderToSanity } from '@/lib/sanity/orders';
import { checkTerrariumStock, checkWorkshopSpots, checkSupplyStock } from '@/lib/sanity/inventory';
import { getTerrariumById, getCourseById, getWorkshopById, getSupplyById } from '@/lib/sanity/fetch';
import { getCoursePrice } from '@/lib/sanity/utils';
import { generateGiftToken } from '@/lib/utils/gift-token';
import { sanitizeEmail, sanitizeString } from '@/lib/utils/sanitize';
import type { CartItem } from '@/types/cart';

// Límites de seguridad
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_ORDER = 20;
const PRICE_TOLERANCE = 1; // Tolerancia de $1 por redondeo

export const dynamic = 'force-dynamic';

interface CheckoutRequest {
  items: CartItem[];
  email: string;
  customerName?: string;
  userId?: string; // ID del usuario si está registrado
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
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, email, customerName, userId, isGift, recipientEmail, recipientName, giftMessage, requiresShipping, shippingAddress } = body;

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

    // Detectar país y moneda del usuario
    const userCountry = await getUserCountry();
    const userCurrency = await getUserCurrency();

    // 🔒 VALIDACIÓN DE SEGURIDAD: Validar productos y precios en el servidor
    const validatedItems: CartItem[] = [];
    
    for (const item of items) {
      let product;
      let validatedPrice: number;
      let validatedCurrency: 'CLP' | 'USD';

      // Validar existencia y obtener precio real del producto
      if (item.type === 'terrarium') {
        product = await getTerrariumById(item.id);
        if (!product) {
          return NextResponse.json(
            { error: `Producto "${item.name}" no encontrado` },
            { status: 400 }
          );
        }
        // Los terrarios no tienen campo "published", pero verificamos inStock
        if (!product.inStock) {
          return NextResponse.json(
            { error: `Producto "${item.name}" no está disponible` },
            { status: 400 }
          );
        }
        validatedPrice = product.price;
        validatedCurrency = product.currency;

        // Validar stock
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
      } else if (item.type === 'course') {
        product = await getCourseById(item.id);
        if (!product) {
          return NextResponse.json(
            { error: `Curso "${item.name}" no encontrado` },
            { status: 400 }
          );
        }
        if (!product.published) {
          return NextResponse.json(
            { error: `Curso "${item.name}" no está disponible` },
            { status: 400 }
          );
        }
        // Obtener precio según moneda del usuario
        const pricing = getCoursePrice(product, userCurrency);
        validatedPrice = pricing.salePrice || pricing.price;
        validatedCurrency = pricing.currency;
      } else if (item.type === 'workshop') {
        product = await getWorkshopById(item.id);
        if (!product) {
          return NextResponse.json(
            { error: `Taller "${item.name}" no encontrado` },
            { status: 400 }
          );
        }
        if (!product.published) {
          return NextResponse.json(
            { error: `Taller "${item.name}" no está disponible` },
            { status: 400 }
          );
        }
        validatedPrice = product.price;
        validatedCurrency = product.currency;

        // Validar fecha del taller
        if (item.selectedDate) {
          const dateObj = product.dates?.find(
            (d) => new Date(d.date).toISOString() === new Date(item.selectedDate!.date).toISOString()
          );

          if (!dateObj) {
            return NextResponse.json(
              { error: `La fecha seleccionada no es válida para el taller "${item.name}"` },
              { status: 400 }
            );
          }

          if (dateObj.status === 'cancelled') {
            return NextResponse.json(
              { error: `La fecha seleccionada está cancelada para el taller "${item.name}"` },
              { status: 400 }
            );
          }

          const fechaTaller = new Date(dateObj.date);
          if (fechaTaller <= new Date()) {
            return NextResponse.json(
              { error: `La fecha seleccionada ya pasó para el taller "${item.name}"` },
              { status: 400 }
            );
          }

          // Validar cupos
          const spotsCheck = await checkWorkshopSpots(
            item.id,
            item.selectedDate.date,
            item.quantity
          );
          if (!spotsCheck.available) {
            return NextResponse.json(
              {
                error: `Lo sentimos, no hay suficientes cupos disponibles para "${item.name}" en la fecha seleccionada. Solo queda${spotsCheck.currentSpots === 1 ? '' : 'n'} ${spotsCheck.currentSpots} ${spotsCheck.currentSpots === 1 ? 'cupo' : 'cupos'}.`,
                outOfStock: true,
                itemId: item.id,
                itemName: item.name,
              },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `Debes seleccionar una fecha para el taller "${item.name}"` },
            { status: 400 }
          );
        }
      } else if (item.type === 'supply') {
        product = await getSupplyById(item.id);
        if (!product) {
          return NextResponse.json(
            { error: `Insumo "${item.name}" no encontrado` },
            { status: 400 }
          );
        }
        // Los insumos no tienen campo "published", pero verificamos inStock
        if (!product.inStock) {
          return NextResponse.json(
            { error: `Insumo "${item.name}" no está disponible` },
            { status: 400 }
          );
        }
        validatedPrice = product.price;
        validatedCurrency = product.currency;

        // Validar stock
        const stockCheck = await checkSupplyStock(item.id, item.quantity);
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
      } else {
        return NextResponse.json(
          { error: `Tipo de producto inválido: ${item.type}` },
          { status: 400 }
        );
      }

      // 🔒 VALIDAR PRECIO: Comparar precio del cliente con precio real
      const priceDiff = Math.abs(item.price - validatedPrice);
      if (priceDiff > PRICE_TOLERANCE) {
        console.error(`⚠️ Intento de manipulación de precio detectado:`, {
          itemId: item.id,
          itemName: item.name,
          precioCliente: item.price,
          precioReal: validatedPrice,
          diferencia: priceDiff,
        });
        return NextResponse.json(
          { error: `Precio inválido para "${item.name}". Por favor, recarga la página.` },
          { status: 400 }
        );
      }

      // Usar precio validado del servidor
      validatedItems.push({
        ...item,
        price: validatedPrice,
        currency: validatedCurrency,
      });
    }

    // Calcular totales por moneda usando precios validados
    const totalsByCurrency: Record<string, number> = {};
    validatedItems.forEach((item) => {
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
    // Usamos el API route que maneja tanto POST como GET de Flow
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const urlReturn = `${baseUrl}/api/checkout/callback?order=${commerceOrder}`;

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
      items: validatedItems.map((item) => ({
        name: item.name,
        amount: item.price, // Precio validado del servidor
        quantity: item.quantity,
      })),
    });

    if (!paymentResponse.url) {
      return NextResponse.json(
        { error: 'No se pudo generar la URL de pago' },
        { status: 500 }
      );
    }

    // Generar token de regalo si es regalo
    const giftToken = isGift ? generateGiftToken() : undefined;

    // Sanitizar datos de regalo
    const sanitizedRecipientEmail = recipientEmail ? (sanitizeEmail(recipientEmail) || undefined) : undefined;
    const sanitizedRecipientName = recipientName ? (sanitizeString(recipientName) || undefined) : undefined;
    const sanitizedGiftMessage = giftMessage ? (sanitizeString(giftMessage).substring(0, 500) || undefined) : undefined;

    // Guardar orden en Sanity con items validados
    await saveOrderToSanity({
      orderId: commerceOrder,
      flowOrder: paymentResponse.flowOrder,
      customerEmail: email,
      customerName: customerName,
      userId: userId, // Si el usuario está registrado, vincular desde el inicio
      items: validatedItems, // Usar items validados con precios correctos
      total: finalAmount,
      currency: finalCurrency,
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
      } : undefined,
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

