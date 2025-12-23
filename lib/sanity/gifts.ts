/**
 * Funciones para gestionar regalos
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';
import type { SanityOrder } from './orders';

/**
 * Obtener regalos enviados por un usuario
 */
export async function getGiftsSentByUser(userId: string): Promise<SanityOrder[]> {
  const query = `*[_type == "order" && userId._ref == $userId && isGift == true && paymentStatus == 2] | order(createdAt desc)`;
  const orders = await client.fetch<SanityOrder[]>(query, { userId });
  return orders;
}

/**
 * Obtener regalos recibidos por un usuario (por email)
 * @deprecated Usar getGiftsRedeemedByUser en su lugar para mejor rendimiento
 */
export async function getGiftsReceivedByEmail(email: string): Promise<SanityOrder[]> {
  const emailLower = email.toLowerCase();
  const query = `*[_type == "order" && recipientEmail == $email && isGift == true && paymentStatus == 2] | order(createdAt desc)`;
  const orders = await client.fetch<SanityOrder[]>(query, { email: emailLower });
  return orders;
}

/**
 * Obtener regalos canjeados por un usuario (por userId)
 * Más eficiente que buscar por email, ya que usa la referencia directa
 */
export async function getGiftsRedeemedByUser(userId: string): Promise<SanityOrder[]> {
  const query = `*[_type == "order" && giftRedeemedBy._ref == $userId && isGift == true && paymentStatus == 2] | order(createdAt desc)`;
  const orders = await client.fetch<SanityOrder[]>(query, { userId });
  return orders;
}

/**
 * Verificar si un curso fue recibido como regalo
 */
export async function isCourseReceivedAsGift(
  userId: string,
  courseId: string
): Promise<{ isGift: boolean; senderName?: string; senderEmail?: string }> {
  // Buscar courseAccess del usuario para este curso
  const access = await client.fetch(
    `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0] {
      order-> {
        isGift,
        customerName,
        customerEmail
      }
    }`,
    { userId, courseId }
  );

  if (access?.order?.isGift) {
    return {
      isGift: true,
      senderName: access.order.customerName,
      senderEmail: access.order.customerEmail,
    };
  }

  return { isGift: false };
}

/**
 * Obtener orden por token de regalo
 * Nota: TypeScript tiene problemas de inferencia con queries que usan parámetros con nombres específicos
 * como "token". Usamos el mismo patrón que otras funciones pero con type assertion cuando es necesario.
 */
export async function getOrderByGiftToken(giftToken: string): Promise<{
  _id: string;
  orderId: string;
  items: Array<{ id: string; type: string; name: string; quantity: number }>;
  recipientEmail?: string;
  recipientName?: string;
  giftRedeemedAt?: string;
  giftRedeemedBy?: {
    _type: 'reference';
    _ref: string;
  } | null;
  userId?: {
    _type: 'reference';
    _ref: string;
  } | null;
} | null> {
  // Usar nombre de parámetro diferente para evitar conflictos de inferencia de tipos
  const query = `*[_type == "order" && giftToken == $giftToken && paymentStatus == 2][0] {
    _id,
    orderId,
    items,
    recipientEmail,
    recipientName,
    giftRedeemedAt,
    giftRedeemedBy,
    userId
  }`;
  const order = await client.fetch<{
    _id: string;
    orderId: string;
    items: Array<{ id: string; type: string; name: string; quantity: number }>;
    recipientEmail?: string;
    recipientName?: string;
    giftRedeemedAt?: string;
    giftRedeemedBy?: {
      _type: 'reference';
      _ref: string;
    } | null;
    userId?: {
      _type: 'reference';
      _ref: string;
    } | null;
  } | null>(query, { giftToken });
  return order;
}

/**
 * Marcar regalo como canjeado
 */
export async function markGiftAsRedeemed(
  orderId: string,
  userId: string
): Promise<void> {
  const query = `*[_type == "order" && orderId == $orderId][0]._id`;
  const orderSanityId = await client.fetch<string>(query, { orderId });

  if (!orderSanityId) {
    throw new Error(`Orden ${orderId} no encontrada`);
  }

  await writeClient
    .patch(orderSanityId)
    .set({
      giftRedeemedAt: new Date().toISOString(),
      giftRedeemedBy: {
        _type: 'reference',
        _ref: userId,
      },
      updatedAt: new Date().toISOString(),
    })
    .commit();
}
