/**
 * API Route: Verificar si email existe y está verificado
 * GET /api/auth/check-email?email=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({
        exists: false,
        verified: false,
      });
    }

    return NextResponse.json({
      exists: true,
      verified: user.emailVerified || false,
    });
  } catch (error) {
    console.error('Error verificando email:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error verificando email',
      },
      { status: 500 }
    );
  }
}

