/**
 * Dashboard de Usuario
 * Vista moderna estilo feed/timeline con filtros
 */

import { getSession } from '@/lib/auth/get-session';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getOrdersByUserId } from '@/lib/sanity/orders';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getUserCoursesWithProgress } from '@/lib/sanity/course-access';
import { getTerrariumById, getSupplyById } from '@/lib/sanity/fetch';
import { getGiftsSentByUser, getGiftsRedeemedByUser } from '@/lib/sanity/gifts';
import { AccountFeed } from './AccountFeed';
import type { SanityOrder } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export default async function MiCuentaPage() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/mi-cuenta');
  }

  // Obtener usuario y sus órdenes
  const user = await getUserByEmail(session.user.email);
  if (!user) {
    redirect('/auth/login?callbackUrl=/mi-cuenta');
  }

  const allOrders = await getOrdersByUserId(user._id);
  
  // Filtrar solo órdenes confirmadas (paymentStatus === 2)
  // Excluir regalos enviados del historial normal (se mostrarán separados)
  const confirmedOrders = allOrders.filter(
    (order) => order.paymentStatus === 2 && !order.isGift
  );

  // Obtener regalos enviados
  const giftsSent = await getGiftsSentByUser(user._id);

  // Obtener regalos canjeados por este usuario (usa giftRedeemedBy para evitar duplicados)
  const giftsRedeemed = await getGiftsRedeemedByUser(user._id);

  // Obtener cursos con progreso
  const userCourses = await getUserCoursesWithProgress(user._id);

  // Extraer terrarios de órdenes confirmadas
  const terrariumItemsFromOrders = confirmedOrders
    .flatMap((order) => 
      order.items
        .filter((item) => item.type === 'terrarium')
        .map((item) => ({ 
          ...item, 
          orderId: order.orderId, 
          orderDate: order.createdAt,
          isGift: false,
        }))
    );

  // Extraer terrarios de regalos canjeados por este usuario
  const terrariumItemsFromGifts = giftsRedeemed
    .flatMap((gift) =>
      gift.items
        .filter((item) => item.type === 'terrarium')
        .map((item) => ({
          ...item,
          orderId: gift.orderId,
          orderDate: gift.createdAt,
          isGift: true,
          giftSenderName: gift.customerName,
          giftSenderEmail: gift.customerEmail,
        }))
    );

  // Combinar terrarios de órdenes y regalos
  const terrariumItems = [...terrariumItemsFromOrders, ...terrariumItemsFromGifts];

  // Obtener datos completos de terrarios
  const terrariumsWithDetails = await Promise.all(
    terrariumItems.map(async (item) => {
      const terrarium = await getTerrariumById(item.id);
      return {
        ...item,
        terrarium,
      };
    })
  );

  // Extraer talleres de órdenes confirmadas
  const workshopItemsFromOrders = confirmedOrders
    .flatMap((order) =>
      order.items
        .filter((item) => item.type === 'workshop')
        .map((item) => ({ 
          ...item, 
          orderId: order.orderId, 
          orderDate: order.createdAt,
          paymentDate: order.paymentDate,
          isGift: false,
        }))
    );

  // Extraer talleres de regalos canjeados por este usuario
  const workshopItemsFromGifts = giftsRedeemed
    .flatMap((gift) =>
      gift.items
        .filter((item) => item.type === 'workshop')
        .map((item) => ({
          ...item,
          orderId: gift.orderId,
          orderDate: gift.createdAt,
          paymentDate: gift.paymentDate,
          isGift: true,
          giftSenderName: gift.customerName,
          giftSenderEmail: gift.customerEmail,
        }))
    );

  // Combinar talleres de órdenes y regalos
  const workshopItems = [...workshopItemsFromOrders, ...workshopItemsFromGifts];

  // Extraer insumos de órdenes confirmadas
  const supplyItemsFromOrders = confirmedOrders
    .flatMap((order) => 
      order.items
        .filter((item) => item.type === 'supply')
        .map((item) => ({ 
          ...item, 
          orderId: order.orderId, 
          orderDate: order.createdAt,
          isGift: false,
        }))
    );

  // Extraer insumos de regalos canjeados por este usuario
  const supplyItemsFromGifts = giftsRedeemed
    .flatMap((gift) =>
      gift.items
        .filter((item) => item.type === 'supply')
        .map((item) => ({
          ...item,
          orderId: gift.orderId,
          orderDate: gift.createdAt,
          isGift: true,
          giftSenderName: gift.customerName,
          giftSenderEmail: gift.customerEmail,
        }))
    );

  // Combinar insumos de órdenes y regalos
  const supplyItems = [...supplyItemsFromOrders, ...supplyItemsFromGifts];

  // Obtener datos completos de insumos
  const suppliesWithDetails = await Promise.all(
    supplyItems.map(async (item) => {
      const supply = await getSupplyById(item.id);
      return {
        ...item,
        supply,
      };
    })
  );

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white">
      <div className="container max-w-7xl">
        <Suspense fallback={<div className="text-center py-12">Cargando...</div>}>
          <AccountFeed
            userName={user.name || session.user.email?.split('@')[0] || 'Usuario'}
            userEmail={session.user.email}
            confirmedOrders={confirmedOrders}
            userCourses={userCourses}
            terrariumsWithDetails={terrariumsWithDetails}
            workshopItems={workshopItems}
            suppliesWithDetails={suppliesWithDetails}
            giftsSent={giftsSent}
          />
        </Suspense>
      </div>
    </div>
  );
}

