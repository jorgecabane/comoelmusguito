/**
 * Acceso directo al dataset `test` desde los specs: leer tokens que la app escribe
 * (verificación, reset), crear usuarios de un solo uso y limpiar lo que crea cada test.
 */
import { createClient } from '@sanity/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { E2E_DATASET } from '../env';

config({ path: '.env.local', quiet: true });

export const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: E2E_DATASET, // nunca production, independiente de .env.local
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: 'published',
});

export function uniqueEmail(tag = 'user') {
  return `e2e+${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@e2e.test`;
}

export interface TestUser {
  _id: string;
  email: string;
  name?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
}

export function getUserByEmail(email: string) {
  return sanity.fetch<TestUser | null>(`*[_type == "user" && email == $email][0]`, { email });
}

/** Usuario verificado con contraseña, igual a como lo deja lib/auth/sanity-adapter.ts. */
export async function createVerifiedUser(email: string, password: string) {
  const now = new Date().toISOString();
  return sanity.create({
    _id: `private.e2e-${crypto.randomUUID()}`,
    _type: 'user',
    email,
    name: 'Usuario Temporal E2E',
    passwordHash: await bcrypt.hash(password, 10),
    provider: 'credentials',
    authMethods: ['credentials'],
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteUserByEmail(email: string) {
  await sanity.delete({ query: `*[_type == "user" && email == $email]`, params: { email } });
}
