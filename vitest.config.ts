import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: { 'server-only': path.resolve(__dirname, 'test/stubs/server-only.ts') },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', 'e2e/**', '.next/**'],
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'text', 'lcov'],
      // Toda la lógica de servidor y dominio. Páginas y componentes se cubren con E2E.
      include: ['lib/**/*.{ts,tsx}', 'app/api/**/*.{ts,tsx}', 'sanity/lib/**/*.ts', 'middleware.ts'],
      exclude: [
        '**/*.test.*',
        '**/*.d.ts',
        '**/types.ts',
        '**/index.ts', // barrels de re-export
        'lib/mock/**', // datos de ejemplo, no lógica
        'app/api/og/**', // render de imagen con @vercel/og, se valida visualmente
      ],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
