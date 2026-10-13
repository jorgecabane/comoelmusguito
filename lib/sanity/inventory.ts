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
 * Descuenta stock con un `dec` atómico de Sanity (sin leer antes), así dos pagos
 * concurrentes nunca pisan el valor del otro. Si el resultado queda negativo se
 * devuelve el exceso con `inc` (también atómico) y se marca sin stock.
 */
async function decreaseStock(id: string, quantity: number, label: string): Promise<void> {
  try {
    const updated = await writeClient
      .patch(id)
      .setIfMissing({ stock: 0 })
      .dec({ stock: quantity })
      .set({ updatedAt: new Date().toISOString() })
      .commit<{ stock: number }>();

    if (updated.stock > 0) {
      console.log(`✅ Stock de ${label} ${id} descontado en ${quantity}: quedan ${updated.stock}`);
      return;
    }

    if (updated.stock < 0) {
      console.warn(
        `⚠️ Se intentó descontar ${quantity} unidades de ${label} ${id} con stock insuficiente; se deja en 0`
      );
    }
    await writeClient
      .patch(id)
      .inc({ stock: -updated.stock })
      .set({ inStock: false })
      .commit();
  } catch (error) {
    console.error(`Error descontando stock de ${label} ${id}:`, error);
    throw error;
  }
}

/**
 * Descontar stock de un terrario (atómico, nunca queda negativo)
 */
export async function decreaseTerrariumStock(terrariumId: string, quantity: number): Promise<void> {
  await decreaseStock(terrariumId, quantity, 'terrario');
}

/**
 * Verificar stock disponible de un insumo
 */
export async function checkSupplyStock(
  supplyId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number; inStock: boolean }> {
  try {
    const query = `*[_type == "supply" && _id == $id][0]`;
    const supply = await client.fetch(query, { id: supplyId });

    if (!supply) {
      return { available: false, currentStock: 0, inStock: false };
    }

    const currentStock = supply.stock || 0;
    const inStock = supply.inStock || false;

    return {
      available: inStock && currentStock >= requestedQuantity,
      currentStock,
      inStock,
    };
  } catch (error) {
    console.error(`Error verificando stock de insumo ${supplyId}:`, error);
    return { available: false, currentStock: 0, inStock: false };
  }
}

/**
 * Descontar stock de un insumo (atómico, nunca queda negativo)
 */
export async function decreaseSupplyStock(supplyId: string, quantity: number): Promise<void> {
  await decreaseStock(supplyId, quantity, 'insumo');
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
    const isAvailable =
      dateObj.status !== 'sold_out' &&
      dateObj.status !== 'cancelled' &&
      currentSpots >= requestedQuantity;

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
 * Descontar cupos de un taller en una fecha. Se lee el taller sólo para ubicar
 * la fecha (_key); el descuento es un `dec` atómico sobre ese cupo.
 */
export async function decreaseWorkshopSpots(
  workshopId: string,
  date: string,
  quantity: number
): Promise<void> {
  try {
    const query = `*[_type == "workshop" && _id == $id][0]`;
    const workshop = await writeClient.fetch(query, { id: workshopId });

    if (!workshop) {
      throw new Error(`Taller ${workshopId} no encontrado`);
    }

    const target = new Date(date).toISOString();
    const dateObj = (workshop.dates || []).find(
      (d: any) => new Date(d.date).toISOString() === target
    );

    if (!dateObj) {
      throw new Error(`Fecha ${date} no encontrada en el taller ${workshopId}`);
    }

    const path = `dates[_key=="${dateObj._key}"]`;
    const spotsPath = `${path}.spotsAvailable`;
    const updated = await writeClient
      .patch(workshopId)
      .setIfMissing({ [spotsPath]: 0 })
      .dec({ [spotsPath]: quantity })
      .set({ updatedAt: new Date().toISOString() })
      .commit<{ dates: Array<{ _key: string; spotsAvailable: number }> }>();

    const newSpots = updated.dates.find((d) => d._key === dateObj._key)?.spotsAvailable ?? 0;
    if (newSpots > 0) {
      console.log(`✅ Cupos de taller ${workshopId} (${date}) descontados en ${quantity}: quedan ${newSpots}`);
      return;
    }

    if (newSpots < 0) {
      console.warn(
        `⚠️ Se intentó descontar ${quantity} cupos del taller ${workshopId} en fecha ${date} sin cupos suficientes; se deja en 0`
      );
    }
    await writeClient
      .patch(workshopId)
      .inc({ [spotsPath]: -newSpots })
      .set({ [`${path}.status`]: 'sold_out' })
      .commit();
  } catch (error) {
    console.error(`Error descontando cupos de taller ${workshopId}:`, error);
    throw error;
  }
}
