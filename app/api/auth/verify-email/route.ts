/**
 * API Route: Verificar email del usuario
 * GET /api/auth/verify-email?token=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByVerificationToken, verifyUserEmail } from '@/lib/auth/sanity-adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/error?error=VerificationTokenMissing', request.url)
      );
    }

    // Buscar usuario por token
    const user = await getUserByVerificationToken(token);

    if (!user) {
      // Verificar si el email ya está verificado buscando por el token en la URL
      // Si no encontramos el usuario por token, puede ser que:
      // 1. El token expiró
      // 2. El token ya fue usado (email ya verificado)
      // Intentamos buscar si hay un usuario con email verificado que podría haber usado este token
      // Pero como no tenemos el email en la URL, simplemente redirigimos con un mensaje más claro
      return NextResponse.redirect(
        new URL('/auth/error?error=TokenUsedOrExpired', request.url)
      );
    }

    // Si el usuario ya está verificado, mostrar mensaje amigable
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL('/auth/login?alreadyVerified=true', request.url)
      );
    }

    // Verificar email
    const success = await verifyUserEmail(user._id);

    if (!success) {
      return NextResponse.redirect(
        new URL('/auth/error?error=VerificationFailed', request.url)
      );
    }

    // Redirigir a login con mensaje de éxito
    return NextResponse.redirect(
      new URL('/auth/login?verified=true', request.url)
    );
  } catch (error) {
    console.error('Error verificando email:', error);
    return NextResponse.redirect(
      new URL('/auth/error?error=VerificationError', request.url)
    );
  }
}

