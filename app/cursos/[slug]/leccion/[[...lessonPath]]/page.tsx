/**
 * Página de Lección del Curso
 * Muestra el contenido de una lección específica con sidebar de navegación
 */

import { getCourseBySlug } from '@/lib/sanity/fetch';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getCourseAccessWithDetails } from '@/lib/sanity/course-access';
import { notFound, redirect } from 'next/navigation';
import { CourseLessonView } from '@/components/courses/CourseLessonView';

export const dynamic = 'force-dynamic';

interface LessonPageProps {
  params: Promise<{
    slug: string;
    lessonPath?: string[];
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug, lessonPath } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Verificar acceso
  const session = await getSession();
  if (!session?.user?.email) {
    redirect(`/cursos/${slug}?requireAuth=true`);
  }

  const user = await getUserByEmail(session.user.email);
  if (!user?._id) {
    redirect(`/cursos/${slug}?requireAuth=true`);
  }

  const courseAccess = await getCourseAccessWithDetails(user._id, course._id);
  if (!courseAccess) {
    redirect(`/cursos/${slug}?requireAccess=true`);
  }

  // Determinar qué lección mostrar
  let moduleIndex = 0;
  let lessonIndex = 0;

  if (lessonPath && lessonPath.length >= 2) {
    // URL: /cursos/[slug]/leccion/[moduleIndex]/[lessonIndex]
    moduleIndex = parseInt(lessonPath[0], 10);
    lessonIndex = parseInt(lessonPath[1], 10);
  } else if (courseAccess.progress?.lastWatched) {
    // Si hay última lección vista, ir ahí
    const lastWatched = courseAccess.progress.lastWatched;
    // Parsear formato "moduleIndex-lessonIndex"
    const parts = lastWatched.split('-');
    if (parts.length === 2) {
      const parsedModule = parseInt(parts[0], 10);
      const parsedLesson = parseInt(parts[1], 10);
      if (!isNaN(parsedModule) && !isNaN(parsedLesson)) {
        moduleIndex = parsedModule;
        lessonIndex = parsedLesson;
      }
    }
  }
  // Si no hay path y no hay última vista, mostrar primera lección (0, 0)

  // Validar índices
  if (
    !course.modules ||
    moduleIndex < 0 ||
    moduleIndex >= course.modules.length ||
    !course.modules[moduleIndex].lessons ||
    lessonIndex < 0 ||
    lessonIndex >= course.modules[moduleIndex].lessons.length
  ) {
    // Si los índices son inválidos, redirigir a la primera lección
    redirect(`/cursos/${slug}/leccion/0/0`);
  }

  const currentModule = course.modules[moduleIndex];
  const currentLesson = currentModule.lessons[lessonIndex];
  const completedLessons = courseAccess.progress?.completedLessons || [];
  const lessonId = `${moduleIndex}-${lessonIndex}`;
  const isCompleted = completedLessons.includes(lessonId);

  return (
    <CourseLessonView
      course={course}
      currentModuleIndex={moduleIndex}
      currentLessonIndex={lessonIndex}
      completedLessons={completedLessons}
      courseId={course._id}
      userId={user._id}
    />
  );
}

