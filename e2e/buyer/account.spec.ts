import { expect, test } from '@playwright/test';
import { COURSE, GIFT_COURSE, ORDERS, TERRARIUM, USERS, clp } from '../fixtures';
import { sanity } from '../helpers/sanity';

test.beforeEach(async ({ page }) => {
  await page.goto('/mi-cuenta');
  await expect(page.getByRole('heading', { name: `Hola, ${USERS.buyer.name}` })).toBeVisible();
});

test('feed muestra el curso comprado con progreso y el terrario', async ({ page }) => {
  await expect(page.getByRole('heading', { name: COURSE.name })).toBeVisible();
  await expect(page.getByText(/\d+% completado/).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: TERRARIUM.name })).toBeVisible();

  await page.getByRole('button', { name: /^Cursos \d+$/ }).click();
  await expect(page).toHaveURL('/mi-cuenta?filter=courses');
  await expect(page.getByRole('heading', { name: COURSE.name })).toBeVisible();
  await expect(page.getByRole('heading', { name: TERRARIUM.name })).toBeHidden();
});

test('la tarjeta del curso lleva a la lección', async ({ page }) => {
  await page.getByRole('link', { name: new RegExp(COURSE.name) }).click();
  await expect(page).toHaveURL(new RegExp(`/cursos/${COURSE.slug}/leccion/\\d+/\\d+`));
});

test('historial lista solo órdenes pagadas, con total y detalle', async ({ page }) => {
  await page.getByRole('button', { name: 'Ver Historial' }).click();
  await expect(page.getByRole('heading', { name: 'Historial de Pedidos' })).toBeVisible();

  const paid = page.getByRole('heading', { name: `Orden ${ORDERS.paid.orderId}` });
  await expect(paid).toBeVisible();
  await expect(page.getByText(clp(ORDERS.paid.total))).toBeVisible();
  await expect(page.getByText('✅ Confirmado')).toBeVisible();
  await expect(page.getByText(ORDERS.pending.orderId)).toHaveCount(0);
  await expect(page.getByText(ORDERS.gift.orderId)).toHaveCount(0); // regalo recibido, no comprado

  // Detalle del ítem con el snapshot guardado al momento de la compra.
  await page.getByRole('button', { name: new RegExp(COURSE.name) }).click();
  await expect(page.getByText(`Snapshot de ${COURSE.name}`)).toBeVisible();
  await expect(page.getByText('(Vista del producto al momento de compra)')).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Historial de Pedidos' })).toBeHidden();
});

test.describe('canjear regalo', () => {
  test.afterEach(async () => {
    // Deja el regalo como lo sembró e2e/global-setup.ts (por si el test se reintenta).
    await sanity.delete({
      query: `*[_type == "courseAccess" && user._ref == $user && course._ref == $course]`,
      params: { user: USERS.buyer.id, course: GIFT_COURSE.id },
    });
    await sanity.patch(ORDERS.gift.id).unset(['giftRedeemedAt', 'giftRedeemedBy']).commit();
  });

  test('canjea el regalo sembrado y no permite reusarlo', async ({ page }) => {
    const form = page.locator('form').filter({ has: page.getByLabel('Token de Regalo') });

    await page.getByRole('button', { name: 'Canjear Regalo' }).click();
    await form.getByLabel('Token de Regalo').fill(ORDERS.gift.token);
    // El canje encadena ~8 llamadas a Sanity (~5-6 s): se espera la respuesta en vez del timeout de expect.
    const redeemed = page.waitForResponse((r) => r.url().endsWith('/api/gifts/redeem'));
    await form.getByRole('button', { name: 'Canjear Regalo' }).click();
    expect((await redeemed).status()).toBe(200);
    await expect(page.getByText(/Regalo canjeado exitosamente/)).toBeVisible();

    // El modal recarga la página tras el canje: el curso regalado aparece en el feed.
    await expect(page.getByRole('heading', { name: GIFT_COURSE.name })).toBeVisible();

    await page.getByRole('button', { name: 'Canjear Regalo' }).click();
    await form.getByLabel('Token de Regalo').fill(ORDERS.gift.token);
    await form.getByRole('button', { name: 'Canjear Regalo' }).click();
    await expect(page.getByText('Este regalo ya fue canjeado anteriormente')).toBeVisible();
  });
});
