/**
 * Ejecuta un comando con el mismo entorno que el servidor E2E (e2e/env.ts).
 * Uso: tsx scripts/e2e-env-run.ts "npm run e2e:seed && npm run build"
 */
import { execSync } from 'node:child_process';
import { e2eServerEnv } from '../e2e/env';

const command = process.argv[2];
if (!command) throw new Error('Falta el comando a ejecutar');
execSync(command, { stdio: 'inherit', env: { ...process.env, ...e2eServerEnv } });
