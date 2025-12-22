/**
 * Vista de Lección del Curso
 * Componente principal que muestra sidebar y contenido
 */

'use client';

import { useState } from 'react';
import { CourseNavigation } from './CourseNavigation';
import { LessonContent } from './LessonContent';
import { Course } from '@/types/sanity';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CourseLessonViewProps {
  course: Course;
  currentModuleIndex: number;
  currentLessonIndex: number;
  completedLessons: string[];
  courseId: string;
  userId: string;
}

export function CourseLessonView({
  course,
  currentModuleIndex,
  currentLessonIndex,
  completedLessons,
  courseId,
  userId,
}: CourseLessonViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const router = useRouter();

  const currentModule = course.modules?.[currentModuleIndex];
  const currentLesson = currentModule?.lessons?.[currentLessonIndex];

  if (!currentModule || !currentLesson) {
    return null;
  }

  const handleLessonComplete = async () => {
    const lessonId = `${currentModuleIndex}-${currentLessonIndex}`;
    if (completedLessons.includes(lessonId)) return;

    setIsUpdatingProgress(true);
    try {
      const response = await fetch('/api/courses/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          lessonId,
          lastWatched: lessonId,
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        console.error('Error actualizando progreso:', await response.text());
      }
    } catch (error) {
      console.error('Error actualizando progreso:', error);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-white pt-20">
      {/* Header */}
      <div className="top-20 z-40 bg-white/80 backdrop-blur-sm border-b border-gray/20">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/mi-cuenta?filter=courses"
              className="flex items-center gap-2 text-gray hover:text-musgo transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Cursos</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden px-4 py-2 text-gray hover:text-musgo transition-colors"
            >
              {sidebarOpen ? 'Ocultar' : 'Mostrar'} Contenido
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar de Navegación */}
        <aside
          className={`
            fixed md:sticky top-35 left-0 h-[calc(100vh-9rem)] 
            w-80 bg-white border-r border-gray/20 overflow-y-auto
            transition-transform duration-300 z-30
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <CourseNavigation
            course={course}
            currentModuleIndex={currentModuleIndex}
            currentLessonIndex={currentLessonIndex}
            completedLessons={completedLessons}
            courseSlug={course.slug.current}
          />
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 min-w-0">
          {isUpdatingProgress && (
            <div className="fixed top-20 right-4 z-50 bg-musgo text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span>Actualizando progreso...</span>
            </div>
          )}
          <LessonContent
            course={course}
            module={currentModule}
            lesson={currentLesson}
            moduleIndex={currentModuleIndex}
            lessonIndex={currentLessonIndex}
            onComplete={handleLessonComplete}
            isCompleted={completedLessons.includes(
              `${currentModuleIndex}-${currentLessonIndex}`
            )}
          />
        </main>
      </div>

      {/* Overlay para mobile cuando sidebar está abierto */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

