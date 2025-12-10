/**
 * API Route: Instagram OAuth Callback
 * Maneja el callback de autorización de Instagram
 * 
 * Este endpoint se usa SOLO UNA VEZ para obtener el token inicial
 * Después de obtener el token, puedes eliminarlo o dejarlo para renovaciones
 */

import { NextResponse } from 'next/server';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const INSTAGRAM_REDIRECT_URI = `${SITE_URL}/api/instagram/callback`;

/**
 * Intercambiar código de autorización por access token
 * GET /api/instagram/callback?code=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Si hay error de autorización
    if (error) {
      return NextResponse.json(
        { error: 'Autorización cancelada o rechazada', details: error },
        { status: 400 }
      );
    }

    // Validar que tenemos el código
    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorización no proporcionado' },
        { status: 400 }
      );
    }

    // Validar credenciales
    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return NextResponse.json(
        { error: 'Instagram no configurado. Faltan credenciales.' },
        { status: 500 }
      );
    }

    // Intercambiar código por access token
    const tokenUrl = 'https://api.instagram.com/oauth/access_token';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Error al obtener token', details: error },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;

    // Intercambiar short-lived token por long-lived token (60 días)
    const longLivedUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`;
    const longLivedResponse = await fetch(longLivedUrl);

    if (!longLivedResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Error al obtener long-lived token',
          shortLivedToken: shortLivedToken, // Retornar token corto como fallback
          note: 'Este token expira en 1 hora. Intercámbialo manualmente por un long-lived token.'
        },
        { status: longLivedResponse.status }
      );
    }

    const longLivedData = await longLivedResponse.json();

    // Retornar token (en producción, deberías guardarlo en variables de entorno)
    return NextResponse.json({
      success: true,
      message: 'Token obtenido exitosamente (long-lived token, 60 días)',
      token: longLivedData.access_token,
      expiresIn: longLivedData.expires_in, // Segundos hasta expiración
      expiresInDays: Math.floor(longLivedData.expires_in / 86400), // Días hasta expiración
      expiresAt: new Date(Date.now() + longLivedData.expires_in * 1000).toISOString(),
      note: 'Este es un long-lived token que dura 60 días. El intercambio se hizo automáticamente.',
      instructions: [
        '✅ Token long-lived obtenido exitosamente (60 días)',
        '',
        '📝 Próximos pasos:',
        '1. Copia el token de arriba',
        '2. Agrégalo a tu archivo .env.local como:',
        `   INSTAGRAM_ACCESS_TOKEN=${longLivedData.access_token}`,
        '3. Agrégalo también en Vercel (Settings → Environment Variables)',
        '4. Reinicia tu servidor de desarrollo',
        '',
        '💡 El token expira en aproximadamente 60 días.',
        '   Configura el cron job automático para renovarlo (ver docs/INSTAGRAM_AUTO_REFRESH.md)'
      ]
    });
  } catch (error) {
    console.error('Error en Instagram callback:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

