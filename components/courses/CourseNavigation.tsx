/**
 * Sidebar de Navegación del Curso
 * Muestra módulos y lecciones con estado de completado
 */

'use client';

import { Course } from '@/types/sanity';
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface CourseNavigationProps {
  course: Course;
  currentModuleIndex: number;
  currentLessonIndex: number;
  completedLessons: string[];
  courseSlug: string;
}

export function CourseNavigation({
  course,
  currentModuleIndex,
  currentLessonIndex,
  completedLessons,
  courseSlug,
}: CourseNavigationProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    new Set([currentModuleIndex]) // Expandir módulo actual por defecto
  );

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedModules(newExpanded);
  };

  if (!course.modules || course.modules.length === 0) {
    return (
      <div className="p-6 text-center text-gray">
        No hay contenido disponible
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-forest mb-2">
          {course.name}
        </h2>
        <p className="text-sm text-gray line-clamp-2">
          {course.shortDescription}
        </p>
      </div>

      <nav className="space-y-2">
        {course.modules.map((module, moduleIdx) => {
          const isExpanded = expandedModules.has(moduleIdx);
          const isCurrentModule = moduleIdx === currentModuleIndex;
          const hasLessons = module.lessons && module.lessons.length > 0;

          return (
            <div key={moduleIdx} className="border-b border-gray/10 last:border-0 pb-2">
              {/* Header del Módulo */}
              <button
                onClick={() => toggleModule(moduleIdx)}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                  isCurrentModule
                    ? 'bg-musgo/10 text-musgo'
                    : 'hover:bg-cream text-forest'
                )}
              >
                <div className="flex items-center gap-2 flex-1 text-left">
                  {isExpanded ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <span className="font-semibold text-sm">
                    {module.order}. {module.title}
                  </span>
                </div>
                {hasLessons && (
                  <span className="text-xs text-gray/60">
                    {module.lessons.length}
                  </span>
                )}
              </button>

              {/* Lecciones del Módulo */}
              {isExpanded && hasLessons && (
                <div className="ml-6 mt-1 space-y-1">
                  {module.lessons.map((lesson, lessonIdx) => {
                    const lessonId = `${moduleIdx}-${lessonIdx}`;
                    const isCompleted = completedLessons.includes(lessonId);
                    const isCurrent =
                      moduleIdx === currentModuleIndex &&
                      lessonIdx === currentLessonIndex;

                    return (
                      <Link
                        key={lessonIdx}
                        href={`/cursos/${courseSlug}/leccion/${moduleIdx}/${lessonIdx}`}
                        className={cn(
                          'flex items-center gap-3 p-2 rounded-lg transition-colors group',
                          isCurrent
                            ? 'bg-musgo/20 text-musgo'
                            : 'hover:bg-cream text-gray'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2
                            size={18}
                            className="text-vida flex-shrink-0"
                            fill="currentColor"
                          />
                        ) : (
                          <Circle
                            size={18}
                            className="text-gray/40 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium line-clamp-1">
                            {lesson.order}. {lesson.title}
                          </div>
                          {lesson.duration && (
                            <div className="text-xs text-gray/60 mt-0.5">
                              {lesson.duration} min
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

