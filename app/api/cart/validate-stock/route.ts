/**
 * API Route: Validar stock antes de agregar al carrito
 * POST /api/cart/validate-stock
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkTerrariumStock, checkSupplyStock, checkWorkshopSpots } from '@/lib/sanity/inventory';
import { getTerrariumById, getSupplyById } from '@/lib/sanity/fetch';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, quantity, selectedDate } = body;

    if (!itemId || !itemType || !quantity) {
      return NextResponse.json(
        { error: 'itemId, itemType y quantity son requeridos' },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitizedItemId = String(itemId).trim();
    const sanitizedItemType = String(itemType).trim();
    const sanitizedQuantity = parseInt(String(quantity), 10);

    if (isNaN(sanitizedQuantity) || sanitizedQuantity <= 0) {
      return NextResponse.json(
        { error: 'Cantidad inválida' },
        { status: 400 }
      );
    }

    // Validar stock para terrarios e insumos
    if (sanitizedItemType === 'terrarium') {
      const terrarium = await getTerrariumById(sanitizedItemId);
      
      if (!terrarium) {
        return NextResponse.json(
          { error: 'Producto no encontrado', available: false },
          { status: 404 }
        );
      }

      if (!terrarium.inStock) {
        return NextResponse.json({
          available: false,
          inStock: false,
          currentStock: 0,
          message: 'Este producto está agotado',
        });
      }

      const stockCheck = await checkTerrariumStock(sanitizedItemId, sanitizedQuantity);
      
      return NextResponse.json({
        available: stockCheck.available,
        inStock: stockCheck.inStock,
        currentStock: stockCheck.currentStock,
        message: stockCheck.available
          ? 'Stock disponible'
          : `Solo quedan ${stockCheck.currentStock} unidades disponibles`,
      });
    }

    if (sanitizedItemType === 'supply') {
      const supply = await getSupplyById(sanitizedItemId);
      
      if (!supply) {
        return NextResponse.json(
          { error: 'Insumo no encontrado', available: false },
          { status: 404 }
        );
      }

      if (!supply.inStock) {
        return NextResponse.json({
          available: false,
          inStock: false,
          currentStock: 0,
          message: 'Este insumo está agotado',
        });
      }

      const stockCheck = await checkSupplyStock(sanitizedItemId, sanitizedQuantity);
      
      return NextResponse.json({
        available: stockCheck.available,
        inStock: stockCheck.inStock,
        currentStock: stockCheck.currentStock,
        message: stockCheck.available
          ? 'Stock disponible'
          : `Solo quedan ${stockCheck.currentStock} unidades disponibles`,
      });
    }

    if (sanitizedItemType === 'workshop') {
      if (!selectedDate) {
        return NextResponse.json(
          { error: 'selectedDate es requerido para talleres', available: false },
          { status: 400 }
        );
      }

      const spotsCheck = await checkWorkshopSpots(
        sanitizedItemId,
        String(selectedDate),
        sanitizedQuantity
      );

      return NextResponse.json({
        available: spotsCheck.available,
        inStock: spotsCheck.available,
        currentStock: spotsCheck.currentSpots,
        message: spotsCheck.available
          ? 'Cupos disponibles'
          : spotsCheck.currentSpots > 0
          ? `Solo quedan ${spotsCheck.currentSpots} cupos para esta fecha`
          : 'Esta fecha ya no tiene cupos disponibles',
      });
    }

    // Cursos: siempre disponibles
    return NextResponse.json({
      available: true,
      inStock: true,
      message: 'Disponible',
    });
  } catch (error) {
    console.error('Error validando stock:', error);
    return NextResponse.json(
      {
        error: 'Error validando stock',
        available: false,
      },
      { status: 500 }
    );
  }
}
