/**
 * API Route: Obtener userId por email
 * GET /api/auth/user-id?email=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    // Verificar que el email coincida con la sesión (seguridad)
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error obteniendo userId:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Error obteniendo userId',
      },
      { status: 500 }
    );
  }
}

