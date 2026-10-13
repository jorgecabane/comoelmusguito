/**
 * Datos fijos que siembra scripts/seed-e2e.ts. Los specs importan de aquí en vez de hardcodear.
 * Todos los `_id` llevan prefijo `e2e-` para que el seed sea idempotente (createOrReplace).
 */
export const USERS = {
  customer: {
    id: 'e2e-user-customer',
    email: 'customer@e2e.test',
    password: 'Customer-e2e-123',
    name: 'Cliente E2E',
  },
  buyer: {
    id: 'e2e-user-buyer',
    email: 'buyer@e2e.test',
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

export const ORDERS = {
  paid: { id: 'e2e-order-paid', orderId: 'E2E-ORD-PAID', total: COURSE.price + TERRARIUM.price },
  pending: { id: 'e2e-order-pending', orderId: 'E2E-ORD-PENDING', total: SUPPLY.price * 2 },
  gift: { id: 'e2e-order-gift', orderId: 'E2E-ORD-GIFT', token: 'GIFT-E2E1-0123456789ABCDEF' },
} as const;

export const BUYER_COURSE_ACCESS = {
  id: 'e2e-access-buyer-course',
  initialProgress: { completedLessons: ['0-0'], lastWatched: '0-0' },
} as const;

/** Formato de precio de la app (lib/sanity/utils.ts formatPrice). */
export const clp = (amount: number) => `$${amount.toLocaleString('es-CL')} CLP`;
