/**
 * API Route: Checkout Callback Handler
 * Maneja el POST de Flow cuando redirige después del pago
 * 
 * Flow puede enviar POST o GET dependiendo de la configuración.
 * Este endpoint maneja POST y redirige a la página de callback con los parámetros.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/checkout/callback
 * Maneja el callback POST de Flow y redirige a la página de callback
 */
export async function POST(request: NextRequest) {
  try {
    // Flow puede enviar los datos como form-urlencoded o JSON
    const contentType = request.headers.get('content-type') || '';
    
    let flowData: Record<string, string>;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      flowData = Object.fromEntries(formData.entries()) as Record<string, string>;
    } else {
      flowData = await request.json();
    }

    // Extraer parámetros importantes
    const token = flowData.token;
    const order = flowData.commerceOrder || flowData.order;
    
    // Construir URL de redirección con los parámetros
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/checkout/callback', baseUrl);
    
    if (token) {
      redirectUrl.searchParams.set('token', token);
    }
    if (order) {
      redirectUrl.searchParams.set('order', order);
    }
    
    // Redirigir a la página de callback con los parámetros
    return NextResponse.redirect(redirectUrl.toString(), {
      status: 302,
    });
  } catch (error) {
    console.error('Error en callback POST handler:', error);
    // Si hay error, redirigir a la página de callback sin parámetros
    // La página manejará el error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/checkout/callback`, {
      status: 302,
    });
  }
}

/**
 * GET /api/checkout/callback
 * También maneja GET por si Flow envía GET (redirige a la página)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const order = searchParams.get('order');
    
    // Construir URL de redirección
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/checkout/callback', baseUrl);
    
    if (token) {
      redirectUrl.searchParams.set('token', token);
    }
    if (order) {
      redirectUrl.searchParams.set('order', order);
    }
    
    // Redirigir a la página de callback
    return NextResponse.redirect(redirectUrl.toString(), {
      status: 302,
    });
  } catch (error) {
    console.error('Error en callback GET handler:', error);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/checkout/callback`, {
      status: 302,
    });
  }
}

