import { expect, test, type Page } from '@playwright/test';
import { BLOG_POST, COURSE, SUPPLY, TERRARIUM, TERRARIUM_SOLD_OUT, WORKSHOP, clp } from '../fixtures';

/** Navega y falla si la respuesta es >= 400 o si hubo excepciones JS no capturadas. */
async function visit(page: Page, path: string) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(path);
  expect(response?.status(), `status de ${path}`).toBeLessThan(400);
  return () => expect(errors, `errores JS en ${path}`).toEqual([]);
}

const PUBLIC_PAGES: Array<[path: string, h1: string | RegExp]> = [
  ['/terrarios', 'Ecosistemas Vivos'],
  ['/insumos', 'Insumos Profesionales'],
  ['/cursos', 'Aprende a Crear Terrarios'],
  ['/talleres', 'Talleres Presenciales'],
  ['/proyectos', 'Proyectos del Musguito'],
  ['/sobre', /Sobre el/],
  ['/faq', 'Preguntas Frecuentes'],
  ['/contacto', 'Contáctanos'],
  ['/envios', 'Envíos y Devoluciones'],
  ['/privacidad', 'Política de Privacidad'],
  ['/terminos', 'Términos y Condiciones'],
  ['/sustentabilidad', 'Nuestro Compromiso con la Sustentabilidad'],
];

test.describe('páginas públicas', () => {
  for (const [path, h1] of PUBLIC_PAGES) {
    test(`${path} carga sin errores`, async ({ page }) => {
      const assertNoErrors = await visit(page, path);
      await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
      assertNoErrors();
    });
  }

  test('home muestra las secciones con contenido sembrado', async ({ page }) => {
    const assertNoErrors = await visit(page, '/');
    // A11Y: la home no tiene <h1> (components/sections/home/HeroImmersive.tsx), solo el logo.
    await expect(page.getByRole('img', { name: 'comoelmusguito logo' }).first()).toBeVisible();
    for (const heading of [/^Cada Terrario/, /^Tú También Puedes/, /^Aprende con las/, /^Todo lo que Necesitas/, /^¿Qué Crearás/]) {
      await expect(page.getByRole('heading', { name: heading })).toBeAttached();
    }
    await expect(page.getByText(TERRARIUM.name).first()).toBeAttached();
    await expect(page.getByText(COURSE.name).first()).toBeAttached();
    await expect(page.getByText(WORKSHOP.name).first()).toBeAttached();
    assertNoErrors();
  });

  test('listados muestran el contenido sembrado y ocultan lo agotado', async ({ page }) => {
    await page.goto('/terrarios');
    await expect(page.getByRole('heading', { name: TERRARIUM.name })).toBeVisible();
    await expect(page.getByRole('heading', { name: TERRARIUM_SOLD_OUT.name })).toHaveCount(0);

    await page.goto('/insumos');
    await expect(page.getByText(SUPPLY.name).first()).toBeVisible();
    await page.goto('/cursos');
    await expect(page.getByText(COURSE.name).first()).toBeVisible();
    await page.goto('/talleres');
    await expect(page.getByText(WORKSHOP.name).first()).toBeVisible();
    await page.goto('/proyectos');
    await expect(page.getByText(BLOG_POST.name).first()).toBeVisible();
  });

  test('click en un terrario del listado abre su detalle', async ({ page }) => {
    await page.goto('/terrarios');
    await page.getByRole('link', { name: new RegExp(TERRARIUM.name) }).click();
    await expect(page).toHaveURL(`/terrarios/${TERRARIUM.slug}`);
  });
});

