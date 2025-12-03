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
      return NextResponse.redirect(
        new URL('/auth/error?error=InvalidToken', request.url)
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

