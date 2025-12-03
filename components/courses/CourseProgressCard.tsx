/**
 * Card de Curso con Progreso Circular
 * Similar a LeetCode, muestra curso con círculo de progreso
 */

'use client';

import { Card } from '@/components/ui';
import { getImageUrl } from '@/lib/sanity/utils';
import { Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface CourseProgressCardProps {
  courseId: string;
  courseSlug: string;
  courseName: string;
  courseThumbnail?: any;
  progress: {
    percentage: number;
    completedLessons: string[];
    lastWatched?: string;
  };
  className?: string;
}

/**
 * Componente de círculo de progreso SVG
 */
function ProgressCircle({ percentage }: { percentage: number }) {
  const size = 60;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ width: size, height: size }}
      >
        {/* Círculo de fondo (gris) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray/20"
        />
        {/* Círculo de progreso (verde) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-vida transition-all duration-500"
        />
      </svg>
      {/* Botón de play centrado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white shadow-natural-md flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="text-musgo ml-0.5" size={20} fill="currentColor" />
        </div>
      </div>
      {/* Porcentaje abajo del círculo */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-semibold text-forest">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function CourseProgressCard({
  courseId,
  courseSlug,
  courseName,
  courseThumbnail,
  progress,
  className,
}: CourseProgressCardProps) {
  const imageUrl = courseThumbnail
    ? getImageUrl(courseThumbnail, { width: 400, height: 300 })
    : '/images/placeholder.jpg';

  // Determinar a qué lección redirigir
  let lessonHref = `/cursos/${courseSlug}/leccion`;
  if (progress.lastWatched) {
    // Si hay última lección vista, ir ahí
    const parts = progress.lastWatched.split('-');
    if (parts.length === 2) {
      lessonHref = `/cursos/${courseSlug}/leccion/${parts[0]}/${parts[1]}`;
    }
  } else {
    // Si no, ir a la primera lección
    lessonHref = `/cursos/${courseSlug}/leccion/0/0`;
  }

  return (
    <Link href={lessonHref}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group"
      >
        <Card
          hover
          padding="none"
          className={className}
        >
          {/* Imagen del curso con overlay */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
            <Image
              src={imageUrl}
              alt={courseName}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Overlay con gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/40 to-transparent" />
            
            {/* Título sobre la imagen */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2">
                {courseName}
              </h3>
            </div>
          </div>

          {/* Contenido con progreso */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              {/* Círculo de progreso */}
              <div className="flex-shrink-0">
                <ProgressCircle percentage={progress.percentage} />
              </div>

              {/* Info del curso */}
              <div className="flex-1 ml-6 min-w-0">
                <div className="text-sm text-gray mb-1">
                  {progress.completedLessons.length} lecciones completadas
                </div>
                {progress.lastWatched && (
                  <div className="text-xs text-gray/60">
                    Última vista: {progress.lastWatched}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}

