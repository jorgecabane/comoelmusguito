/**
 * API Route: Actualizar Progreso de Curso
 * POST /api/courses/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { updateCourseProgress } from '@/lib/sanity/course-access';

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

    // Obtener progreso actual
    const { getUserCourseAccesses } = await import('@/lib/sanity/course-access');
    const userCourses = await getUserCourseAccesses(user._id);
    const courseAccess = userCourses.find((c) => c.courseId === courseId);

    if (!courseAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este curso' },
        { status: 403 }
      );
    }

    // Actualizar progreso
    const completedLessons = courseAccess.progress?.completedLessons || [];
    const newCompletedLessons = completedLessons.includes(lessonId)
      ? completedLessons
      : [...completedLessons, lessonId];

    await updateCourseProgress(user._id, courseId, {
      completedLessons: newCompletedLessons,
      lastWatched: lastWatched || lessonId,
      totalWatchTime: totalWatchTime
        ? (courseAccess.progress?.totalWatchTime || 0) + totalWatchTime
        : courseAccess.progress?.totalWatchTime,
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

