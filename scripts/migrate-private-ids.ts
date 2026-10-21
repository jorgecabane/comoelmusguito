/**
 * Mueve los documentos con datos personales (user, order, newsletterSubscriber) a `_id` privados
 * (`private.<id>`): en un dataset público solo los `_id` con punto quedan ocultos sin token.
 *
 * - Copia cada doc (y su borrador) al nuevo `_id`, repunta TODAS las referencias y borra el original,
 *   en una sola transacción (atómica: o pasa todo o nada).
 * - Invalida los tokens de verificación y reset vigentes (estuvieron expuestos).
 * - Idempotente: una segunda corrida solo toma lo que siga con `_id` público.
 * - Con --apply, antes de escribir exporta el dataset COMPLETO a ~/sanity-backups/ (fuera del repo,
 *   contiene PII). Es la red de seguridad si algo sale muy mal: se restaura reimportando sus
 *   documentos con createOrReplace.
 *
 * Rollback: `--revert` hace el camino inverso (`private.<id>` → `<id>`) con la misma transacción
 * atómica, conservando los cambios hechos después de migrar. Los tokens invalidados no vuelven.
 *
 * Uso: tsx scripts/migrate-private-ids.ts <dataset> [--apply] [--revert]   (sin --apply es dry-run)
 */
import { createClient, type SanityDocument } from '@sanity/client';
import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TYPES = ['user', 'order', 'newsletterSubscriber'];
const PREFIX = 'private.';
const DRAFTS = 'drafts.';
const EXPOSED_TOKEN_FIELDS = ['emailVerificationToken', 'emailVerificationExpires', 'passwordResetToken', 'passwordResetExpires'];
// Crear antes lo referenciado y borrar antes lo que referencia (los pedidos apuntan a usuarios).
const TYPE_ORDER = ['user', 'newsletterSubscriber', 'order'];

const baseId = (id: string) => (id.startsWith(DRAFTS) ? id.slice(DRAFTS.length) : id);

function rewriteRefs<T>(value: T, refMap: Map<string, string>): T {
  if (Array.isArray(value)) return value.map((v) => rewriteRefs(v, refMap)) as T;
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    out[key] = key === '_ref' && typeof v === 'string' ? (refMap.get(v) ?? v) : rewriteRefs(v, refMap);
  }
  return out as T;
}

function withoutSystemFields({ _rev, _updatedAt, ...doc }: SanityDocument) {
  void _rev;
  void _updatedAt;
  return doc;
}

/** Plan puro: docs a crear (con el `_id` nuevo), docs ajenos a reescribir (referencias) e ids a borrar. */
export function planMigration(targets: SanityDocument[], referrers: SanityDocument[], revert = false) {
  const newBase = (base: string) => (revert ? base.slice(PREFIX.length) : `${PREFIX}${base}`);
  const newId = (id: string) => (id.startsWith(DRAFTS) ? DRAFTS : '') + newBase(baseId(id));
  const refMap = new Map(targets.map((d) => [baseId(d._id), newBase(baseId(d._id))]));
  const targetIds = new Set(targets.map((d) => d._id));
  const rank = (d: SanityDocument) => TYPE_ORDER.indexOf(d._type);
  const sorted = [...targets].sort((a, b) => rank(a) - rank(b));

  const creates = sorted.map((d) => {
    const doc = rewriteRefs(withoutSystemFields(d), refMap);
    if (!revert && d._type === 'user') for (const f of EXPOSED_TOKEN_FIELDS) delete (doc as Record<string, unknown>)[f];
    return { ...doc, _id: newId(d._id) };
  });
  const updates = referrers
    .filter((d) => !targetIds.has(d._id))
    .map((d) => rewriteRefs(withoutSystemFields(d), refMap));
  const deletes = [...sorted].reverse().map((d) => d._id);
  return { creates, updates, deletes };
}

/** Exporta el dataset completo (NDJSON, con borradores) a ~/sanity-backups/, solo legible por el usuario. */
async function backupDataset(projectId: string, dataset: string, token: string) {
  const res = await fetch(`https://${projectId}.api.sanity.io/v2024-01-01/data/export/${dataset}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Backup falló (${res.status}); no se migró nada.`);
  const dir = join(homedir(), 'sanity-backups');
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = join(dir, `${dataset}-${new Date().toISOString().replace(/[:.]/g, '-')}.ndjson`);
  const body = await res.text();
  writeFileSync(file, body, { mode: 0o600 });
  console.log(`💾 backup: ${file} (${body.split('\n').filter(Boolean).length} docs)`);
}

async function main() {
  config({ path: '.env.local', quiet: true });
  const [dataset, ...flags] = process.argv.slice(2);
  if (!dataset) throw new Error('Uso: tsx scripts/migrate-private-ids.ts <dataset> [--apply] [--revert]');
  const apply = flags.includes('--apply');
  const revert = flags.includes('--revert');
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
  const token = process.env.SANITY_API_TOKEN!;

  const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false, perspective: 'raw' });

  const versions = await client.fetch<number>(`count(*[_type in $types && _id in path("versions.**")])`, { types: TYPES });
  if (versions > 0) throw new Error(`Hay ${versions} versiones de releases; publícalas o descártalas antes de migrar.`);

  const isPrivate = `(_id in path("${PREFIX}**") || _id in path("${DRAFTS}${PREFIX}**"))`;
  const targets = await client.fetch<SanityDocument[]>(
    `*[_type in $types && ${revert ? isPrivate : `!${isPrivate}`}]`,
    { types: TYPES },
  );
  const ids = [...new Set(targets.map((d) => baseId(d._id)))];
  const referrers = ids.length ? await client.fetch<SanityDocument[]>(`*[references($ids)]`, { ids }) : [];
  const { creates, updates, deletes } = planMigration(targets, referrers, revert);

  const byType = Object.fromEntries(TYPES.map((t) => [t, targets.filter((d) => d._type === t).length]));
  console.log(`dataset=${dataset} ${revert ? 'REVERT ' : ''}${apply ? 'APPLY' : 'dry-run'}`);
  console.log(`a mover: ${JSON.stringify(byType)} | referencias a repuntar en otros docs: ${updates.length}`);
  if (!creates.length) return console.log('Nada que migrar.');

  const tx = client.transaction();
  creates.forEach((doc) => tx.create(doc));
  updates.forEach((doc) => tx.createOrReplace(doc));
  deletes.forEach((id) => tx.delete(id));
  console.log(`transacción: ${creates.length} create, ${updates.length} replace, ${deletes.length} delete, ${(JSON.stringify(tx.serialize()).length / 1024).toFixed(0)} KB`);
  if (!apply) return console.log('Dry-run: no se escribió nada. Repite con --apply.');

  await backupDataset(projectId, dataset, token);
  const result = await tx.commit({ visibility: 'sync' });
  console.log(`✅ commit ${result.transactionId}`);
}

if (process.argv[1]?.endsWith('migrate-private-ids.ts')) {
  main().catch((error) => {
    console.error('❌', error.message);
    process.exit(1);
  });
}
