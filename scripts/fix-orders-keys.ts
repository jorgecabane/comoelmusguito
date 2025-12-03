/**
 * Script: Corregir _key en items de órdenes y flowOrder
 * 
 * Este script:
 * 1. Agrega _key a los items de órdenes que no lo tengan
 * 2. Convierte flowOrder de number a string si es necesario
 * 3. Actualiza las órdenes en Sanity
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env.local') });

// Validar variables requeridas
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ Error: NEXT_PUBLIC_SANITY_PROJECT_ID no está configurado');
  process.exit(1);
}

if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ Error: SANITY_API_TOKEN no está configurado');
  process.exit(1);
}

async function main() {
  console.log('🚀 Iniciando corrección de órdenes...\n');

  // Importar cliente de Sanity dinámicamente (después de cargar env vars)
  const { createClient } = await import('@sanity/client');

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
  });

  try {
    // 1. Obtener todas las órdenes
    console.log('📋 Obteniendo todas las órdenes...');
    const orders = await client.fetch(`
      *[_type == "order"] | order(createdAt desc)
    `);

    console.log(`✅ Encontradas ${orders.length} órdenes\n`);

    if (orders.length === 0) {
      console.log('✨ No hay órdenes para corregir');
      return;
    }

    let fixedKeys = 0;
    let fixedFlowOrder = 0;
    let totalItemsFixed = 0;
    const errors: Array<{ orderId: string; error: string }> = [];

    // 2. Procesar cada orden
    for (const order of orders) {
      const orderId = order.orderId || order._id;
      let needsUpdate = false;
      const updates: any = {};

      // Verificar items
      if (order.items && Array.isArray(order.items)) {
        const fixedItems = order.items.map((item: any, index: number) => {
          // Si no tiene _key, agregarlo
          if (!item._key) {
            needsUpdate = true;
            totalItemsFixed++;
            return {
              ...item,
              _key: `${item.id || 'item'}-${index}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            };
          }
          return item;
        });

        if (needsUpdate) {
          updates.items = fixedItems;
          fixedKeys++;
        }
      }

      // Verificar flowOrder
      if (order.flowOrder !== undefined && order.flowOrder !== null) {
        // Si es number, convertir a string
        if (typeof order.flowOrder === 'number') {
          updates.flowOrder = String(order.flowOrder);
          needsUpdate = true;
          fixedFlowOrder++;
        }
      }

      // Actualizar orden si es necesario
      if (needsUpdate) {
        try {
          await client
            .patch(order._id)
            .set({
              ...updates,
              updatedAt: new Date().toISOString(),
            })
            .commit();

          console.log(`✅ Orden ${orderId}:`);
          if (updates.items) {
            console.log(`   - Agregados _key a ${updates.items.length} items`);
          }
          if (updates.flowOrder) {
            console.log(`   - flowOrder convertido a string: "${updates.flowOrder}"`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`❌ Error actualizando orden ${orderId}:`, errorMsg);
          errors.push({ orderId, error: errorMsg });
        }
      } else {
        console.log(`✓ Orden ${orderId}: Ya está correcta`);
      }
    }

    // 3. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`Total de órdenes procesadas: ${orders.length}`);
    console.log(`Órdenes con items corregidos: ${fixedKeys}`);
    console.log(`Total de items corregidos: ${totalItemsFixed}`);
    console.log(`Órdenes con flowOrder corregido: ${fixedFlowOrder}`);
    console.log(`Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errores encontrados:');
      errors.forEach(({ orderId, error }) => {
        console.log(`   - Orden ${orderId}: ${error}`);
      });
    }

    if (fixedKeys === 0 && fixedFlowOrder === 0) {
      console.log('\n✨ ¡Todas las órdenes ya están correctas!');
    } else {
      console.log('\n✅ Corrección completada exitosamente');
    }
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

// Ejecutar script
main().catch((error) => {
  console.error('❌ Error no manejado:', error);
  process.exit(1);
});

