/**
 * Funciones para gestionar órdenes en Sanity
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';
import type { CartItem } from '@/types/cart';
import { sendOrderConfirmationEmail, sendGiftEmail } from '@/lib/resend/client';
import type { EmailOrderData, EmailOrderItem, GiftEmailData } from '@/lib/resend/client';
import { markGiftAsRedeemed } from '@/lib/sanity/gifts';
import {
  decreaseTerrariumStock,
  decreaseWorkshopSpots,
  decreaseSupplyStock,
} from '@/lib/sanity/inventory';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';

export interface SanityOrder {
  _id?: string;
  _type: 'order';
  orderId: string;
  flowOrder?: string | number; // Flow puede devolver string o number, pero siempre se guarda como string
  customerEmail: string;
  customerName?: string;
  userId?: {
    _type: 'reference';
    _ref: string;
  } | null;
  items: Array<{
    id: string;
    type: 'terrarium' | 'course' | 'workshop' | 'supply';
    name: string;
    slug: string;
    price: number;
    currency: 'CLP' | 'USD';
    quantity: number;
    selectedDate?: {
      date: string;
      time?: string;
    };
    shippingPreference?: 'pickup' | 'shipping'; // Preferencia de envío del cliente
    // Snapshot del producto al momento de compra (por si se elimina después)
    snapshot?: {
      image?: string; // URL de la imagen principal
      description?: string; // Descripción corta
      longDescription?: any[]; // Descripción completa (rich text)
      // Información adicional según tipo
      size?: string; // Para terrarios
      category?: string; // Para terrarios e insumos
      duration?: number; // Para cursos (horas)
      level?: string; // Para cursos
      location?: string; // Para talleres
      weight?: number; // Para insumos
    };
  }>;
  total: number;
  currency: 'CLP' | 'USD';
  paymentStatus: number;
  paymentDate?: string;
  emailSent?: boolean;
  // Campos de Regalo
  isGift?: boolean;
  recipientEmail?: string;
  recipientName?: string;
  giftMessage?: string;
  giftToken?: string;
  giftRedeemedAt?: string;
  giftRedeemedBy?: {
    _type: 'reference';
    _ref: string;
  } | null;
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Guardar orden en Sanity
 */
export async function saveOrderToSanity(data: {
  orderId: string;
  flowOrder?: string;
  customerEmail: string;
  customerName?: string;
  userId?: string;
  items: CartItem[];
  total: number;
  currency: 'CLP' | 'USD';
  // Campos de regalo
  isGift?: boolean;
  recipientEmail?: string;
  recipientName?: string;
  giftMessage?: string;
  giftToken?: string;
  // Campos de despacho
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
}): Promise<SanityOrder> {
  const now = new Date().toISOString();

  const orderDoc: Omit<SanityOrder, '_id'> = {
    _type: 'order',
    orderId: data.orderId,
    // Convertir flowOrder a string si es number
    flowOrder: data.flowOrder ? String(data.flowOrder) : undefined,
    customerEmail: data.customerEmail.toLowerCase(),
    customerName: data.customerName,
    userId: data.userId
      ? {
          _type: 'reference',
          _ref: data.userId,
        }
      : undefined, // Usar undefined en lugar de null para campos reference opcionales
    items: data.items.map((item, index) => ({
      _key: `${item.id}-${index}-${Date.now()}`, // _key único requerido por Sanity para arrays
      id: item.id,
      type: item.type,
      name: item.name,
      slug: item.slug,
      price: item.price,
      currency: item.currency,
      quantity: item.quantity,
      selectedDate: item.selectedDate
        ? {
            // Guardamos sólo el ISO como fuente de verdad. La hora se computa
            // en render con `formatTime` usando la zona horaria de Chile.
            date: item.selectedDate.date,
          }
        : undefined,
      shippingPreference: (item as any).shippingPreference,
      // Guardar snapshot del producto (se pasa desde el checkout)
      snapshot: (item as any).snapshot,
    })),
    total: data.total,
    currency: data.currency,
    paymentStatus: 1, // Pendiente
    // Campos de regalo
    isGift: data.isGift || false,
    recipientEmail: data.recipientEmail,
    recipientName: data.recipientName,
    giftMessage: data.giftMessage,
    giftToken: data.giftToken,
    // Campos de despacho
    requiresShipping: data.requiresShipping || false,
    shippingAddress: data.shippingAddress,
    createdAt: now,
    updatedAt: now,
  };

  // Usar writeClient para operaciones de escritura
  const created = await writeClient.create(orderDoc);
  return created as SanityOrder;
}

