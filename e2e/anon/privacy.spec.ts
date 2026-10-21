import { expect, test } from '@playwright/test';
import { E2E_DATASET } from '../env';
import { ORDERS, USERS } from '../fixtures';
import { sanity } from '../helpers/sanity'; // también carga .env.local (project id)

// El dataset es público (plan free): usuarios y pedidos solo quedan ocultos si su `_id` tiene un
// punto (`private.…`). Se miran solo los docs de esta corrida: el dataset `test` lo comparten
// corridas concurrentes de otras ramas. Ver scripts/migrate-private-ids.ts.
test('usuarios y pedidos no son legibles sin token', async ({ request }) => {
  const ids = [...Object.values(USERS), ...Object.values(ORDERS)].map((d) => d.id);
  const query = 'count(*[_id in $ids])';
  expect(await sanity.fetch<number>(query, { ids }), 'existen con token').toBe(ids.length);

  const url = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${E2E_DATASET}`;
  const response = await request.get(url, { params: { query, $ids: JSON.stringify(ids) } });
  expect(response.ok()).toBe(true);
  expect((await response.json()).result, 'visibles sin token').toBe(0);
});
