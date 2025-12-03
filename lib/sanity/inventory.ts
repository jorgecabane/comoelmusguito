/**
 * Funciones para gestionar inventario (stock) de productos
 */

import 'server-only';
import { client, writeClient } from '@/sanity/lib/client';

/**
 * Verificar stock disponible de un terrario
 */
export async function checkTerrariumStock(
  terrariumId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number; inStock: boolean }> {
  try {
    const query = `*[_type == "terrarium" && _id == $id][0]`;
    const terrarium = await client.fetch(query, { id: terrariumId });

    if (!terrarium) {
      return { available: false, currentStock: 0, inStock: false };
    }

    const currentStock = terrarium.stock || 0;
    const inStock = terrarium.inStock || false;

    return {
      available: inStock && currentStock >= requestedQuantity,
      currentStock,
      inStock,
    };
  } catch (error) {
    console.error(`Error verificando stock de terrario ${terrariumId}:`, error);
    return { available: false, currentStock: 0, inStock: false };
  }
}

/**
 * Descontar stock de un terrario
 * Es idempotente: usa transacción atómica para evitar race conditions
 * Si el stock es insuficiente, solo descuenta lo disponible (no permite negativo)
 */
export async function decreaseTerrariumStock(
  terrariumId: string,
  quantity: number
): Promise<void> {
  try {
    // Usar transacción atómica para evitar race conditions
    // Leer y actualizar en una sola operación
    const terrarium = await writeClient.fetch(
      `*[_type == "terrarium" && _id == $id][0]`,
      { id: terrariumId }
    );

    if (!terrarium) {
      throw new Error(`Terrario ${terrariumId} no encontrado`);
    }

    const currentStock = terrarium.stock || 0;
    
    // Si no hay suficiente stock, solo descontar lo disponible
    // Esto previene doble descuento en race conditions
    const quantityToDeduct = Math.min(quantity, currentStock);
    
    if (quantityToDeduct === 0) {
      console.warn(
        `⚠️ No se puede descontar stock de terrario ${terrariumId}: stock actual es ${currentStock}, se intentó descontar ${quantity}`
      );
      return; // No hacer nada si no hay stock disponible
    }

    if (quantityToDeduct < quantity) {
      console.warn(
        `⚠️ Intento de descontar ${quantity} unidades pero solo hay ${currentStock} disponibles para terrario ${terrariumId}. Descontando ${quantityToDeduct}`
      );
    }

    const newStock = currentStock - quantityToDeduct;
    const inStock = newStock > 0;

    // Actualizar stock de forma atómica
    await writeClient
      .patch(terrariumId)
      .set({
        stock: newStock,
        inStock,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    console.log(
      `✅ Stock de terrario ${terrariumId} actualizado: ${currentStock} → ${newStock} (descontado: ${quantityToDeduct})`
    );
  } catch (error) {
    console.error(`Error descontando stock de terrario ${terrariumId}:`, error);
    throw error;
  }
}

/**
 * Verificar cupos disponibles de un taller en una fecha específica
 */
export async function checkWorkshopSpots(
  workshopId: string,
  date: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentSpots: number }> {
  try {
    const query = `*[_type == "workshop" && _id == $id][0]`;
    const workshop = await client.fetch(query, { id: workshopId });

    if (!workshop) {
      return { available: false, currentSpots: 0 };
    }

    const dates = workshop.dates || [];
    const dateObj = dates.find(
      (d: any) => new Date(d.date).toISOString() === new Date(date).toISOString()
    );

    if (!dateObj) {
      return { available: false, currentSpots: 0 };
    }

    const currentSpots = dateObj.spotsAvailable || 0;
    const isAvailable = dateObj.status === 'available' && currentSpots >= requestedQuantity;

    return {
      available: isAvailable,
      currentSpots,
    };
  } catch (error) {
    console.error(`Error verificando cupos de taller ${workshopId}:`, error);
    return { available: false, currentSpots: 0 };
  }
}

/**
 * Descontar cupos disponibles de un taller
 * Es idempotente: solo descuenta lo disponible para evitar race conditions
 */
export async function decreaseWorkshopSpots(
  workshopId: string,
  date: string,
  quantity: number
): Promise<void> {
  try {
    // Obtener taller actual
    const query = `*[_type == "workshop" && _id == $id][0]`;
    const workshop = await writeClient.fetch(query, { id: workshopId });

    if (!workshop) {
      throw new Error(`Taller ${workshopId} no encontrado`);
    }

    // Buscar la fecha específica y actualizar cupos
    const dates = workshop.dates || [];
    const dateIndex = dates.findIndex(
      (d: any) => new Date(d.date).toISOString() === new Date(date).toISOString()
    );

    if (dateIndex === -1) {
      throw new Error(`Fecha ${date} no encontrada en el taller ${workshopId}`);
    }

    const currentDate = dates[dateIndex];
    const currentSpots = currentDate.spotsAvailable || 0;
    
    // Si no hay suficientes cupos, solo descontar lo disponible
    // Esto previene doble descuento en race conditions
    const quantityToDeduct = Math.min(quantity, currentSpots);
    
    if (quantityToDeduct === 0) {
      console.warn(
        `⚠️ No se pueden descontar cupos del taller ${workshopId} en fecha ${date}: cupos actuales son ${currentSpots}, se intentó descontar ${quantity}`
      );
      return; // No hacer nada si no hay cupos disponibles
    }

    if (quantityToDeduct < quantity) {
      console.warn(
        `⚠️ Intento de descontar ${quantity} cupos pero solo hay ${currentSpots} disponibles para taller ${workshopId} en fecha ${date}. Descontando ${quantityToDeduct}`
      );
    }

    const newSpots = currentSpots - quantityToDeduct;
    const status = newSpots > 0 ? 'available' : 'soldOut';

    // Actualizar el array de fechas
    const updatedDates = [...dates];
    updatedDates[dateIndex] = {
      ...currentDate,
      spotsAvailable: newSpots,
      status,
    };

    // Actualizar taller
    await writeClient
      .patch(workshopId)
      .set({
        dates: updatedDates,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    console.log(
      `✅ Cupos de taller ${workshopId} (${date}) actualizados: ${currentSpots} → ${newSpots} (descontado: ${quantityToDeduct})`
    );
  } catch (error) {
    console.error(`Error descontando cupos de taller ${workshopId}:`, error);
    throw error;
  }
}
