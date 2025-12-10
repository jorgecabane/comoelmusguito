/**
 * API Route: Instagram Feed
 * Obtiene las últimas fotos de Instagram usando Basic Display API
 */

import { NextResponse } from 'next/server';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
}

interface InstagramResponse {
  data: InstagramMedia[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
  };
}

/**
 * Obtener fotos de Instagram
 * GET /api/instagram/feed?limit=8
 */
export async function GET(request: Request) {
  try {
    // Validar que tenemos las credenciales
    if (!INSTAGRAM_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Instagram no configurado. Falta INSTAGRAM_ACCESS_TOKEN' },
        { status: 500 }
      );
    }

    // Obtener límite de la query (default: 8)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    // Endpoint de Instagram Basic Display API
    const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp';
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache por 1 hora
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error de Instagram API:', error);
      
      // Si el token expiró, retornar error específico con instrucciones
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Token de Instagram expirado. Necesita renovación.',
            code: 'TOKEN_EXPIRED',
            instructions: [
              'El token de Instagram expiró.',
              'Para renovarlo:',
              '1. Llama a: GET /api/instagram/refresh',
              '2. O ejecuta: npm run script:instagram-auth',
              '3. Actualiza INSTAGRAM_ACCESS_TOKEN en Vercel (ver docs/VERCEL_ENV_VARIABLES.md)'
            ]
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Error al obtener fotos de Instagram', details: error },
        { status: response.status }
      );
    }

    const data: InstagramResponse = await response.json();

    // Filtrar solo imágenes (excluir videos si quieres)
    const images = data.data.filter(
      (item) => item.media_type === 'IMAGE' || item.media_type === 'CAROUSEL_ALBUM'
    );

    // Formatear respuesta
    const formatted = images.slice(0, limit).map((item) => ({
      id: item.id,
      url: item.media_url,
      thumbnail: item.thumbnail_url || item.media_url,
      permalink: item.permalink,
      caption: item.caption || '',
      timestamp: item.timestamp,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    console.error('Error en Instagram feed:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

