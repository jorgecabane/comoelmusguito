import { rm } from 'node:fs/promises';
import { E2E_RUN_ID } from './env';
import { RUN_ID_PREFIX } from './fixtures';
import { deleteRunDocs } from './global-setup';

/** Borra solo los fixtures de esta corrida; los de corridas concurrentes quedan intactos. */
export default async function globalTeardown() {
  await deleteRunDocs(`${RUN_ID_PREFIX}${E2E_RUN_ID}-`);
  await rm(`.auth/${E2E_RUN_ID}`, { recursive: true, force: true });
}
