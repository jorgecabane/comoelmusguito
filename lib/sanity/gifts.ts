/**
 * Funciones para gestionar regalos
 */

import 'server-only';
import { client } from '@/sanity/lib/client';
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
 */
export async function getGiftsReceivedByEmail(email: string): Promise<SanityOrder[]> {
  const emailLower = email.toLowerCase();
  const query = `*[_type == "order" && recipientEmail == $email && isGift == true && paymentStatus == 2] | order(createdAt desc)`;
  const orders = await client.fetch<SanityOrder[]>(query, { email: emailLower });
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
