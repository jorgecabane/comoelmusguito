/**
 * API Route: Refresh Instagram Token
 * Endpoint para refrescar manualmente el token de Instagram
 * 
 * GET /api/instagram/refresh
 * 
 * Útil para:
 * - Refrescar el token antes de que expire
 * - Verificar que el token sigue válido
 * - Obtener el nuevo token para actualizar variables de entorno
 */

import { NextResponse } from 'next/server';
import { refreshInstagramToken } from '@/lib/instagram/token';

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

/**
 * Refrescar token de Instagram
 */
export async function GET() {
  try {
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
      token: result.token,
      expiresIn: result.expiresIn,
      expiresInDays: Math.floor(result.expiresIn / 86400), // Convertir segundos a días
      expiresAt: new Date(Date.now() + result.expiresIn * 1000).toISOString(),
      instructions: [
        '✅ Token refrescado exitosamente',
        `⏰ Expira en ${Math.floor(result.expiresIn / 86400)} días`,
        '',
        '📝 IMPORTANTE: Actualiza tu variable de entorno:',
        `   INSTAGRAM_ACCESS_TOKEN=${result.token}`,
        '',
        '💡 En producción, considera automatizar esto con un cron job que:',
        '   1. Refresque el token cada 50 días',
        '   2. Actualice automáticamente la variable de entorno'
      ]
    });
  } catch (error) {
    console.error('Error en refresh endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

