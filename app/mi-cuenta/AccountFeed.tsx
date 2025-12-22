/**
 * Feed principal de Mi Cuenta
 * Vista estilo timeline con filtros y cards grandes
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, Package, BookOpen, Calendar, Sprout, Filter, Gift } from 'lucide-react';
import { Button } from '@/components/ui';
import { OrderHistoryModal } from './OrderHistoryModal';
import { RedeemGiftModal } from './RedeemGiftModal';
import { CourseCard } from './cards/CourseCard';
import { TerrariumCard } from './cards/TerrariumCard';
import { WorkshopCard } from './cards/WorkshopCard';
import type { SanityOrder } from '@/lib/sanity/orders';

type FilterType = 'all' | 'courses' | 'workshops' | 'terrariums';

interface AccountFeedProps {
  userName: string;
  userEmail: string | null;
  confirmedOrders: SanityOrder[];
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
    isGift?: boolean;
    giftSenderName?: string;
    giftSenderEmail?: string;
  }>;
  terrariumsWithDetails: Array<{
    id: string;
    name: string;
    slug: string;
    quantity: number;
    orderId: string;
    orderDate: string;
    terrarium: any;
  }>;
  workshopItems: Array<{
    id: string;
    name: string;
    slug: string;
    selectedDate?: {
      date: string;
      time?: string;
    };
    orderId: string;
    orderDate: string;
    paymentDate?: string;
  }>;
  giftsSent: SanityOrder[];
  giftsReceived: SanityOrder[];
}

export function AccountFeed({
  userName,
  userEmail,
  confirmedOrders,
  userCourses,
  terrariumsWithDetails,
  workshopItems,
  giftsSent,
  giftsReceived,
}: AccountFeedProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRedeemGiftOpen, setIsRedeemGiftOpen] = useState(false);

  // Preseleccionar filtro desde query params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    // También soportar el antiguo ?tab= para compatibilidad
    const tabParam = searchParams.get('tab');
    
    if (filterParam || tabParam) {
      const filterValue = filterParam || tabParam;
      // Mapear valores antiguos a nuevos
      const filterMap: Record<string, FilterType> = {
        'cursos': 'courses',
        'courses': 'courses',
        'talleres': 'workshops',
        'workshops': 'workshops',
        'terrarios': 'terrariums',
        'terrariums': 'terrariums',
        'all': 'all',
      };
      
      const mappedFilter = filterMap[filterValue || ''] as FilterType;
      if (mappedFilter) {
        setActiveFilter(mappedFilter);
      }
    }
  }, [searchParams]);

  // Combinar todos los items en un timeline ordenado por fecha
  const timelineItems = useMemo(() => {
    const items: Array<{
      type: 'course' | 'workshop' | 'terrarium';
      date: string;
      data: any;
    }> = [];

    // Agregar cursos
    userCourses.forEach((course) => {
      items.push({
        type: 'course',
        date: course.accessGrantedAt,
        data: course,
      });
    });

    // Agregar terrarios
    terrariumsWithDetails.forEach((item) => {
      items.push({
        type: 'terrarium',
        date: item.orderDate,
        data: item,
      });
    });

    // Agregar talleres
    workshopItems.forEach((item) => {
      items.push({
        type: 'workshop',
        date: item.orderDate,
        data: item,
      });
    });

    // Ordenar por fecha (más recientes primero)
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userCourses, terrariumsWithDetails, workshopItems]);

  // Filtrar items según el filtro activo
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return timelineItems;
    return timelineItems.filter((item) => {
      if (activeFilter === 'courses') return item.type === 'course';
      if (activeFilter === 'workshops') return item.type === 'workshop';
      if (activeFilter === 'terrariums') return item.type === 'terrarium';
      return true;
    });
  }, [timelineItems, activeFilter]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const filters: Array<{ value: FilterType; label: string; icon: any; count: number }> = [
    { value: 'all', label: 'Todos', icon: Filter, count: timelineItems.length },
    { value: 'courses', label: 'Cursos', icon: BookOpen, count: userCourses.length },
    { value: 'workshops', label: 'Talleres', icon: Calendar, count: workshopItems.length },
    { value: 'terrariums', label: 'Terrarios', icon: Sprout, count: terrariumsWithDetails.length },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-2">
              Hola, {userName} 👋
            </h1>
            <p className="text-gray text-lg">
              Tu espacio personal para gestionar tus compras y aprendizajes
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsRedeemGiftOpen(true)}
              icon={<Gift size={18} />}
              className="flex-1 md:flex-none"
            >
              <span className="hidden sm:inline">Canjear Regalo</span>
              <span className="sm:hidden">Regalo</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsHistoryOpen(true)}
              icon={<Package size={18} />}
              className="flex-1 md:flex-none"
            >
              <span className="hidden sm:inline">Ver Historial</span>
              <span className="sm:hidden">Historial</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleSignOut}
              icon={<LogOut size={18} />}
              className="flex-1 md:flex-none"
            >
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-8 flex flex-wrap gap-3">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => {
                setActiveFilter(filter.value);
                // Actualizar URL sin recargar la página
                const newUrl = filter.value === 'all' 
                  ? '/mi-cuenta' 
                  : `/mi-cuenta?filter=${filter.value}`;
                router.replace(newUrl, { scroll: false });
              }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${
                  isActive
                    ? 'bg-musgo text-white shadow-md'
                    : 'bg-white text-forest border border-gray/20 hover:border-musgo/40 hover:bg-cream'
                }
              `}
            >
              <Icon size={16} />
              <span>{filter.label}</span>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${isActive ? 'bg-white/20 text-white' : 'bg-cream text-gray'}
                `}
              >
                {filter.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feed/Timeline */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray/20">
          <Package className="mx-auto mb-4 text-gray/40" size={48} />
          <h3 className="font-display text-xl font-semibold text-forest mb-2">
            No hay items para mostrar
          </h3>
          <p className="text-gray mb-6">
            {activeFilter === 'all'
              ? 'Cuando hagas tu primera compra, aparecerá aquí'
              : `No tienes ${filters.find((f) => f.value === activeFilter)?.label.toLowerCase()} aún`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {filteredItems.map((item, index) => {
            if (item.type === 'course') {
              return (
                <CourseCard
                  key={`course-${item.data.courseId}-${index}`}
                  course={item.data}
                />
              );
            }
            if (item.type === 'terrarium') {
              return (
                <TerrariumCard
                  key={`terrarium-${item.data.id}-${index}`}
                  item={item.data}
                />
              );
            }
            if (item.type === 'workshop') {
              return (
                <WorkshopCard
                  key={`workshop-${item.data.id}-${index}`}
                  item={item.data}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Modal de Historial */}
      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={confirmedOrders}
        giftsSent={giftsSent}
      />

      {/* Modal de Canjear Regalo */}
      <RedeemGiftModal
        isOpen={isRedeemGiftOpen}
        onClose={() => setIsRedeemGiftOpen(false)}
        onSuccess={() => {
          // Recargar la página para mostrar los nuevos accesos
          window.location.reload();
        }}
      />
    </>
  );
}
