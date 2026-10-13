/**
 * API Route: Refresh Instagram Token
 * Endpoint para refrescar manualmente el token de Instagram.
 *
 * GET /api/instagram/refresh
 * Authorization: Bearer <CRON_SECRET>
 *
 * Nunca retorna el token: solo confirma el refresh y su expiración.
 * Para actualizar la variable en Vercel usa /api/instagram/refresh-auto.
 */

import { NextResponse } from 'next/server';
import { refreshInstagramToken } from '@/lib/instagram/token';

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Refrescar token de Instagram
 */
export async function GET(request: Request) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json(
        { error: 'CRON_SECRET no configurado en variables de entorno' },
        { status: 500 }
      );
    }

    if (request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!INSTAGRAM_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Instagram no configurado. Falta INSTAGRAM_ACCESS_TOKEN' },
        { status: 500 }
      );
    }

    const result = await refreshInstagramToken(INSTAGRAM_ACCESS_TOKEN);

    if (!result) {
      return NextResponse.json(
        { 
          error: 'No se pudo refrescar el token. Puede estar completamente expirado.',
          code: 'REFRESH_FAILED',
          instructions: [
            'El token no pudo ser refrescado automáticamente.',
            'Puede que haya expirado completamente (más de 60 días sin renovar).',
            'Necesitas obtener un nuevo token manualmente:',
            '1. Ejecuta: npm run script:instagram-auth',
            '2. Sigue el proceso de autorización',
            '3. Actualiza INSTAGRAM_ACCESS_TOKEN en tus variables de entorno'
          ]
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Token refrescado exitosamente',
      expiresIn: result.expiresIn,
      expiresInDays: Math.floor(result.expiresIn / 86400), // Convertir segundos a días
      expiresAt: new Date(Date.now() + result.expiresIn * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error en refresh endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