/**
 * Actualizar estado de pago de una orden
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: number,
  paymentDate?: string,
  flowOrder?: string | number
): Promise<void> {
  // Buscar orden por orderId
  const query = `*[_type == "order" && orderId == $orderId][0]`;
  const order = await client.fetch<SanityOrder | null>(query, { orderId });

  if (!order || !order._id) {
    throw new Error(`Orden ${orderId} no encontrada`);
  }

  const updates: Partial<SanityOrder> = {
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  if (paymentDate) {
    updates.paymentDate = paymentDate;
  }

  if (flowOrder !== undefined) {
    // Convertir a string si es number
    updates.flowOrder = typeof flowOrder === 'number' ? String(flowOrder) : flowOrder;
  }

  // Usar writeClient para operaciones de escritura
  await writeClient.patch(order._id).set(updates).commit();
}

/**
 * Marcar email como enviado en una orden
 */
export async function markOrderEmailSent(orderId: string): Promise<void> {
  const query = `*[_type == "order" && orderId == $orderId][0]`;
  const order = await client.fetch<SanityOrder | null>(query, { orderId });

  if (!order || !order._id) {
    throw new Error(`Orden ${orderId} no encontrada`);
  }

  await writeClient
    .patch(order._id)
    .set({
      emailSent: true,
      updatedAt: new Date().toISOString(),
    })
    .commit();
}

/**
 * Obtener orden por orderId
 */
export async function getOrderByOrderId(orderId: string): Promise<SanityOrder | null> {
  const query = `*[_type == "order" && orderId == $orderId][0]`;
  const order = await client.fetch<SanityOrder | null>(query, { orderId });
  return order;
}

/**
 * Obtener órdenes por email (para vincular)
 */
export async function getOrdersByEmail(
  email: string,
  includeLinked: boolean = false
): Promise<SanityOrder[]> {
  const emailLower = email.toLowerCase();
  
  let query = `*[_type == "order" && customerEmail == $email`;
  
  if (!includeLinked) {
    query += ` && !defined(userId)`;
  }
  
  query += `] | order(createdAt desc)`;
  
  const orders = await client.fetch<SanityOrder[]>(query, { email: emailLower });
  return orders;
}

/**
 * Vincular órdenes a un usuario
 * También crea accesos a cursos si las órdenes están confirmadas
 */
