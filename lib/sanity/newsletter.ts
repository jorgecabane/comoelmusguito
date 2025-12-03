/**
 * Funciones para gestionar suscriptores del newsletter
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';

export interface NewsletterSubscriber {
  _id?: string;
  _type: 'newsletterSubscriber';
  email: string;
  name?: string;
  source: 'footer-home' | 'footer-general' | 'contact-page' | 'other';
  subscribedAt: string;
  active: boolean;
  unsubscribedAt?: string;
  tags?: string[];
}

/**
 * Verificar si un email ya está suscrito
 */
export async function isEmailSubscribed(email: string): Promise<boolean> {
  try {
    const query = `*[_type == "newsletterSubscriber" && email == $email && active == true][0]`;
    const subscriber = await client.fetch(query, { email: email.toLowerCase() });
    return !!subscriber;
  } catch (error) {
    console.error('Error verificando suscripción:', error);
    return false;
  }
}

/**
 * Obtener suscriptor por email
 */
export async function getSubscriberByEmail(email: string): Promise<NewsletterSubscriber | null> {
  try {
    const query = `*[_type == "newsletterSubscriber" && email == $email][0]`;
    const subscriber = await client.fetch<NewsletterSubscriber | null>(query, {
      email: email.toLowerCase(),
    });
    return subscriber;
  } catch (error) {
    console.error('Error obteniendo suscriptor:', error);
    return null;
  }
}

/**
 * Suscribir email al newsletter
 * Es idempotente: si ya existe, actualiza la suscripción
 */
export async function subscribeToNewsletter(data: {
  email: string;
  name?: string;
  source?: 'footer-home' | 'footer-general' | 'contact-page' | 'other';
}): Promise<{ success: boolean; alreadySubscribed: boolean; subscriberId?: string }> {
  try {
    const email = data.email.toLowerCase();
    const existing = await getSubscriberByEmail(email);

    if (existing) {
      // Si ya existe pero está inactivo, reactivarlo
      if (!existing.active) {
        await writeClient
          .patch(existing._id!)
          .set({
            active: true,
            subscribedAt: new Date().toISOString(),
            unsubscribedAt: undefined,
            name: data.name || existing.name,
            source: data.source || existing.source,
            updatedAt: new Date().toISOString(),
          })
          .commit();

        return {
          success: true,
          alreadySubscribed: false, // Se reactivó
          subscriberId: existing._id,
        };
      }

      // Si ya está activo, solo actualizar nombre si se proporciona
      if (data.name && data.name !== existing.name) {
        await writeClient
          .patch(existing._id!)
          .set({
            name: data.name,
            updatedAt: new Date().toISOString(),
          })
          .commit();
      }

      return {
        success: true,
        alreadySubscribed: true,
        subscriberId: existing._id,
      };
    }

    // Crear nuevo suscriptor
    const now = new Date().toISOString();
    const subscriber: Omit<NewsletterSubscriber, '_id'> = {
      _type: 'newsletterSubscriber',
      email,
      name: data.name,
      source: data.source || 'footer-home',
      subscribedAt: now,
      active: true,
    };

    const result = await writeClient.create(subscriber);

    return {
      success: true,
      alreadySubscribed: false,
      subscriberId: result._id,
    };
  } catch (error) {
    console.error('Error suscribiendo al newsletter:', error);
    throw error;
  }
}

/**
 * Desuscribir email del newsletter
 */
export async function unsubscribeFromNewsletter(email: string): Promise<boolean> {
  try {
    const subscriber = await getSubscriberByEmail(email.toLowerCase());

    if (!subscriber || !subscriber.active) {
      return false;
    }

    await writeClient
      .patch(subscriber._id!)
      .set({
        active: false,
        unsubscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .commit();

    return true;
  } catch (error) {
    console.error('Error desuscribiendo del newsletter:', error);
    throw error;
  }
}

/**
 * Obtener todos los suscriptores activos
 */
export async function getActiveSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const query = `*[_type == "newsletterSubscriber" && active == true] | order(subscribedAt desc)`;
    const subscribers = await client.fetch<NewsletterSubscriber[]>(query);
    return subscribers;
  } catch (error) {
    console.error('Error obteniendo suscriptores:', error);
    return [];
  }
}

/**
 * Obtener estadísticas del newsletter
 */
export async function getNewsletterStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  recentSubscriptions: number; // Últimos 30 días
}> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const query = `{
      "total": count(*[_type == "newsletterSubscriber"]),
      "active": count(*[_type == "newsletterSubscriber" && active == true]),
      "inactive": count(*[_type == "newsletterSubscriber" && active == false]),
      "recentSubscriptions": count(*[_type == "newsletterSubscriber" && subscribedAt >= $date])
    }`;

    const stats = await client.fetch(query, {
      date: thirtyDaysAgo.toISOString(),
    });

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      recentSubscriptions: 0,
    };
  }
}

