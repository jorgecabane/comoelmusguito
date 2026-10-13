/**
 * Seed idempotente del dataset `test` para los E2E (npm run e2e:seed).
 * Usa `_id` fijos con prefijo `e2e-` + createOrReplace: no borra el dataset (CI y local lo comparten).
 * Re-sembrar también "des-canjea" el regalo y restaura el progreso del curso del buyer.
 */
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createClient, type IdentifiedSanityDocumentStub } from '@sanity/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import {
  BLOG_POST,
  BUYER_COURSE_ACCESS,
  COURSE,
  GIFT_COURSE,
  ORDERS,
  SUPPLY,
  TERRARIUM,
  TERRARIUM_SOLD_OUT,
  USERS,
  WORKSHOP,
} from '../e2e/fixtures';

config({ path: '.env.local', quiet: true }); // sin override: e2e/env.ts ya fijó el dataset

if (process.env.NEXT_PUBLIC_SANITY_DATASET !== 'test') {
  throw new Error(
    `seed-e2e: NEXT_PUBLIC_SANITY_DATASET="${process.env.NEXT_PUBLIC_SANITY_DATASET}". ` +
      'Solo se permite sembrar el dataset "test". Corre vía `npm run e2e` o `tsx scripts/e2e-env-run.ts`.',
  );
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: 'test',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const DAY = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY).toISOString();
const ref = (id: string) => ({ _type: 'reference', _ref: id });
const block = (key: string, text: string, style = 'normal') => ({
  _type: 'block',
  _key: key,
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-s`, text, marks: [] }],
});

async function uploadPlaceholder() {
  const file = path.join(process.cwd(), 'public/images/placeholder.jpg');
  // Sanity deduplica por hash: re-subir devuelve el mismo asset.
  const asset = await client.assets.upload('image', createReadStream(file), { filename: 'e2e-placeholder.jpg' });
  // `key` solo para imágenes dentro de arrays.
  return (alt: string, key?: string) => ({ _type: 'image', ...(key && { _key: key }), asset: ref(asset._id), alt });
}

function lesson(key: string, title: string, order: number, isFree = false) {
  return {
    _type: 'lesson',
    _key: key,
    title,
    description: `Lección de prueba: ${title}`,
    duration: 5,
    videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    videoProvider: 'youtube',
    isFree,
    order,
  };
}

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

async function buildDocs(): Promise<IdentifiedSanityDocumentStub[]> {
  const image = await uploadPlaceholder();
  const now = new Date().toISOString();
  const [customerHash, buyerHash] = await Promise.all([
    bcrypt.hash(USERS.customer.password, 10),
    bcrypt.hash(USERS.buyer.password, 10),
  ]);

  const terrariumBase = {
    _type: 'terrarium',
    description: 'Terrario cerrado con musgo nativo, sembrado para pruebas E2E.',
    longDescription: [block('t1', 'Un ecosistema autosustentable de prueba.')],
    currency: 'CLP',
    size: 'small',
    category: 'bosque',
    plants: ['Musgo', 'Helecho'],
    careLevel: 'easy',
    lightRequirement: 'medium',
    shippingAvailable: true,
    localPickupOnly: false,
  };

  const user = (u: (typeof USERS)[keyof typeof USERS], passwordHash: string) => ({
    _id: u.id,
    _type: 'user',
    email: u.email,
    name: u.name,
    passwordHash,
    provider: 'credentials',
    authMethods: ['credentials'],
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  });

  return [
    {
      ...terrariumBase,
      _id: TERRARIUM.id,
      name: TERRARIUM.name,
      slug: { _type: 'slug', current: TERRARIUM.slug },
      images: [image(TERRARIUM.name, 'i1'), image(`${TERRARIUM.name} detalle`, 'i2')],
      price: TERRARIUM.price,
      inStock: true,
      stock: TERRARIUM.stock,
      featured: true,
      order: -100,
    },
    {
      ...terrariumBase,
      _id: TERRARIUM_SOLD_OUT.id,
      name: TERRARIUM_SOLD_OUT.name,
      slug: { _type: 'slug', current: TERRARIUM_SOLD_OUT.slug },
      images: [image(TERRARIUM_SOLD_OUT.name, 'i1'), image(`${TERRARIUM_SOLD_OUT.name} detalle`, 'i2')],
      price: TERRARIUM_SOLD_OUT.price,
      inStock: false,
      stock: 0,
      featured: false,
      order: -99,
    },
    {
      _id: SUPPLY.id,
      _type: 'supply',
      name: SUPPLY.name,
      slug: { _type: 'slug', current: SUPPLY.slug },
      description: 'Sustrato drenante para terrarios cerrados.',
      category: 'sustrato',
      images: [image(SUPPLY.name, 'i1')],
      price: SUPPLY.price,
      currency: 'CLP',
      inStock: true,
      stock: 50,
      brand: 'Musguito',
      weight: 1,
      shippingAvailable: true,
      localPickupOnly: false,
      featured: true,
      order: -100,
    },
    {
      _id: COURSE.id,
      _type: 'course',
      name: COURSE.name,
      slug: { _type: 'slug', current: COURSE.slug },
      shortDescription: 'Aprende a crear tu primer terrario cerrado paso a paso.',
      longDescription: [block('c1', 'Curso sembrado para pruebas E2E.')],
      thumbnail: image(COURSE.name),
      priceCLP: COURSE.price,
      priceUSD: 35,
      currency: 'CLP',
      level: 'beginner',
      duration: 1,
      lessonCount: 3,
      modules: COURSE.lessons.map((titles, m) => ({
        _type: 'module',
        _key: `m${m}`,
        title: m === 0 ? 'Fundamentos' : 'Montaje',
        order: m + 1,
        lessons: titles.map((title, l) => lesson(`m${m}l${l}`, title, l + 1, m === 0 && l === 0)),
      })),
      learningOutcomes: ['Elegir el frasco', 'Armar capas de sustrato', 'Mantener el ecosistema'],
      requirements: ['Ganas de aprender'],
      instructor: { name: 'Tomás Barrera', bio: 'Artista de terrarios.' },
      accessType: 'lifetime',
      certificate: true,
      published: true,
      featured: true,
      order: -100,
    },
    {
      _id: GIFT_COURSE.id,
      _type: 'course',
      name: GIFT_COURSE.name,
      slug: { _type: 'slug', current: GIFT_COURSE.slug },
      shortDescription: 'Curso que el buyer recibe como regalo en los E2E.',
      thumbnail: image(GIFT_COURSE.name),
      priceCLP: GIFT_COURSE.price,
      priceUSD: 25,
      currency: 'CLP',
      level: 'intermediate',
      duration: 1,
      lessonCount: 1,
      modules: [{ _type: 'module', _key: 'm0', title: 'Único módulo', order: 1, lessons: [lesson('m0l0', 'Introducción', 1)] }],
      learningOutcomes: ['Uno', 'Dos', 'Tres'],
      published: true,
      featured: false,
      order: -99,
    },
    {
      _id: WORKSHOP.id,
      _type: 'workshop',
      name: WORKSHOP.name,
      slug: { _type: 'slug', current: WORKSHOP.slug },
      description: 'Taller presencial de terrarios con musgo nativo.',
      images: [image(WORKSHOP.name, 'i1')],
      // La fecha llena es la más próxima: la UI debe saltarla y preseleccionar la siguiente.
      dates: [
        { _type: 'workshopDate', _key: 'full', date: inDays(20), spotsAvailable: 0, spotsTotal: 8, status: 'sold_out' },
        { _type: 'workshopDate', _key: 'open', date: inDays(30), spotsAvailable: WORKSHOP.openSpots, spotsTotal: 8, status: 'available' },
      ],
      location: { venue: 'Estudio Musguito', address: 'Av. Providencia 123', city: 'Santiago', region: 'Región Metropolitana' },
      price: WORKSHOP.price,
      currency: 'CLP',
      duration: 3,
      level: 'all',
      includes: ['Materiales', 'Café'],
      learningOutcomes: ['Uno', 'Dos', 'Tres'],
      cancellationPolicy: 'Reembolso hasta 48 horas antes.',
      published: true,
      featured: true,
      order: -100,
    },
    {
      _id: BLOG_POST.id,
      _type: 'blogPost',
      name: BLOG_POST.name,
      slug: { _type: 'slug', current: BLOG_POST.slug },
      excerpt: 'Un jardín vertical de musgo para una oficina en Santiago.',
      content: [block('b1', 'El desafío', 'h2'), block('b2', 'Diseñamos un muro verde con musgo preservado.')],
      featuredImage: image(BLOG_POST.name),
      projectDate: '2025-06-01',
      location: 'Santiago',
      tags: ['musgo', 'oficina'],
      published: true,
      featured: true,
      order: -100,
    },
    user(USERS.customer, customerHash),
    user(USERS.buyer, buyerHash),
    {
      _id: ORDERS.paid.id,
      _type: 'order',
      orderId: ORDERS.paid.orderId,
      flowOrder: '999001',
      customerEmail: USERS.buyer.email,
      customerName: USERS.buyer.name,
      userId: ref(USERS.buyer.id),
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
      customerEmail: USERS.buyer.email,
      customerName: USERS.buyer.name,
      userId: ref(USERS.buyer.id),
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
      // Regalo pagado por alguien sin cuenta, para el buyer. createOrReplace lo deja sin canjear.
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
      recipientEmail: USERS.buyer.email,
      recipientName: USERS.buyer.name,
      giftMessage: '¡Que lo disfrutes!',
      giftToken: ORDERS.gift.token,
      requiresShipping: false,
    },
    {
      _id: BUYER_COURSE_ACCESS.id,
      _type: 'courseAccess',
      user: ref(USERS.buyer.id),
      course: ref(COURSE.id),
      order: ref(ORDERS.paid.id),
      accessGrantedAt: '2025-09-01T15:05:00.000Z',
      progress: { ...BUYER_COURSE_ACCESS.initialProgress, lastWatchedAt: '2025-09-02T10:00:00.000Z', totalWatchTime: 5 },
    },
  ];
}

async function main() {
  const docs = await buildDocs();
  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(doc);
  await tx.commit();

  // Restos de corridas anteriores: acceso creado al canjear el regalo y usuarios/suscriptores
  // de un solo uso con más de 1 hora (no tocar los de una corrida concurrente).
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await client.delete({
    query: `*[
      (_type == "courseAccess" && user._ref == $buyer && course._ref == $giftCourse) ||
      (_type in ["user", "newsletterSubscriber"] && string::startsWith(email, "e2e+") && _createdAt < $cutoff)
    ]`,
    params: { buyer: USERS.buyer.id, giftCourse: GIFT_COURSE.id, cutoff },
  });

  console.log(`✅ seed-e2e: ${docs.length} documentos en dataset "test"`);
}

main().catch((error) => {
  console.error('❌ seed-e2e falló:', error);
  process.exit(1);
});