export async function linkOrdersToUser(
  email: string,
  userId: string
): Promise<number> {
  const orders = await getOrdersByEmail(email, false);

  if (orders.length === 0) {
    return 0;
  }

  const userIdRef = {
    _type: 'reference' as const,
    _ref: userId,
  };

  // Actualizar todas las órdenes
  const patches = orders
    .filter((order) => order._id)
    .map((order) =>
      writeClient
        .patch(order._id!)
        .set({
          userId: userIdRef,
          updatedAt: new Date().toISOString(),
        })
        .commit()
    );

  await Promise.all(patches);

  // Crear accesos a cursos para órdenes confirmadas que tienen cursos
  for (const order of orders) {
    if (order.paymentStatus === 2 && order._id) {
      // Orden confirmada, crear accesos a cursos
      // Solo si NO es regalo (los regalos se manejan por recipientEmail)
      if (!order.isGift) {
        for (const item of order.items) {
          if (item.type === 'course') {
            try {
              // Verificar si ya existe el acceso (idempotencia)
              const existingAccess = await client.fetch(
                `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
                { userId, courseId: item.id }
              );

              if (!existingAccess) {
                await createCourseAccess(userId, item.id, order._id);
                console.log(`✅ Acceso a curso ${item.id} creado al vincular orden ${order.orderId}`);
              }
            } catch (error) {
              console.error(`Error creando acceso a curso ${item.id} al vincular orden:`, error);
              // No fallar la vinculación si hay error creando acceso
            }
          }
        }
      }
    }
  }

  return orders.length;
}

/**
 * Obtener órdenes de un usuario
 */
export async function getOrdersByUserId(userId: string): Promise<SanityOrder[]> {
  const query = `*[_type == "order" && userId._ref == $userId] | order(createdAt desc)`;
  const orders = await client.fetch<SanityOrder[]>(query, { userId });
  return orders;
}

/**
 * Obtener la última dirección de despacho usada por un usuario
 * Retorna null si no hay órdenes anteriores con despacho
 */
export async function getLastShippingAddressByUserId(userId: string): Promise<SanityOrder['shippingAddress'] | null> {
  const query = `*[_type == "order" && userId._ref == $userId && requiresShipping == true && defined(shippingAddress)] | order(createdAt desc)[0] {
    shippingAddress
  }`;
  const result = await client.fetch<{ shippingAddress: SanityOrder['shippingAddress'] } | null>(query, { userId });
  return result?.shippingAddress ?? null;
}

/**
 * Procesar un pago exitoso (status=2) de forma idempotente.
 * Compartido entre webhooks de Flow, PayPal, y cualquier gateway futuro.
 *
 * Pasos:
 * 1. Verificar idempotencia (emailSent)
 * 2. Actualizar estado de pago
 * 3. Crear accesos a cursos (regalo o compra directa)
 * 4. Descontar inventario (terrarios, insumos, talleres)
 * 5. Enviar emails (confirmación + regalo si aplica)
 * 6. Marcar email como enviado
 */
export async function processSuccessfulPayment(params: {
  orderId: string;
  paymentDate?: string;
  providerOrderId?: string;
}): Promise<{ success: boolean; alreadyProcessed: boolean }> {
  const { orderId, paymentDate, providerOrderId } = params;

  // 1. Obtener la orden
  const savedOrder = await getOrderByOrderId(orderId);
  if (!savedOrder) {
    throw new Error(`Orden ${orderId} no encontrada en Sanity`);
  }

  // 2. Idempotencia: si ya se procesó, retornar sin hacer nada
  if (savedOrder.emailSent) {
    return { success: true, alreadyProcessed: true };
  }

  // 3. Actualizar estado de pago
  if (savedOrder.paymentStatus !== 2) {
    try {
      await updateOrderPaymentStatus(orderId, 2, paymentDate, providerOrderId);
    } catch (error) {
      console.error('Error actualizando estado de la orden:', error);
    }
  } else if (paymentDate && !savedOrder.paymentDate) {
    try {
      await updateOrderPaymentStatus(orderId, 2, paymentDate, providerOrderId);
    } catch (error) {
      console.error('Error actualizando paymentDate:', error);
    }
  }

  // 4. Crear accesos a cursos
  if (savedOrder.isGift && savedOrder.recipientEmail && savedOrder.giftToken) {
    // Regalo: crear acceso para el destinatario si tiene cuenta
    const recipientUser = await getUserByEmail(savedOrder.recipientEmail);

    if (recipientUser?._id && savedOrder._id) {
      let coursesCreated = 0;
      for (const item of savedOrder.items) {
        if (item.type === 'course') {
          try {
            const existingAccess = await client.fetch(
              `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
              { userId: recipientUser._id, courseId: item.id }
            );

            if (!existingAccess) {
              await createCourseAccess(recipientUser._id, item.id, savedOrder._id);
              coursesCreated++;
              console.log(`✅ Acceso a curso ${item.id} creado para destinatario ${savedOrder.recipientEmail}`);
            } else {
              console.log(`⚠️ Destinatario ya tiene acceso a curso ${item.id}`);
            }
          } catch (error) {
            console.error(`Error creando acceso a curso ${item.id} para destinatario:`, error);
          }
        }
      }

      if (coursesCreated > 0) {
        try {
          await markGiftAsRedeemed(savedOrder.orderId, recipientUser._id);
          console.log(`✅ Regalo ${savedOrder.orderId} marcado como canjeado automáticamente para destinatario ${savedOrder.recipientEmail}`);
        } catch (error) {
          console.error(`Error marcando regalo como canjeado:`, error);
        }
      }
    } else {
      console.log(`[processSuccessfulPayment] Destinatario no tiene cuenta, acceso se creará al registrarse o canjear token`);
    }
  } else {
    // Compra directa: crear acceso para el comprador
    if (savedOrder.userId?._ref && savedOrder._id) {
      for (const item of savedOrder.items) {
        if (item.type === 'course') {
          try {
            await createCourseAccess(savedOrder.userId._ref, item.id, savedOrder._id);
          } catch (error) {
            console.error(`Error creando acceso a curso ${item.id}:`, error);
          }
        }
      }
    }
  }

  // 5. Descontar inventario
  for (const item of savedOrder.items) {
    if (item.type === 'terrarium') {
      try {
        await decreaseTerrariumStock(item.id, item.quantity);
      } catch (error) {
        console.error(`Error descontando stock de terrario ${item.id}:`, error);
      }
    }
    if (item.type === 'supply') {
      try {
        await decreaseSupplyStock(item.id, item.quantity);
      } catch (error) {
        console.error(`Error descontando stock de insumo ${item.id}:`, error);
      }
    }
    if (item.type === 'workshop' && item.selectedDate) {
      try {
        await decreaseWorkshopSpots(item.id, item.selectedDate.date, item.quantity);
      } catch (error) {
        console.error(`Error descontando cupos de taller ${item.id}:`, error);
      }
    }
  }

  // 6. Enviar emails
  const orderItems: EmailOrderItem[] = savedOrder.items.map((item) => ({
    name: item.name,
    type: item.type,
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
    slug: item.slug,
    selectedDate: item.selectedDate ? { date: item.selectedDate.date } : undefined,
  }));

  const hasAccount = !!savedOrder.userId?._ref;
  const resolvedProviderOrder = providerOrderId ?? savedOrder.flowOrder;

  const emailData: EmailOrderData = {
    orderId: savedOrder.orderId,
    flowOrder: resolvedProviderOrder ? String(resolvedProviderOrder) : undefined,
    customerEmail: savedOrder.customerEmail,
    customerName: savedOrder.customerName,
    items: orderItems,
    total: savedOrder.total,
    currency: savedOrder.currency,
    paymentDate: paymentDate ?? new Date().toISOString(),
    hasAccount,
    isGift: savedOrder.isGift ?? false,
    recipientName: savedOrder.recipientName,
    recipientEmail: savedOrder.recipientEmail,
    giftMessage: savedOrder.giftMessage,
    requiresShipping: savedOrder.requiresShipping ?? false,
    shippingAddress: savedOrder.shippingAddress,
  };

  if (emailData.customerEmail) {
    try {
      // Email de regalo al destinatario
      if (savedOrder.isGift && savedOrder.recipientEmail && savedOrder.giftToken) {
        const giftEmailData: GiftEmailData = {
          giftToken: savedOrder.giftToken,
          recipientName: savedOrder.recipientName,
          recipientEmail: savedOrder.recipientEmail,
          senderName: savedOrder.customerName,
          senderEmail: savedOrder.customerEmail,
          giftMessage: savedOrder.giftMessage,
          items: orderItems,
          orderId: savedOrder.orderId,
          requiresShipping: savedOrder.requiresShipping ?? false,
          shippingAddress: savedOrder.shippingAddress,
        };

        try {
          await sendGiftEmail(giftEmailData);
          console.log(`✅ Email de regalo enviado a ${savedOrder.recipientEmail}`);
        } catch (giftEmailError) {
          console.error('Error enviando email de regalo:', giftEmailError);
        }
      }

      // Email de confirmación al comprador (siempre)
      await sendOrderConfirmationEmail(emailData);
      console.log(`✅ Email de confirmación enviado a ${emailData.customerEmail}`);

      // 7. Marcar email como enviado (idempotencia)
      try {
        await markOrderEmailSent(orderId);
        console.log(`✅ Email marcado como enviado para orden ${orderId}`);
      } catch (error) {
        console.error('Error marcando email como enviado:', error);
      }
    } catch (emailError) {
      console.error('Error enviando emails:', emailError);
    }
  }

  return { success: true, alreadyProcessed: false };
}

/**
 * Crear acceso a curso cuando se compra
 * Es idempotente: si ya existe el acceso, no crea duplicado
 */
export async function createCourseAccess(
  userId: string,
  courseId: string,
  orderSanityId: string // _id de la orden en Sanity, no orderId
): Promise<void> {
  // Verificar si ya existe el acceso (idempotencia)
  const existingAccess = await client.fetch(
    `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
    { userId, courseId }
  );

  if (existingAccess) {
    console.log(`Acceso a curso ${courseId} ya existe para usuario ${userId}, saltando creación`);
    return;
  }

  const now = new Date().toISOString();

  const accessDoc = {
    _type: 'courseAccess',
    user: {
      _type: 'reference',
      _ref: userId,
    },
    course: {
      _type: 'reference',
      _ref: courseId,
    },
    order: {
      _type: 'reference',
      _ref: orderSanityId,
    },
    accessGrantedAt: now,
    progress: {
      completedLessons: [],
      totalWatchTime: 0,
    },
  };

  // Usar writeClient para operaciones de escritura
  await writeClient.create(accessDoc);
  console.log(`✅ Acceso a curso ${courseId} creado para usuario ${userId}`);

  // Incrementar enrollmentCount del curso
  try {
    const course = await client.fetch(
      `*[_type == "course" && _id == $courseId][0]`,
      { courseId }
    );

    if (course) {
      const currentEnrollmentCount = course.enrollmentCount || 0;
      await writeClient
        .patch(courseId)
        .set({
          enrollmentCount: currentEnrollmentCount + 1,
          updatedAt: new Date().toISOString(),
        })
        .commit();
      console.log(`✅ enrollmentCount del curso ${courseId} incrementado a ${currentEnrollmentCount + 1}`);
    }
  } catch (error) {
    console.error(`Error incrementando enrollmentCount del curso ${courseId}:`, error);
    // No fallar la creación del acceso si hay error incrementando el contador
  }
}

