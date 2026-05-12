/**
 * Migration: Add paymentProvider field to existing orders
 * All existing orders were made via Flow
 *
 * Usage: npx tsx scripts/migrate-orders-add-provider.ts
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
  console.log('🚀 Iniciando migración: agregar paymentProvider a órdenes existentes...\n');

  const { createClient } = await import('@sanity/client');

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
  });

  try {
    // Obtener solo órdenes sin paymentProvider (idempotente)
    console.log('📋 Buscando órdenes sin paymentProvider...');
    const orders = await client.fetch(`
      *[_type == "order" && !defined(paymentProvider)] | order(createdAt desc) {
        _id,
        orderId
      }
    `);

    console.log(`✅ Encontradas ${orders.length} órdenes para migrar\n`);

    if (orders.length === 0) {
      console.log('✨ No hay órdenes para migrar. La migración ya fue ejecutada o no hay datos.');
      return;
    }

    let migrated = 0;
    const errors: Array<{ orderId: string; error: string }> = [];

    for (const order of orders) {
      const orderId = order.orderId || order._id;
      try {
        await client.patch(order._id).set({ paymentProvider: 'flow' }).commit();
        migrated++;
        console.log(`  ✓ [${migrated}/${orders.length}] Orden ${orderId} → paymentProvider: 'flow'`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ orderId, error: message });
        console.error(`  ✗ Error en orden ${orderId}: ${message}`);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`  - Órdenes migradas: ${migrated}`);
    console.log(`  - Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.error('\n❌ Órdenes con error:');
      errors.forEach(({ orderId, error }) => console.error(`  - ${orderId}: ${error}`));
      process.exit(1);
    } else {
      console.log('\n✅ Migración completada exitosamente');
    }
  } catch (err) {
    console.error('❌ Error fatal durante la migración:', err);
    process.exit(1);
  }
}

main();
