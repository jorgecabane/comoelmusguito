import { defineConfig, devices } from '@playwright/test';
import { E2E_PORT, E2E_URL, authFile, e2eServerEnv } from './e2e/env';

/**
 * E2E contra el dataset `test` de Sanity (nunca `production`, ver scripts/seed-e2e.ts).
 *
 * Roles (cada uno con su sesión guardada por e2e/auth.setup.ts):
 * - anon:     visitante sin sesión          → e2e/anon/**
 * - customer: cliente sin compras           → e2e/customer/**
 * - buyer:    cliente con cursos y pedidos  → e2e/buyer/**
 *
 * En CI el workflow ya hizo seed + build; en local el webServer hace todo.
 * Fixtures por corrida (E2E_RUN_ID, ver e2e/env.ts): global-setup los crea, global-teardown los borra.
 * Así varias corridas comparten el dataset en paralelo sin pisarse.
 */
const chrome = devices['Desktop Chrome'];

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: E2E_URL, trace: 'on-first-retry', locale: 'es-CL', timezoneId: 'America/Santiago' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'anon', testDir: './e2e/anon', testIgnore: /\.mobile\.spec\.ts/, use: chrome },
    { name: 'mobile', testDir: './e2e/anon', testMatch: /\.mobile\.spec\.ts/, use: devices['Pixel 7'] },
    {
      name: 'customer',
      testDir: './e2e/customer',
      use: { ...chrome, storageState: authFile('customer') },
      dependencies: ['setup'],
    },
    {
      name: 'buyer',
      testDir: './e2e/buyer',
      use: { ...chrome, storageState: authFile('buyer') },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: process.env.CI
      ? `npm run start -- -p ${E2E_PORT}`
      : `npm run e2e:seed && npm run build && npm run start -- -p ${E2E_PORT}`,
    url: E2E_URL,
    env: e2eServerEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
  },
});
