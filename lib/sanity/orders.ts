/**
 * Funciones para gestionar órdenes en Sanity
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';
import type { CartItem } from '@/types/cart';

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
    type: 'terrarium' | 'course' | 'workshop';
    name: string;
    slug: string;
    price: number;
    currency: 'CLP' | 'USD';
    quantity: number;
    selectedDate?: {
      date: string;
      time?: string;
    };
    // Snapshot del producto al momento de compra (por si se elimina después)
    snapshot?: {
      image?: string; // URL de la imagen principal
      description?: string; // Descripción corta
      longDescription?: any[]; // Descripción completa (rich text)
      // Información adicional según tipo
      size?: string; // Para terrarios
      category?: string; // Para terrarios
      duration?: number; // Para cursos (horas)
      level?: string; // Para cursos
      location?: string; // Para talleres
    };
  }>;
  total: number;
  currency: 'CLP' | 'USD';
  paymentStatus: number;
  paymentDate?: string;
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
      : null,
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
            date: item.selectedDate.date,
            time: new Date(item.selectedDate.date).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }
        : undefined,
      // Guardar snapshot del producto (se pasa desde el checkout)
      snapshot: (item as any).snapshot,
    })),
    total: data.total,
    currency: data.currency,
    paymentStatus: 1, // Pendiente
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
}

