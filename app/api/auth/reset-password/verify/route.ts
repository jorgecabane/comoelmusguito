/**
 * API Route: Verificar token de reset de contraseña
 * GET /api/auth/reset-password/verify?token=<token>
 *
 * Responde si el token es válido y si el flujo es "inicializar contraseña por
 * primera vez" (usuario OAuth-only) o un reset normal. No devuelve datos del
 * usuario para no filtrar información sensible con el token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserByResetToken, hasPassword } from '@/lib/auth/sanity-adapter';
import { apiRateLimit, getClientIP, applyRateLimit } from '@/lib/rate-limit/upstash';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimitResult = await applyRateLimit(apiRateLimit, ip);

    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        { valid: false },
        { status: 429 }
      );
    }

    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const user = await getUserByResetToken(token);

    if (!user) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      isInitializing: !hasPassword(user),
    });
  } catch (error) {
    console.error('Error verificando token de reset:', error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
