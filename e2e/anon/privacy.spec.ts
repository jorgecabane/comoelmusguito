import { expect, test } from '@playwright/test';
import { E2E_DATASET } from '../env';
import '../helpers/sanity'; // carga .env.local (project id)

// El dataset es público (plan free): usuarios, pedidos y suscriptores solo quedan ocultos
// si su `_id` tiene un punto (`private.…`). Ver scripts/migrate-private-ids.ts.
test('usuarios, pedidos y suscriptores no son legibles sin token', async ({ request }) => {
  const query = 'count(*[_type in ["user", "order", "newsletterSubscriber"]])';
  const url = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${E2E_DATASET}`;
  const response = await request.get(url, { params: { query } });
  expect(response.ok()).toBe(true);
  expect((await response.json()).result).toBe(0);
});
