/**
 * API Route: Actualizar Progreso de Curso
 * POST /api/courses/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { updateCourseProgress, getCourseAccessWithDetails } from '@/lib/sanity/course-access';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { courseId, lessonId, lastWatched, totalWatchTime } = body;

    if (!courseId || !lessonId) {
      return NextResponse.json(
        { error: 'courseId y lessonId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener acceso al curso con detalles completos (incluyendo el curso con módulos y lecciones)
    const courseAccessDetails = await getCourseAccessWithDetails(user._id, courseId);

    if (!courseAccessDetails) {
      return NextResponse.json(
        { error: 'No tienes acceso a este curso' },
        { status: 403 }
      );
    }

    // Parsear lessonId para obtener índices de módulo y lección
    const lessonIdParts = lessonId.split('-');
    if (lessonIdParts.length !== 2) {
      return NextResponse.json(
        { error: 'Formato de lessonId inválido' },
        { status: 400 }
      );
    }

    const moduleIndex = parseInt(lessonIdParts[0], 10);
    const lessonIndex = parseInt(lessonIdParts[1], 10);

    // Obtener duración de la lección desde el curso
    let lessonDuration = 0; // en minutos
    if (
      courseAccessDetails.course?.modules &&
      courseAccessDetails.course.modules[moduleIndex]?.lessons &&
      courseAccessDetails.course.modules[moduleIndex].lessons[lessonIndex]?.duration
    ) {
      lessonDuration = courseAccessDetails.course.modules[moduleIndex].lessons[lessonIndex].duration || 0;
    }

    // Actualizar progreso
    const completedLessons = courseAccessDetails.progress?.completedLessons || [];
    const isNewlyCompleted = !completedLessons.includes(lessonId);
    const newCompletedLessons = isNewlyCompleted
      ? [...completedLessons, lessonId]
      : completedLessons;

    // Calcular nuevo totalWatchTime
    // Si se marca como completada por primera vez, sumar la duración de la lección
    const currentTotalWatchTime = courseAccessDetails.progress?.totalWatchTime || 0;
    const additionalWatchTime = totalWatchTime || 0;
    const lessonDurationToAdd = isNewlyCompleted ? lessonDuration : 0;
    const newTotalWatchTime = currentTotalWatchTime + additionalWatchTime + lessonDurationToAdd;

    // Actualizar progreso con lastWatchedAt (fecha/hora actual)
    await updateCourseProgress(user._id, courseId, {
      completedLessons: newCompletedLessons,
      lastWatched: lastWatched || lessonId,
      lastWatchedAt: new Date().toISOString(),
      totalWatchTime: newTotalWatchTime,
    });

    return NextResponse.json({
      success: true,
      progress: {
        completedLessons: newCompletedLessons,
        lastWatched: lastWatched || lessonId,
      },
    });
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error actualizando progreso',
      },
      { status: 500 }
    );
  }
}

