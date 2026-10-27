/**
 * Funciones para gestionar órdenes en Sanity
 */

import 'server-only';
import { client, newPrivateId, writeClient } from '@/sanity/lib/client';
import { sendMetaPurchase } from '@/lib/analytics/meta-capi';
import type { MetaAttribution } from '@/lib/analytics/meta-attribution';
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
  _rev?: string;
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
  paymentProvider?: 'flow' | 'paypal';
  providerTransactionId?: string;
  paypalOrderId?: string;
  refundedAt?: string;
  refundReason?: string;
  refundAmount?: number;
  emailSent?: boolean;
  paymentProcessedAt?: string; // Marca atómica: accesos e inventario ya aplicados
  // Datos para atribuir la compra a un anuncio de Meta (API de conversiones)
  metaAttribution?: MetaAttribution;
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
  paymentProvider?: 'flow' | 'paypal';
  metaAttribution?: MetaAttribution;
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
    paymentProvider: data.paymentProvider ?? 'flow',
    metaAttribution: data.metaAttribution,
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
  const created = await writeClient.create({ _id: newPrivateId(), ...orderDoc });
  return created as SanityOrder;
}

/**
 * Campos a escribir al cambiar el estado de pago de una orden
 */
function paymentStatusUpdates(
  order: SanityOrder,
  paymentStatus: number,
  paymentDate?: string,
  flowOrder?: string | number
): Partial<SanityOrder> {
  const updates: Partial<SanityOrder> = {
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  if (paymentDate) {
    updates.paymentDate = paymentDate;
  } else if (paymentStatus === 2 && !order.paymentDate) {
    // Red de seguridad: si la pasarela no informa la fecha, la orden queda pagada
    // sin fecha y desaparece de los reportes. El webhook llega segundos después
    // del pago, así que "ahora" es una aproximación fiel.
    updates.paymentDate = new Date().toISOString();
  }

  if (flowOrder !== undefined) {
    updates.flowOrder = String(flowOrder);
  }

  return updates;
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

  await writeClient
    .patch(order._id)
    .set(paymentStatusUpdates(order, paymentStatus, paymentDate, flowOrder))
    .commit();
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
  
  let query = `*[_type == "order" && lower(customerEmail) == $email`;
  
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

const MAX_CLAIM_ATTEMPTS = 3;

/**
 * Reclama la orden de forma atómica: la marca pagada (paymentStatus=2) y con
 * `paymentProcessedAt` usando `ifRevisionId` (bloqueo optimista de Sanity).
 * Sólo una entrega concurrente gana (`claimed: true`); las demás reciben 409,
 * releen y ven la orden ya reclamada.
 */
async function claimPayment(
  orderId: string,
  paymentDate?: string,
  providerOrderId?: string
): Promise<{ order: SanityOrder; claimed: boolean }> {
  for (let attempt = 1; ; attempt++) {
    const order = await getOrderByOrderId(orderId);
    if (!order?._id || !order._rev) {
      throw new Error(`Orden ${orderId} no encontrada en Sanity`);
    }
    // emailSent sin paymentProcessedAt = orden procesada antes de existir el marcador
    if (order.paymentProcessedAt || order.emailSent) {
      return { order, claimed: false };
    }

    try {
      await writeClient
        .patch(order._id)
        .ifRevisionId(order._rev)
        .set({
          ...paymentStatusUpdates(order, 2, paymentDate, providerOrderId),
          paymentProcessedAt: new Date().toISOString(),
        })
        .commit();
      return { order, claimed: true };
    } catch (error) {
      const isRevisionConflict = (error as { statusCode?: number }).statusCode === 409;
      if (!isRevisionConflict || attempt >= MAX_CLAIM_ATTEMPTS) throw error;
    }
  }
}

/**
 * Crear accesos a cursos (regalo al destinatario o compra directa al comprador)
 */
async function grantCourseAccess(order: SanityOrder & { _id: string }): Promise<void> {
  if (!(order.isGift && order.recipientEmail && order.giftToken)) {
    const buyerId = order.userId?._ref;
    if (!buyerId) return;
    for (const item of order.items) {
      if (item.type !== 'course') continue;
      try {
        await createCourseAccess(buyerId, item.id, order._id);
      } catch (error) {
        console.error(`Error creando acceso a curso ${item.id}:`, error);
      }
    }
    return;
  }

  const recipientUser = await getUserByEmail(order.recipientEmail);
  if (!recipientUser?._id) {
    console.log(`[processSuccessfulPayment] Destinatario no tiene cuenta, acceso se creará al registrarse o canjear token`);
    return;
  }

  let coursesCreated = 0;
  for (const item of order.items) {
    if (item.type !== 'course') continue;
    try {
      const existingAccess = await client.fetch(
        `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
        { userId: recipientUser._id, courseId: item.id }
      );
      if (existingAccess) {
        console.log(`⚠️ Destinatario ya tiene acceso a curso ${item.id}`);
        continue;
      }
      await createCourseAccess(recipientUser._id, item.id, order._id);
      coursesCreated++;
    } catch (error) {
      console.error(`Error creando acceso a curso ${item.id} para destinatario:`, error);
    }
  }

  if (coursesCreated === 0) return;
  try {
    await markGiftAsRedeemed(order.orderId, recipientUser._id);
  } catch (error) {
    console.error(`Error marcando regalo como canjeado:`, error);
  }
}

/**
 * Descontar inventario (terrarios, insumos, cupos de talleres)
 */
async function decreaseInventory(order: SanityOrder): Promise<void> {
  for (const item of order.items) {
    try {
      if (item.type === 'terrarium') await decreaseTerrariumStock(item.id, item.quantity);
      if (item.type === 'supply') await decreaseSupplyStock(item.id, item.quantity);
      if (item.type === 'workshop' && item.selectedDate) {
        await decreaseWorkshopSpots(item.id, item.selectedDate.date, item.quantity);
      }
    } catch (error) {
      console.error(`Error descontando inventario de ${item.type} ${item.id}:`, error);
    }
  }
}

/**
 * Enviar emails (regalo + confirmación) y marcar `emailSent` sólo si la
 * confirmación salió, para que un reintento la vuelva a enviar.
 */
async function sendPaymentEmails(
  order: SanityOrder,
  paymentDate?: string,
  providerOrderId?: string
): Promise<void> {
  if (!order.customerEmail) return;

  const orderItems: EmailOrderItem[] = order.items.map((item) => ({
    name: item.name,
    type: item.type,
    quantity: item.quantity,
    price: item.price,
    currency: item.currency,
    slug: item.slug,
    selectedDate: item.selectedDate ? { date: item.selectedDate.date } : undefined,
  }));
  const resolvedProviderOrder = providerOrderId ?? order.flowOrder;

  if (order.isGift && order.recipientEmail && order.giftToken) {
    try {
      await sendGiftEmail({
        giftToken: order.giftToken,
        recipientName: order.recipientName,
        recipientEmail: order.recipientEmail,
        senderName: order.customerName,
        senderEmail: order.customerEmail,
        giftMessage: order.giftMessage,
        items: orderItems,
        orderId: order.orderId,
        requiresShipping: order.requiresShipping ?? false,
        shippingAddress: order.shippingAddress,
      });
    } catch (giftEmailError) {
      console.error('Error enviando email de regalo:', giftEmailError);
    }
  }

  const emailData: EmailOrderData = {
    orderId: order.orderId,
    flowOrder: resolvedProviderOrder ? String(resolvedProviderOrder) : undefined,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    items: orderItems,
    total: order.total,
    currency: order.currency,
    paymentDate: paymentDate ?? order.paymentDate ?? new Date().toISOString(),
    hasAccount: !!order.userId?._ref,
    isGift: order.isGift ?? false,
    recipientName: order.recipientName,
    recipientEmail: order.recipientEmail,
    giftMessage: order.giftMessage,
    requiresShipping: order.requiresShipping ?? false,
    shippingAddress: order.shippingAddress,
  };

  try {
    await sendOrderConfirmationEmail(emailData);
  } catch (emailError) {
    console.error('Error enviando emails:', emailError);
    return;
  }

  try {
    await markOrderEmailSent(order.orderId);
  } catch (error) {
    console.error('Error marcando email como enviado:', error);
  }
}

/**
 * Procesar un pago exitoso (status=2) de forma idempotente.
 * Compartido entre webhooks de Flow, PayPal, y cualquier gateway futuro.
 *
 * 1. Reclamar la orden atómicamente (claimPayment). Sólo el ganador crea accesos
 *    y descuenta inventario, así entregas concurrentes o reintentos no duplican nada.
 * 2. Enviar emails si aún no se marcaron (`emailSent`): un reintento tras un fallo
 *    de email reenvía el email sin volver a tocar el stock.
 */
export async function processSuccessfulPayment(params: {
  orderId: string;
  paymentDate?: string;
  providerOrderId?: string;
}): Promise<{ success: boolean; alreadyProcessed: boolean }> {
  const { orderId, paymentDate, providerOrderId } = params;

  const { order, claimed } = await claimPayment(orderId, paymentDate, providerOrderId);
  if (order.emailSent) {
    return { success: true, alreadyProcessed: true };
  }

  if (claimed) {
    await grantCourseAccess(order as SanityOrder & { _id: string });
    await decreaseInventory(order);
    // Una sola vez por pedido (aquí solo llega el ganador del claim). No lanza nunca.
    await sendMetaPurchase(order);
  }

  // ponytail: dos entregas concurrentes pueden enviar el email de confirmación dos
  // veces (el perdedor no sabe si el ganador ya lo envió). Duplicar un email es
  // preferible a no enviarlo nunca si el proceso muere entre reclamar y enviar.
  await sendPaymentEmails(order, paymentDate, providerOrderId);

  return { success: true, alreadyProcessed: !claimed };
}
/**
 * Crear acceso a curso cuando se compra.
 * Es idempotente: si ya existe el acceso, no crea duplicado y retorna false.
 * El acceso y el incremento atómico de enrollmentCount van en una sola transacción.
 */
export async function createCourseAccess(
  userId: string,
  courseId: string,
  orderSanityId: string // _id de la orden en Sanity, no orderId
): Promise<boolean> {
  const existingAccess = await client.fetch(
    `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`,
    { userId, courseId }
  );

  if (existingAccess) {
    console.log(`Acceso a curso ${courseId} ya existe para usuario ${userId}, saltando creación`);
    return false;
  }

  const now = new Date().toISOString();

  await writeClient
    .transaction()
    .create({
      _type: 'courseAccess',
      user: { _type: 'reference', _ref: userId },
      course: { _type: 'reference', _ref: courseId },
      order: { _type: 'reference', _ref: orderSanityId },
      accessGrantedAt: now,
      progress: { completedLessons: [], totalWatchTime: 0 },
    })
    .patch(courseId, (p) =>
      p.setIfMissing({ enrollmentCount: 0 }).inc({ enrollmentCount: 1 }).set({ updatedAt: now })
    )
    .commit();
  console.log(`✅ Acceso a curso ${courseId} creado para usuario ${userId}`);
  return true;
}

