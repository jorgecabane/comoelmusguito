/**
 * Fixtures mutables de ESTA corrida (usuarios, pedidos, acceso al curso), con `_id` y emails
 * namespaced por E2E_RUN_ID (ver e2e/fixtures.ts). Los tests pueden mutarlos sin afectar a otras
 * corridas concurrentes; e2e/global-teardown.ts los borra al terminar.
 * También barre restos de corridas que murieron sin teardown (>24 h, nunca más recientes).
 */
import type { IdentifiedSanityDocumentStub } from '@sanity/client';
import bcrypt from 'bcryptjs';
import { E2E_RUN_ID } from './env';
import { BUYER_COURSE_ACCESS, COURSE, GIFT_COURSE, ORDERS, RUN_ID_PREFIX, SUPPLY, TERRARIUM, USERS } from './fixtures';
import { sanity } from './helpers/sanity';

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const ref = (id: string) => ({ _type: 'reference', _ref: id });

function orderItem(key: string, item: { id: string; slug: string; name: string; price: number }, type: string, quantity = 1) {
  return {
    _key: key,
    id: item.id,
    type,
    name: item.name,
    slug: item.slug,
    price: item.price,
    currency: 'CLP',
    quantity,
    snapshot: { image: '/images/placeholder.jpg', description: `Snapshot de ${item.name}` },
  };
}

async function user(u: (typeof USERS)[keyof typeof USERS]) {
  const now = new Date().toISOString();
  return {
    _id: u.id,
    _type: 'user',
    email: u.email,
    name: u.name,
    passwordHash: await bcrypt.hash(u.password, 10),
    provider: 'credentials',
    authMethods: ['credentials'],
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  };
}

async function runDocs(): Promise<IdentifiedSanityDocumentStub[]> {
  const { buyer } = USERS;
  return [
    await user(USERS.customer),
    await user(buyer),
    {
      _id: ORDERS.paid.id,
      _type: 'order',
      orderId: ORDERS.paid.orderId,
      flowOrder: '999001',
      customerEmail: buyer.email,
      customerName: buyer.name,
      userId: ref(buyer.id),
      items: [orderItem('course', COURSE, 'course'), { ...orderItem('terr', TERRARIUM, 'terrarium'), shippingPreference: 'pickup' }],
      total: ORDERS.paid.total,
      currency: 'CLP',
      paymentStatus: 2,
      paymentDate: '2025-09-01T15:05:00.000Z',
      paymentProvider: 'flow',
      createdAt: '2025-09-01T15:00:00.000Z',
      updatedAt: '2025-09-01T15:05:00.000Z',
      emailSent: true,
      isGift: false,
      requiresShipping: false,
    },
    {
      _id: ORDERS.pending.id,
      _type: 'order',
      orderId: ORDERS.pending.orderId,
      customerEmail: buyer.email,
      customerName: buyer.name,
      userId: ref(buyer.id),
      items: [orderItem('supply', SUPPLY, 'supply', 2)],
      total: ORDERS.pending.total,
      currency: 'CLP',
      paymentStatus: 1,
      paymentProvider: 'flow',
      createdAt: '2025-10-01T15:00:00.000Z',
      updatedAt: '2025-10-01T15:00:00.000Z',
      isGift: false,
      requiresShipping: false,
    },
    {
      // Regalo pagado por alguien sin cuenta, para el buyer, sin canjear.
      _id: ORDERS.gift.id,
      _type: 'order',
      orderId: ORDERS.gift.orderId,
      customerEmail: 'amigo@e2e.test',
      customerName: 'Amigo E2E',
      items: [orderItem('course', GIFT_COURSE, 'course')],
      total: GIFT_COURSE.price,
      currency: 'CLP',
      paymentStatus: 2,
      paymentDate: '2025-09-15T12:00:00.000Z',
      paymentProvider: 'flow',
      createdAt: '2025-09-15T11:55:00.000Z',
      updatedAt: '2025-09-15T12:00:00.000Z',
      isGift: true,
      recipientEmail: buyer.email,
      recipientName: buyer.name,
      giftMessage: '¡Que lo disfrutes!',
      giftToken: ORDERS.gift.token,
      requiresShipping: false,
    },
    {
      _id: BUYER_COURSE_ACCESS.id,
      _type: 'courseAccess',
      user: ref(buyer.id),
      course: ref(COURSE.id),
      order: ref(ORDERS.paid.id),
      accessGrantedAt: '2025-09-01T15:05:00.000Z',
      progress: { ...BUYER_COURSE_ACCESS.initialProgress, lastWatchedAt: '2025-09-02T10:00:00.000Z', totalWatchTime: 5 },
    },
  ];
}

/**
 * Borra los docs por corrida con `_id` que empieza por `prefix` (y los accesos que la app crea
 * para sus usuarios al canjear el regalo). `before` limita a los creados antes de esa fecha.
 */
export async function deleteRunDocs(prefix: string, before?: string) {
  await sanity.delete({
    query: `*[
      (string::startsWith(_id, $prefix) || (_type == "courseAccess" && string::startsWith(user._ref, $prefix)))
      && (!defined($before) || _createdAt < $before)
    ]`,
    params: { prefix, before: before ?? null },
  });
}

export default async function globalSetup() {
  const before = new Date(Date.now() - STALE_AFTER_MS).toISOString();
  await deleteRunDocs(RUN_ID_PREFIX, before);
  // Usuarios/suscriptores de un solo uso (uniqueEmail) que un test caído no alcanzó a limpiar.
  await sanity.delete({
    query: `*[_type in ["user", "newsletterSubscriber"] && string::startsWith(email, "e2e+") && _createdAt < $before]`,
    params: { before },
  });

  const tx = sanity.transaction();
  for (const doc of await runDocs()) tx.createOrReplace(doc);
  await tx.commit();
  console.log(`✅ e2e: fixtures de la corrida ${E2E_RUN_ID} creados`);
}
