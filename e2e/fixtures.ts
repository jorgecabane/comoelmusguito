/**
 * Datos de prueba. Los specs importan de aquí en vez de hardcodear.
 *
 * - Catálogo (productos, cursos, taller, blog): `_id` fijos `e2e-`, compartidos por todas las
 *   corridas y sembrados por scripts/seed-e2e.ts. Los tests solo los LEEN.
 * - Por corrida (USERS, ORDERS, BUYER_COURSE_ACCESS): `_id` `private.e2e-run-<runId>-…` (privados, como en producción) y emails con el
 *   runId, creados por e2e/global-setup.ts y borrados en e2e/global-teardown.ts. Son los únicos
 *   fixtures que un test puede mutar.
 */
import { E2E_RUN_ID } from './env';

export const RUN_ID_PREFIX = 'private.e2e-run-';
const runId = (name: string) => `${RUN_ID_PREFIX}${E2E_RUN_ID}-${name}`;

export const USERS = {
  customer: {
    id: runId('user-customer'),
    email: `customer+${E2E_RUN_ID}@e2e.test`,
    password: 'Customer-e2e-123',
    name: 'Cliente E2E',
  },
  buyer: {
    id: runId('user-buyer'),
    email: `buyer+${E2E_RUN_ID}@e2e.test`,
    password: 'Buyer-e2e-123',
    name: 'Comprador E2E',
  },
} as const;

export const TERRARIUM = {
  id: 'e2e-terrarium-available',
  slug: 'e2e-terrario-bosque',
  name: 'Terrario E2E Bosque',
  price: 45000,
  stock: 3,
} as const;

export const TERRARIUM_SOLD_OUT = {
  id: 'e2e-terrarium-soldout',
  slug: 'e2e-terrario-agotado',
  name: 'Terrario E2E Agotado',
  price: 39000,
} as const;

export const SUPPLY = {
  id: 'e2e-supply-sustrato',
  slug: 'e2e-sustrato-premium',
  name: 'Sustrato E2E Premium',
  price: 8990,
} as const;

export const COURSE = {
  id: 'e2e-course',
  slug: 'e2e-curso-terrarios',
  name: 'Curso E2E Terrarios',
  price: 29990,
  /** [módulo][lección] → título */
  lessons: [['Bienvenida', 'Materiales'], ['Armado paso a paso']],
} as const;

export const GIFT_COURSE = {
  id: 'e2e-course-gift',
  slug: 'e2e-curso-regalo',
  name: 'Curso E2E Regalo',
  price: 19990,
} as const;

export const WORKSHOP = {
  id: 'e2e-workshop',
  slug: 'e2e-taller-musgos',
  name: 'Taller E2E Musgos',
  price: 35000,
  openSpots: 4,
} as const;

export const BLOG_POST = {
  id: 'e2e-blog-post',
  slug: 'e2e-proyecto-jardin',
  name: 'Proyecto E2E Jardín Vertical',
} as const;

const RUN_TAG = E2E_RUN_ID.replace(/[^a-z0-9]/gi, '').toUpperCase(); // el token de regalo solo admite [A-Z0-9]

export const ORDERS = {
  paid: { id: runId('order-paid'), orderId: `E2E-${RUN_TAG}-PAID`, total: COURSE.price + TERRARIUM.price },
  pending: { id: runId('order-pending'), orderId: `E2E-${RUN_TAG}-PENDING`, total: SUPPLY.price * 2 },
  gift: { id: runId('order-gift'), orderId: `E2E-${RUN_TAG}-GIFT`, token: `GIFT-${RUN_TAG}-0123456789ABCDEF` },
} as const;

export const BUYER_COURSE_ACCESS = {
  id: runId('access-buyer-course'),
  initialProgress: { completedLessons: ['0-0'], lastWatched: '0-0' },
} as const;

/** Formato de precio de la app (lib/sanity/utils.ts formatPrice). */
export const clp = (amount: number) => `$${amount.toLocaleString('es-CL')} CLP`;
