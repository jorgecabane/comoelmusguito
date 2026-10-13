import { defineConfig, devices } from '@playwright/test';
import { E2E_PORT, E2E_URL, e2eServerEnv } from './e2e/env';

/**
 * E2E contra el dataset `test` de Sanity (nunca `production`, ver scripts/seed-e2e.ts).
 *
 * Roles (cada uno con su sesión guardada por e2e/auth.setup.ts):
 * - anon:     visitante sin sesión          → e2e/anon/**
 * - customer: cliente sin compras           → e2e/customer/**
 * - buyer:    cliente con cursos y pedidos  → e2e/buyer/**
 *
 * En CI el workflow ya hizo seed + build; en local el webServer hace todo.
 */
const chrome = devices['Desktop Chrome'];

export default defineConfig({
  testDir: './e2e',
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
      use: { ...chrome, storageState: '.auth/customer.json' },
      dependencies: ['setup'],
    },
    {
      name: 'buyer',
      testDir: './e2e/buyer',
      use: { ...chrome, storageState: '.auth/buyer.json' },
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
