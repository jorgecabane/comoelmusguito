/**
 * Dashboard de Usuario
 * Muestra pedidos, cursos y talleres del usuario
 */

import { getSession } from '@/lib/auth/get-session';
import { redirect } from 'next/navigation';
import { getOrdersByUserId } from '@/lib/sanity/orders';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getUserCoursesWithProgress } from '@/lib/sanity/course-access';
import { Suspense } from 'react';
import { TabsController } from './TabsController';

export const dynamic = 'force-dynamic';

export default async function MiCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const defaultTab = params.tab || 'pedidos';

  if (!session?.user?.email) {
    redirect('/auth/login?callbackUrl=/mi-cuenta');
  }

  // Obtener usuario y sus órdenes
  const user = await getUserByEmail(session.user.email);
  if (!user) {
    redirect('/auth/login?callbackUrl=/mi-cuenta');
  }

  const orders = await getOrdersByUserId(user._id);

  // Separar órdenes por tipo
  const ordersWithCourses = orders.filter((order) =>
    order.items.some((item) => item.type === 'course')
  );
  const ordersWithWorkshops = orders.filter((order) =>
    order.items.some((item) => item.type === 'workshop')
  );

  // Obtener cursos con progreso
  const userCourses = await getUserCoursesWithProgress(user._id);

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white">
      <div className="container max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
            Hola, {user.name || session.user.email?.split('@')[0]} 👋
          </h1>
          <p className="text-gray text-lg">
            Aquí puedes ver tus pedidos, cursos y talleres
          </p>
        </div>

        {/* Tabs */}
        <Suspense
          fallback={
            <div className="w-full h-64 bg-cream rounded-xl animate-pulse" />
          }
        >
          <TabsController
            defaultTab={defaultTab}
            orders={orders}
            ordersWithCourses={ordersWithCourses}
            ordersWithWorkshops={ordersWithWorkshops}
            userCourses={userCourses}
          />
        </Suspense>
      </div>
    </div>
  );
}

