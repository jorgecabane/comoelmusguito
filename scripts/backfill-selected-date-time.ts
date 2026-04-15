/**
 * Script: Limpiar items[].selectedDate.time en órdenes existentes
 *
 * El campo `time` se dejó de escribir al crear órdenes. Este script hace
 * `unset` del campo en todas las órdenes legacy para mantener el shape
 * del documento consistente.
 *
 * Es idempotente: si el campo ya no existe, no hace nada.
 *
 * Uso: npm run script:backfill-selected-date-time
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ NEXT_PUBLIC_SANITY_PROJECT_ID no está configurado');
  process.exit(1);
}

if (!process.env.SANITY_API_TOKEN) {
  console.error('❌ SANITY_API_TOKEN no está configurado');
  process.exit(1);
}

interface OrderItem {
  _key: string;
  selectedDate?: {
    date?: string;
    time?: string;
  };
}

interface OrderDoc {
  _id: string;
  orderId?: string;
  items?: OrderItem[];
}

async function main() {
  console.log('🚀 Backfill de selectedDate.time iniciado\n');

  const { createClient } = await import('@sanity/client');

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
  });

  const orders = await client.fetch<OrderDoc[]>(
    `*[_type == "order" && count(items[defined(selectedDate.time)]) > 0]{
      _id,
      orderId,
      items[]{ _key, selectedDate }
    }`
  );

  console.log(`📋 Órdenes con selectedDate.time a limpiar: ${orders.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const order of orders) {
    const paths: string[] = [];
    for (const item of order.items ?? []) {
      if (item.selectedDate && item.selectedDate.time !== undefined) {
        paths.push(`items[_key=="${item._key}"].selectedDate.time`);
      }
    }

    if (paths.length === 0) {
      skipped++;
      continue;
    }

    await client
      .patch(order._id)
      .unset(paths)
      .set({ updatedAt: new Date().toISOString() })
      .commit();

    updated++;
    console.log(`✅ ${order.orderId ?? order._id} → limpiados ${paths.length} items`);
  }

  console.log(`\n✨ Listo. Actualizadas: ${updated} · Omitidas: ${skipped} · Total: ${orders.length}`);
}

main().catch((err) => {
  console.error('❌ Error en backfill:', err);
  process.exit(1);
});