test.describe('páginas de detalle', () => {
  const DETAILS: Array<[path: string, name: string]> = [
    [`/terrarios/${TERRARIUM.slug}`, TERRARIUM.name],
    [`/terrarios/${TERRARIUM_SOLD_OUT.slug}`, TERRARIUM_SOLD_OUT.name],
    [`/insumos/${SUPPLY.slug}`, SUPPLY.name],
    [`/cursos/${COURSE.slug}`, COURSE.name],
    [`/talleres/${WORKSHOP.slug}`, WORKSHOP.name],
    [`/proyectos/${BLOG_POST.slug}`, BLOG_POST.name],
  ];

  for (const [path, name] of DETAILS) {
    test(`${path} muestra "${name}"`, async ({ page }) => {
      const assertNoErrors = await visit(page, path);
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
      assertNoErrors();
    });
  }

  test('terrario muestra precio y CTA de compra', async ({ page }) => {
    await page.goto(`/terrarios/${TERRARIUM.slug}`);
    await expect(page.getByText(clp(TERRARIUM.price)).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adoptar Terrario' })).toBeEnabled();
  });

  test('terrario agotado bloquea la compra', async ({ page }) => {
    await page.goto(`/terrarios/${TERRARIUM_SOLD_OUT.slug}`);
    await expect(page.getByRole('button', { name: 'Agotado', exact: true })).toBeDisabled();
  });

  test('curso muestra CTA de compra al visitante', async ({ page }) => {
    await page.goto(`/cursos/${COURSE.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: COURSE.name })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comenzar mi Viaje' }).first()).toBeEnabled();
    await expect(page.getByRole('heading', { name: 'Contenido del Curso' })).toBeVisible();
    // Los módulos son <details> cerrados para el visitante: se abren para ver las lecciones.
    for (const [m, titles] of COURSE.lessons.entries()) {
      await page.getByRole('heading', { name: new RegExp(`^Módulo ${m + 1}:`) }).click();
      for (const title of titles) await expect(page.getByRole('main').getByText(title, { exact: true })).toBeVisible();
    }
  });

  test('lección sin sesión redirige al curso pidiendo login', async ({ page }) => {
    await page.goto(`/cursos/${COURSE.slug}/leccion/0/0`);
    await expect(page).toHaveURL(new RegExp(`/cursos/${COURSE.slug}\\?requireAuth=true`));
    await expect(page.getByText('Inicia sesión para continuar')).toBeVisible();
  });
});

test.describe('404', () => {
  for (const path of ['/esta-ruta-no-existe', '/terrarios/no-existe-e2e', '/cursos/no-existe-e2e']) {
    test(`${path} responde 404 con página amigable`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { name: 'Página No Encontrada' })).toBeVisible();
      await page.getByRole('main').getByRole('link', { name: /Ir al Inicio/ }).click();
      await expect(page).toHaveURL('/');
    });
  }
});

test.describe('navegación', () => {
  test('header: links y menús desplegables', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');

    await header.getByRole('button', { name: 'Tienda' }).click();
    await header.getByRole('link', { name: 'Terrarios' }).click();
    await expect(page).toHaveURL('/terrarios');

    await header.getByRole('button', { name: 'Aprender' }).click();
    await header.getByRole('link', { name: 'Talleres' }).click();
    await expect(page).toHaveURL('/talleres');

    await header.getByRole('link', { name: 'Proyectos' }).click();
    await expect(page).toHaveURL('/proyectos');

    await header.getByRole('link', { name: /Carrito de compras/ }).click();
    await expect(page).toHaveURL('/carrito');

    await header.getByRole('link', { name: 'Iniciar Sesión' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('footer: links legales y de tienda', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    for (const [name, path] of [
      ['Preguntas Frecuentes', '/faq'],
      ['Envíos y Devoluciones', '/envios'],
      ['Insumos', '/insumos'],
      ['Contacto', '/contacto'],
    ]) {
      await footer.getByRole('link', { name, exact: true }).click();
      await expect(page).toHaveURL(path);
    }
  });

  test('FAQ: acordeón abre la respuesta', async ({ page }) => {
    await page.goto('/faq');
    await page.getByRole('button', { name: '¿Los terrarios son únicos?' }).click();
    await expect(page.getByText(/cada terrario es hecho a mano/)).toBeVisible();
  });
});

test('/studio monta Sanity Studio', async ({ page }) => {
  // Sin http://localhost:3100 en los CORS origins del proyecto Sanity, el Studio muestra su pantalla
  // "Connect this studio" en vez del login. Cualquiera de las dos prueba que el Studio montó.
  const response = await page.goto('/studio');
  expect(response?.status()).toBe(200);
  await expect(page.getByText(/Connect this studio to your project|Choose login provider/i).first()).toBeVisible({ timeout: 30_000 });
});
