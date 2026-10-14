/**
 * Mueve los documentos con datos personales (user, order, newsletterSubscriber) a `_id` privados
 * (`private.<id>`): en un dataset público solo los `_id` con punto quedan ocultos sin token.
 *
 * - Copia cada doc (y su borrador) al nuevo `_id`, repunta TODAS las referencias y borra el original,
 *   en una sola transacción (atómica: o pasa todo o nada).
 * - Invalida los tokens de verificación y reset vigentes (estuvieron expuestos).
 * - Idempotente: una segunda corrida solo toma lo que siga con `_id` público.
 *
 * Uso: tsx scripts/migrate-private-ids.ts <dataset> [--apply]   (sin --apply es dry-run)
 */
import { createClient, type SanityDocument } from '@sanity/client';
import { config } from 'dotenv';

const TYPES = ['user', 'order', 'newsletterSubscriber'];
const PREFIX = 'private.';
const DRAFTS = 'drafts.';
const EXPOSED_TOKEN_FIELDS = ['emailVerificationToken', 'emailVerificationExpires', 'passwordResetToken', 'passwordResetExpires'];
// Crear antes lo referenciado y borrar antes lo que referencia (los pedidos apuntan a usuarios).
const TYPE_ORDER = ['user', 'newsletterSubscriber', 'order'];

const baseId = (id: string) => (id.startsWith(DRAFTS) ? id.slice(DRAFTS.length) : id);
const toPrivate = (id: string) => (id.startsWith(DRAFTS) ? `${DRAFTS}${PREFIX}${baseId(id)}` : `${PREFIX}${id}`);

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

/** Plan puro: docs a crear (privados), docs ajenos a reescribir (referencias) e ids a borrar. */
export function planMigration(targets: SanityDocument[], referrers: SanityDocument[]) {
  const refMap = new Map(targets.map((d) => [baseId(d._id), `${PREFIX}${baseId(d._id)}`]));
  const targetIds = new Set(targets.map((d) => d._id));
  const rank = (d: SanityDocument) => TYPE_ORDER.indexOf(d._type);
  const sorted = [...targets].sort((a, b) => rank(a) - rank(b));

  const creates = sorted.map((d) => {
    const doc = rewriteRefs(withoutSystemFields(d), refMap);
    if (d._type === 'user') for (const f of EXPOSED_TOKEN_FIELDS) delete (doc as Record<string, unknown>)[f];
    return { ...doc, _id: toPrivate(d._id) };
  });
  const updates = referrers
    .filter((d) => !targetIds.has(d._id))
    .map((d) => rewriteRefs(withoutSystemFields(d), refMap));
  const deletes = [...sorted].reverse().map((d) => d._id);
  return { creates, updates, deletes };
}

async function main() {
  config({ path: '.env.local', quiet: true });
  const [dataset, flag] = process.argv.slice(2);
  if (!dataset) throw new Error('Uso: tsx scripts/migrate-private-ids.ts <dataset> [--apply]');
  const apply = flag === '--apply';

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
    perspective: 'raw', // incluye borradores
  });

  const versions = await client.fetch<number>(`count(*[_type in $types && _id in path("versions.**")])`, { types: TYPES });
  if (versions > 0) throw new Error(`Hay ${versions} versiones de releases; publícalas o descártalas antes de migrar.`);

  const targets = await client.fetch<SanityDocument[]>(
    `*[_type in $types && !(_id in path("${PREFIX}**")) && !(_id in path("${DRAFTS}${PREFIX}**"))]`,
    { types: TYPES },
  );
  const ids = [...new Set(targets.map((d) => baseId(d._id)))];
  const referrers = ids.length ? await client.fetch<SanityDocument[]>(`*[references($ids)]`, { ids }) : [];
  const { creates, updates, deletes } = planMigration(targets, referrers);

  const byType = Object.fromEntries(TYPES.map((t) => [t, targets.filter((d) => d._type === t).length]));
  console.log(`dataset=${dataset} ${apply ? 'APPLY' : 'dry-run'}`);
  console.log(`a migrar: ${JSON.stringify(byType)} | referencias a repuntar en otros docs: ${updates.length}`);
  if (!creates.length) return console.log('Nada que migrar.');

  const tx = client.transaction();
  creates.forEach((doc) => tx.create(doc));
  updates.forEach((doc) => tx.createOrReplace(doc));
  deletes.forEach((id) => tx.delete(id));
  console.log(`transacción: ${creates.length} create, ${updates.length} replace, ${deletes.length} delete, ${(JSON.stringify(tx.serialize()).length / 1024).toFixed(0)} KB`);
  if (!apply) return console.log('Dry-run: no se escribió nada. Repite con --apply.');

  const result = await tx.commit({ visibility: 'sync' });
  console.log(`✅ commit ${result.transactionId}`);
}

if (process.argv[1]?.endsWith('migrate-private-ids.ts')) {
  main().catch((error) => {
    console.error('❌', error.message);
    process.exit(1);
  });
}
