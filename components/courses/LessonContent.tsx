/**
 * Contenido de la Lección
 * Muestra video, descripción y controles
 */

'use client';

import { Course, CourseModule, CourseLesson } from '@/types/sanity';
import { VideoPlayer } from '@/components/ui';
import { CheckCircle2, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatFileSize } from '@/sanity/lib/file';

interface LessonContentProps {
  course: Course;
  module: CourseModule;
  lesson: CourseLesson;
  moduleIndex: number;
  lessonIndex: number;
  onComplete: () => void;
  isCompleted: boolean;
}

export function LessonContent({
  course,
  module,
  lesson,
  moduleIndex,
  lessonIndex,
  onComplete,
  isCompleted,
}: LessonContentProps) {
  const [watched, setWatched] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Encontrar siguiente lección
  const getNextLesson = () => {
    // Misma lección siguiente en el módulo
    if (lessonIndex + 1 < module.lessons.length) {
      return { moduleIndex, lessonIndex: lessonIndex + 1 };
    }
    // Siguiente módulo, primera lección
    if (course.modules && moduleIndex + 1 < course.modules.length) {
      return { moduleIndex: moduleIndex + 1, lessonIndex: 0 };
    }
    return null;
  };

  const nextLesson = getNextLesson();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
      {/* Header de la Lección */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted mb-2">
          <span>Módulo {module.order}</span>
          <span>/</span>
          <span>Lección {lesson.order}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-fg mb-4">
          {lesson.title}
        </h1>
        {module.description && (
          <p className="text-muted text-lg mb-4">{module.description}</p>
        )}
        {lesson.description && (
          <p className="text-muted mb-4">{lesson.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted">
          {lesson.duration && (
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{lesson.duration} minutos</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-1 text-brand">
              <CheckCircle2 size={16} fill="currentColor" />
              <span>Completada</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Player */}
      {lesson.videoUrl && (
        <div className="mb-8">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              src={lesson.videoUrl}
              url={lesson.videoUrl}
              provider={lesson.videoProvider}
              controls={true}
              onEnded={() => {
                setWatched(true);
                if (!isCompleted) {
                  onComplete();
                }
              }}
            />
          </div>
          {!isCompleted && (
            <div className="mt-4 text-center">
              <Button
                onClick={async () => {
                  setWatched(true);
                  setJustCompleted(true);
                  await onComplete();
                  // Quitar el mensaje después de 3 segundos
                  setTimeout(() => setJustCompleted(false), 3000);
                }}
                variant="primary"
                disabled={justCompleted}
              >
                <CheckCircle2 size={18} />
                {justCompleted ? '¡Completada!' : 'Marcar como Completada'}
              </Button>
              {justCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-brand font-semibold"
                >
                  ✅ ¡Lección completada!
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Descripción adicional */}
      {/* {lesson.description && (
        <div className="prose prose-lg max-w-none mb-8">
          <div className="text-muted leading-relaxed whitespace-pre-line">
            {lesson.description}
          </div>
        </div>
      )} */}

      {/* Downloadables */}
      {lesson.downloadables && lesson.downloadables.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display text-xl font-semibold text-fg mb-4">
            Materiales Descargables
          </h3>
          <div className="space-y-2">
            {lesson.downloadables.map((downloadable: any, idx: number) => {
              // Obtener URL del archivo desde el asset
              const fileUrl = downloadable?.asset?.url || '';
              const fileName = downloadable?.title || downloadable?.asset?.originalFilename || 'Descargar';
              const fileSize = downloadable?.asset?.size ? formatFileSize(downloadable.asset.size) : '';
              
              if (!fileUrl) {
                console.warn('Downloadable sin URL:', downloadable);
                return null;
              }

              return (
                <a
                  key={downloadable._key || idx}
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-bg rounded-lg hover:bg-bg/80 transition-colors group"
                >
                  <Download
                    size={20}
                    className="text-brand group-hover:text-fg transition-colors flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-fg truncate">
                      {fileName}
                    </div>
                    {fileSize && (
                      <div className="text-sm text-muted">
                        {fileSize}
                      </div>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Botones de Navegación */}
      <div className="flex items-center justify-between gap-4 pt-8 border-t border-line">
        <div>
          {moduleIndex > 0 || lessonIndex > 0 ? (
            <Link
              href={
                lessonIndex > 0
                  ? `/cursos/${course.slug.current}/leccion/${moduleIndex}/${
                      lessonIndex - 1
                    }`
                  : `/cursos/${course.slug.current}/leccion/${
                      moduleIndex - 1
                    }/${(course.modules?.[moduleIndex - 1]?.lessons?.length || 1) - 1}`
              }
            >
              <Button variant="secondary">
                ← Anterior
              </Button>
            </Link>
          ) : null}
        </div>

        <div>
          {nextLesson ? (
            <Link
              href={`/cursos/${course.slug.current}/leccion/${nextLesson.moduleIndex}/${nextLesson.lessonIndex}`}
            >
              <Button variant="primary">
                Siguiente →
              </Button>
            </Link>
          ) : (
            <Link href={`/cursos/${course.slug.current}`}>
              <Button variant="primary">
                Finalizar Curso
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

