/**
 * Script: Backfill authMethods en documentos de usuario
 *
 * Para cada user en Sanity, setea authMethods basándose en:
 *   - El campo legacy `provider` (credentials | google)
 *   - La presencia de `passwordHash` (implica que 'credentials' está habilitado)
 *
 * Es idempotente: si `authMethods` ya está poblado no vacío, omite.
 *
 * Uso: npm run script:backfill-auth-methods
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

type AuthMethod = 'credentials' | 'google';

interface UserDoc {
  _id: string;
  email?: string;
  provider?: string;
  passwordHash?: string;
  authMethods?: string[];
}

async function main() {
  console.log('🚀 Backfill de authMethods iniciado\n');

  const { createClient } = await import('@sanity/client');

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
  });

  const users = await client.fetch<UserDoc[]>(
    `*[_type == "user"]{ _id, email, provider, passwordHash, authMethods }`
  );

  console.log(`📋 Total usuarios: ${users.length}\n`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    if (Array.isArray(user.authMethods) && user.authMethods.length > 0) {
      skipped++;
      continue;
    }

    const methods = new Set<AuthMethod>();
    if (user.provider === 'google' || user.provider === 'credentials') {
      methods.add(user.provider);
    }
    if (user.passwordHash) {
      methods.add('credentials');
    }

    if (methods.size === 0) {
      console.warn(`⚠️  Usuario ${user.email ?? user._id} sin provider ni passwordHash. Saltando.`);
      skipped++;
      continue;
    }

    await client
      .patch(user._id)
      .set({
        authMethods: Array.from(methods),
        updatedAt: new Date().toISOString(),
      })
      .commit();

    updated++;
    console.log(`✅ ${user.email ?? user._id} → [${Array.from(methods).join(', ')}]`);
  }

  console.log(`\n✨ Listo. Actualizados: ${updated} · Omitidos: ${skipped} · Total: ${users.length}`);
}

main().catch((err) => {
  console.error('❌ Error en backfill:', err);
  process.exit(1);
});
