/**
 * Entorno del servidor bajo prueba. Se aplica al seed, al build y al start.
 * Fuerza el dataset `test` y vacía las integraciones externas: sin emails (Resend),
 * sin reCAPTCHA, sin rate-limit (Upstash) y Flow/PayPal en sandbox sin credenciales.
 */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_URL = `http://localhost:${E2E_PORT}`;
export const E2E_DATASET = 'test';

export const e2eServerEnv: Record<string, string> = {
  NEXT_PUBLIC_SANITY_DATASET: E2E_DATASET,
  NEXTAUTH_URL: E2E_URL,
  NEXT_PUBLIC_SITE_URL: E2E_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? 'e2e-only-secret-not-for-production',
  REQUIRE_EMAIL_VERIFICATION: 'true',
  RESEND_API_KEY: '',
  RECAPTCHA_SECRET_KEY: '',
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: '',
  UPSTASH_REDIS_REST_URL: '',
  UPSTASH_REDIS_REST_TOKEN: '',
  FLOW_ENV: 'sandbox',
  FLOW_API_KEY: '',
  FLOW_SECRET_KEY: '',
  PAYPAL_CLIENT_ID: '',
  PAYPAL_CLIENT_SECRET: '',
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: '',
  GOOGLE_CLIENT_ID: '',
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
};
