/**
 * API Route (cron): purga de datos de atribución de Meta
 * GET /api/cron/purge-meta-attribution
 *
 * Borra la IP, el navegador y las cookies de Meta guardadas en pedidos que nunca
 * se pagaron (7 días). Es lo que respalda lo que dice /privacidad, sección 8.
 * Protegido por CRON_SECRET: Vercel Cron envía `Authorization: Bearer ${CRON_SECRET}`.
 */

import { NextResponse } from 'next/server';
import { purgeStaleMetaAttribution } from '@/lib/sanity/orders';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET no configurado en variables de entorno' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const purged = await purgeStaleMetaAttribution();
    console.log(`[cron] metaAttribution borrada en ${purged} pedido(s) pendientes`);
    return NextResponse.json({ success: true, purged });
  } catch (error) {
    console.error('[cron] Error purgando metaAttribution:', error);
    return NextResponse.json({ error: 'Error al purgar los datos de atribución' }, { status: 500 });
  }
}
