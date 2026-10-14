/**
 * Seed idempotente del CATÁLOGO E2E en el dataset `test` (npm run e2e:seed), antes del build.
 * Varias corridas (CI + locales) comparten el dataset: cada doc lleva `seedHash` de su contenido y
 * solo se reescribe si cambió, así re-sembrar no altera lo que lee una corrida concurrente.
 * Los fixtures mutables (usuarios, pedidos, accesos) son por corrida: ver e2e/global-setup.ts.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { createClient, type IdentifiedSanityDocumentStub } from '@sanity/client';
import { config } from 'dotenv';
import { BLOG_POST, COURSE, GIFT_COURSE, SUPPLY, TERRARIUM, TERRARIUM_SOLD_OUT, WORKSHOP } from '../e2e/fixtures';

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

async function buildDocs(): Promise<IdentifiedSanityDocumentStub[]> {
  const image = await uploadPlaceholder();

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
      // Fechas fijas (no relativas a "ahora") para que el contenido, y su seedHash, sea estable.
      dates: [
        { _type: 'workshopDate', _key: 'full', date: '2099-03-10T15:00:00.000Z', spotsAvailable: 0, spotsTotal: 8, status: 'sold_out' },
        { _type: 'workshopDate', _key: 'open', date: '2099-03-20T15:00:00.000Z', spotsAvailable: WORKSHOP.openSpots, spotsTotal: 8, status: 'available' },
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
  ];
}

const seedHash = (doc: IdentifiedSanityDocumentStub) => createHash('sha256').update(JSON.stringify(doc)).digest('hex');

async function main() {
  const docs = (await buildDocs()).map((doc) => ({ ...doc, seedHash: seedHash(doc) }));
  const current = await client.fetch<{ _id: string; seedHash?: string }[]>(`*[_id in $ids]{ _id, seedHash }`, {
    ids: docs.map((d) => d._id),
  });
  const upToDate = new Set(current.filter((c) => docs.some((d) => d._id === c._id && d.seedHash === c.seedHash)).map((c) => c._id));
  const changed = docs.filter((d) => !upToDate.has(d._id));

  if (changed.length) {
    const tx = client.transaction();
    for (const doc of changed) tx.createOrReplace(doc);
    await tx.commit();
  }
  console.log(`✅ seed-e2e: catálogo al día (${changed.length}/${docs.length} documentos escritos) en dataset "test"`);
}

main().catch((error) => {
  console.error('❌ seed-e2e falló:', error);
  process.exit(1);
});
