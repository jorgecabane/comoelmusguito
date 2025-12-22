/**
 * API Route: Verificar acceso a curso
 * GET /api/courses/check-access?courseSlug=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getCourseBySlug } from '@/lib/sanity/fetch';
import { hasCourseAccess, getCourseAccessWithDetails } from '@/lib/sanity/course-access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('courseSlug');

    if (!courseSlug) {
      return NextResponse.json(
        { error: 'courseSlug requerido' },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ hasAccess: false });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user?._id) {
      return NextResponse.json({ hasAccess: false });
    }

    // Obtener curso por slug
    const course = await getCourseBySlug(courseSlug);
    if (!course) {
      return NextResponse.json({ hasAccess: false });
    }

    // Verificar acceso
    const hasAccess = await hasCourseAccess(user._id, course._id);
    
    if (!hasAccess) {
      return NextResponse.json({ hasAccess: false });
    }

    // Obtener detalles del acceso para última lección vista
    const courseAccess = await getCourseAccessWithDetails(user._id, course._id);

    return NextResponse.json({
      hasAccess: true,
      lastWatched: courseAccess?.progress?.lastWatched || null,
    });
  } catch (error) {
    console.error('Error verificando acceso a curso:', error);
    return NextResponse.json(
      { error: 'Error verificando acceso' },
      { status: 500 }
    );
  }
}
