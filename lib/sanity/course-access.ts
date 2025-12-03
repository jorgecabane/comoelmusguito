/**
 * Funciones para gestionar acceso a cursos
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';

/**
 * Verificar si un usuario tiene acceso a un curso
 */
export async function hasCourseAccess(
  userId: string,
  courseId: string
): Promise<boolean> {
  try {
    const query = `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`;
    const access = await client.fetch(query, { userId, courseId });
    return !!access;
  } catch (error) {
    console.error('Error verificando acceso a curso:', error);
    return false;
  }
}

/**
 * Obtener todos los cursos a los que un usuario tiene acceso
 */
export async function getUserCourseAccesses(userId: string): Promise<
  Array<{
    courseId: string;
    courseSlug: string;
    accessGrantedAt: string;
    progress?: {
      completedLessons: string[];
      lastWatched?: string;
      totalWatchTime?: number;
    };
  }>
> {
  try {
    const query = `*[_type == "courseAccess" && user._ref == $userId] {
      course-> {
        _id,
        "slug": slug.current,
        name,
        thumbnail,
        modules[] {
          title,
          order,
          lessons[] {
            title,
            order,
            duration,
            videoUrl,
            videoProvider,
            isFree
          }
        }
      },
      accessGrantedAt,
      progress
    }`;
    const accesses = await client.fetch(query, { userId });
    return accesses.map((access: any) => {
      const completedLessons = access.progress?.completedLessons || [];
      const percentage = calculateCourseProgress(access.course, completedLessons);
      
      return {
        courseId: access.course._id,
        courseSlug: access.course.slug.current,
        courseName: access.course.name,
        courseThumbnail: access.course.thumbnail,
        accessGrantedAt: access.accessGrantedAt,
        progress: {
          percentage,
          completedLessons,
          lastWatched: access.progress?.lastWatched,
          totalWatchTime: access.progress?.totalWatchTime || 0,
        },
        course: access.course,
      };
    });
  } catch (error) {
    console.error('Error obteniendo accesos a cursos:', error);
    return [];
  }
}

/**
 * Obtener acceso a curso con detalles completos (incluyendo curso)
 */
export async function getCourseAccessWithDetails(
  userId: string,
  courseId: string
): Promise<{
  accessId: string;
  course: any;
  progress?: {
    completedLessons: string[];
    lastWatched?: string;
    totalWatchTime?: number;
  };
} | null> {
  try {
    const query = `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0] {
      _id,
      course-> {
        _id,
        name,
        "slug": slug.current,
        thumbnail,
        modules[] {
          title,
          order,
          lessons[] {
            title,
            order,
            duration,
            videoUrl,
            videoProvider,
            isFree
          }
        }
      },
      progress
    }`;
    const access = await client.fetch(query, { userId, courseId });
    
    if (!access) return null;
    
    return {
      accessId: access._id,
      course: access.course,
      progress: access.progress,
    };
  } catch (error) {
    console.error('Error obteniendo acceso a curso:', error);
    return null;
  }
}

/**
 * Calcular porcentaje de progreso de un curso
 */
export function calculateCourseProgress(
  course: { modules?: Array<{ lessons?: Array<{ order: number }> }> },
  completedLessons: string[] = []
): number {
  if (!course.modules || course.modules.length === 0) return 0;
  
  // Contar total de lecciones
  const totalLessons = course.modules.reduce((total, module) => {
    return total + (module.lessons?.length || 0);
  }, 0);
  
  if (totalLessons === 0) return 0;
  
  // Contar lecciones completadas
  const completedCount = completedLessons.length;
  
  // Calcular porcentaje
  return Math.round((completedCount / totalLessons) * 100);
}

/**
 * Obtener todos los cursos del usuario con progreso y detalles
 */
export async function getUserCoursesWithProgress(userId: string): Promise<
  Array<{
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
    course: any; // Curso completo con módulos
  }>
> {
  try {
    const query = `*[_type == "courseAccess" && user._ref == $userId] {
      _id,
      course-> {
        _id,
        name,
        "slug": slug.current,
        thumbnail,
        modules[] {
          title,
          order,
          lessons[] {
            title,
            order,
            duration,
            videoUrl,
            videoProvider,
            isFree
          }
        }
      },
      accessGrantedAt,
      progress
    }`;
    const accesses = await client.fetch(query, { userId });
    
    return accesses.map((access: any) => {
      const completedLessons = access.progress?.completedLessons || [];
      const percentage = calculateCourseProgress(access.course, completedLessons);
      
      return {
        courseId: access.course._id,
        courseSlug: access.course.slug,
        courseName: access.course.name,
        courseThumbnail: access.course.thumbnail,
        accessGrantedAt: access.accessGrantedAt,
        progress: {
          percentage,
          completedLessons,
          lastWatched: access.progress?.lastWatched,
          totalWatchTime: access.progress?.totalWatchTime || 0,
        },
        course: access.course,
      };
    });
  } catch (error) {
    console.error('Error obteniendo cursos con progreso:', error);
    return [];
  }
}

/**
 * Actualizar progreso de un curso
 */
export async function updateCourseProgress(
  userId: string,
  courseId: string,
  progress: {
    completedLessons?: string[];
    lastWatched?: string;
    totalWatchTime?: number;
  }
): Promise<void> {
  try {
    const query = `*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]`;
    const access = await client.fetch(query, { userId, courseId });

    if (!access || !access._id) {
      throw new Error('Acceso a curso no encontrado');
    }

    // Usar writeClient para operaciones de escritura
    await writeClient
      .patch(access._id)
      .set({
        progress: {
          ...access.progress,
          ...progress,
        },
        updatedAt: new Date().toISOString(),
      })
      .commit();
  } catch (error) {
    console.error('Error actualizando progreso:', error);
    throw error;
  }
}

