/**
 * API Route: Obtener snapshot de un producto
 * GET /api/products/snapshot
 * Retorna información del producto para guardar en la orden
 */

import { NextRequest, NextResponse } from 'next/server';
import { getImageUrl } from '@/lib/sanity/utils';
import { client } from '@/sanity/lib/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');

    if (!id || !type) {
      return NextResponse.json(
        { error: 'id y type requeridos' },
        { status: 400 }
      );
    }

    let product: any = null;
    let snapshot: any = {};

    // Obtener producto según tipo
    if (type === 'terrarium') {
      const query = `*[_type == "terrarium" && _id == $id][0]`;
      product = await client.fetch(query, { id });
      
      if (product) {
        snapshot = {
          image: getImageUrl(product.images?.[0], { width: 400, height: 400 }),
          description: product.description,
          longDescription: product.longDescription,
          size: product.size,
          category: product.category,
        };
      }
    } else if (type === 'course') {
      const query = `*[_type == "course" && _id == $id][0]`;
      product = await client.fetch(query, { id });
      
      if (product) {
        snapshot = {
          image: getImageUrl(product.thumbnail, { width: 400, height: 400 }),
          description: product.shortDescription,
          longDescription: product.longDescription,
          duration: product.duration,
          level: product.level,
        };
      }
    } else if (type === 'workshop') {
      const query = `*[_type == "workshop" && _id == $id][0]`;
      product = await client.fetch(query, { id });
      
      if (product) {
        snapshot = {
          image: getImageUrl(product.images?.[0], { width: 400, height: 400 }),
          description: product.description,
          longDescription: product.longDescription,
          location: product.location?.address || 'Santa Isabel 676, Providencia, Santiago',
        };
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: snapshot,
    });
  } catch (error) {
    console.error('Error obteniendo snapshot del producto:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al obtener snapshot',
      },
      { status: 500 }
    );
  }
}

