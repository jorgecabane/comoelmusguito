/**
 * Client Component para controlar los Tabs desde el servidor
 * Sincroniza el valor del tab con el query param
 */

'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Package, BookOpen, Calendar } from 'lucide-react';
import { Card, Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDateShort, formatCurrency } from '@/lib/sanity/utils';
import { OrderItemDetail } from '@/components/orders/OrderItemDetail';
import { CourseProgressCard } from '@/components/courses/CourseProgressCard';
import type { SanityOrder } from '@/lib/sanity/orders';

interface TabsControllerProps {
  defaultTab: string;
  orders: SanityOrder[];
  ordersWithCourses: SanityOrder[];
  ordersWithWorkshops: SanityOrder[];
  userCourses: Array<{
    courseId: string;
    courseSlug: string;
    courseName: string;
    courseThumbnail?: any;
    accessGrantedAt: string;
    progress: {
      percentage: number;
      completedLessons: string[];
      lastWatched?: string;
      totalWatchTime?: number;
    };
    course: any;
  }>;
}

export function TabsController({
  defaultTab,
  orders,
  ordersWithCourses,
  ordersWithWorkshops,
  userCourses,
}: TabsControllerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get('tab') || defaultTab;

  // Sincronizar URL cuando cambia el tab
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`/mi-cuenta?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={tabFromUrl} onValueChange={handleTabChange} defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="pedidos" className="flex items-center gap-2">
          <Package size={18} />
          Mis Pedidos
        </TabsTrigger>
        <TabsTrigger value="cursos" className="flex items-center gap-2">
          <BookOpen size={18} />
          Mis Cursos
        </TabsTrigger>
        <TabsTrigger value="talleres" className="flex items-center gap-2">
          <Calendar size={18} />
          Mis Talleres
        </TabsTrigger>
      </TabsList>

      {/* Tab: Pedidos */}
      <TabsContent value="pedidos" className="space-y-6">
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="mx-auto mb-4 text-gray/40" size={48} />
            <h3 className="font-display text-xl font-semibold text-forest mb-2">
              Aún no tienes pedidos
            </h3>
            <p className="text-gray mb-6">
              Cuando hagas tu primera compra, aparecerá aquí
            </p>
            <Link href="/terrarios">
              <Button variant="primary">
                Explorar Terrarios
                <ArrowRight size={18} />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-forest mb-1">
                      Orden {order.orderId}
                    </h3>
                    <p className="text-sm text-gray">
                      {formatDateShort(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-bold text-forest mb-1">
                      {formatCurrency(order.total, order.currency)}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.paymentStatus === 2
                          ? 'bg-vida/20 text-vida'
                          : order.paymentStatus === 1
                          ? 'bg-musgo/20 text-musgo'
                          : 'bg-error/20 text-error'
                      }`}
                    >
                      {order.paymentStatus === 2
                        ? '✅ Confirmado'
                        : order.paymentStatus === 1
                        ? '⏳ Pendiente'
                        : '❌ Rechazado'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t border-gray/20">
                  {order.items.map((item, idx) => (
                    <OrderItemDetail
                      key={idx}
                      item={item}
                      orderId={order.orderId}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab: Cursos */}
      <TabsContent value="cursos" className="space-y-6">
        {userCourses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="mx-auto mb-4 text-gray/40" size={48} />
            <h3 className="font-display text-xl font-semibold text-forest mb-2">
              Aún no tienes cursos
            </h3>
            <p className="text-gray mb-6">
              Explora nuestros cursos online y aprende a crear vida
            </p>
            <Link href="/cursos">
              <Button variant="primary">
                Ver Cursos
                <ArrowRight size={18} />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userCourses.map((courseData) => (
              <CourseProgressCard
                key={courseData.courseId}
                courseId={courseData.courseId}
                courseSlug={courseData.courseSlug}
                courseName={courseData.courseName}
                courseThumbnail={courseData.courseThumbnail}
                progress={courseData.progress}
              />
            ))}
          </div>
        )}
      </TabsContent>

      {/* Tab: Talleres */}
      <TabsContent value="talleres" className="space-y-6">
        {ordersWithWorkshops.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray/40" size={48} />
            <h3 className="font-display text-xl font-semibold text-forest mb-2">
              Aún no tienes talleres reservados
            </h3>
            <p className="text-gray mb-6">
              Únete a nuestros talleres presenciales y aprende en persona
            </p>
            <Link href="/talleres">
              <Button variant="primary">
                Ver Talleres
                <ArrowRight size={18} />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {ordersWithWorkshops.flatMap((order) =>
              order.items
                .filter((item) => item.type === 'workshop')
                .map((item) => (
                  <Card key={`${order._id}-${item.id}`} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-semibold text-forest mb-2">
                          {item.name}
                        </h3>
                        {item.selectedDate && (
                          <div className="space-y-1 text-sm text-gray">
                            <p>
                              📅{' '}
                              {new Date(item.selectedDate.date).toLocaleDateString(
                                'es-CL',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )}
                            </p>
                            {item.selectedDate.time && (
                              <p>🕐 {item.selectedDate.time}</p>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray mt-2">
                          Reservado el {formatDateShort(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray/20">
                      <p className="text-sm text-gray mb-2">
                        <strong>Ubicación:</strong> Santa Isabel 676, Providencia,
                        Santiago
                      </p>
                    </div>
                  </Card>
                ))
            )}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

