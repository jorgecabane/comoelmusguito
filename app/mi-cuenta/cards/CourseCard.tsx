/**
 * Card de Curso para el feed de Mi Cuenta
 * Estilo grande similar a las cards del home
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Play, Clock, BookOpen, ArrowRight, Gift } from 'lucide-react';
import { Card } from '@/components/ui';
import { getImageUrl } from '@/lib/sanity/utils';
import { formatDateShort } from '@/lib/sanity/utils';

interface CourseCardProps {
  course: {
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
    isGift?: boolean;
    giftSenderName?: string;
    giftSenderEmail?: string;
  };
}

export function CourseCard({ course }: CourseCardProps) {
  const imageUrl = course.courseThumbnail
    ? getImageUrl(course.courseThumbnail, { width: 800, height: 450 })
    : '/images/placeholder-course.jpg';

  const formatWatchTime = (minutes?: number | null) => {
    if (minutes === undefined || minutes === null || minutes === 0) return '0 min';
    const numMinutes = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
    if (isNaN(numMinutes) || numMinutes <= 0) return '0 min';
    if (numMinutes < 60) return `${Math.round(numMinutes)} min`;
    const hours = Math.floor(numMinutes / 60);
    const mins = Math.round(numMinutes % 60);
    return `${hours}h ${mins}min`;
  };

  // Determinar URL de lección: usar última vista o primera lección
  const getLessonUrl = () => {
    if (course.progress.lastWatched) {
      // Parsear formato "moduleIndex-lessonIndex"
      const parts = course.progress.lastWatched.split('-');
      if (parts.length === 2) {
        const moduleIndex = parseInt(parts[0], 10);
        const lessonIndex = parseInt(parts[1], 10);
        if (!isNaN(moduleIndex) && !isNaN(lessonIndex)) {
          return `/cursos/${course.courseSlug}/leccion/${moduleIndex}/${lessonIndex}`;
        }
      }
    }
    // Si no hay última vista, ir a la primera lección
    return `/cursos/${course.courseSlug}/leccion/0/0`;
  };

  return (
    <Link href={getLessonUrl()}>
      <Card hover padding="none" className="group h-full flex flex-col overflow-hidden">
        {/* Imagen */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={course.courseName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-forest/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="text-musgo ml-1" size={28} fill="currentColor" />
            </div>
          </div>

          {/* Badge de progreso */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-semibold text-forest">
            {course.progress.percentage}% completado
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 flex flex-col flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-display text-xl font-bold text-forest group-hover:text-musgo transition-colors">
                {course.courseName}
              </h3>
              {course.isGift && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 text-xs font-medium flex-shrink-0">
                  <Gift size={12} />
                  Regalo
                </span>
              )}
            </div>
            <p className="text-sm text-gray">
              {course.isGift && course.giftSenderName ? (
                <>
                  Regalo de <strong>{course.giftSenderName}</strong> • {formatDateShort(course.accessGrantedAt)}
                </>
              ) : (
                <>Acceso desde {formatDateShort(course.accessGrantedAt)}</>
              )}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray">
              <BookOpen size={16} />
              <span>{course.progress.completedLessons.length} lecciones completadas</span>
            </div>
            {(() => {
              const watchTime = course.progress.totalWatchTime;
              const hasWatchTime = watchTime != null && 
                (typeof watchTime === 'number' ? watchTime > 0 : parseFloat(String(watchTime)) > 0);
              
              if (!hasWatchTime) return null;
              
              return (
                <div className="flex items-center gap-2 text-gray">
                  <Clock size={16} />
                  <span>{formatWatchTime(watchTime)} vistos</span>
                </div>
              );
            })()}
          </div>

          {/* Barra de progreso */}
          <div className="pt-2">
            <div className="h-2 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-musgo to-vida transition-all duration-500"
                style={{ width: `${course.progress.percentage}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2 flex items-center gap-2 text-musgo font-medium group-hover:gap-3 transition-all">
            <span>Continuar aprendiendo</span>
            <ArrowRight size={18} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
