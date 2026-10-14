import { expect, test, type Page } from '@playwright/test';
import { COURSE, ORDERS, TERRARIUM, USERS } from '../fixtures';
import { seedCart, terrariumCartItem } from '../helpers/ui';

const giftForm = (page: Page) => page.locator('form').filter({ has: page.getByLabel('Token de Regalo') });

test.describe('mi cuenta (sin compras)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mi-cuenta');
    await expect(page.getByRole('heading', { name: `Hola, ${USERS.customer.name}` })).toBeVisible();
  });

  test('feed y filtros muestran estados vacíos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'No hay items para mostrar' })).toBeVisible();
    for (const [filter, empty, param] of [
      ['Cursos', 'No tienes cursos aún', 'courses'],
      ['Talleres', 'No tienes talleres aún', 'workshops'],
      ['Terrarios', 'No tienes terrarios aún', 'terrariums'],
      ['Insumos', 'No tienes insumos aún', 'supplies'],
    ]) {
      await page.getByRole('button', { name: new RegExp(`^${filter} 0$`) }).click();
      await expect(page.getByText(empty)).toBeVisible();
      await expect(page).toHaveURL(`/mi-cuenta?filter=${param}`);
    }
  });

  test('historial de pedidos vacío (diálogo accesible)', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Ver Historial' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Historial de Pedidos' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByText('Aún no tienes pedidos confirmados')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeFocused();
    // Tab queda atrapado: el único enfocable sigue con el foco.
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('canjear regalo es un diálogo que cierra con Escape y devuelve el foco', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Canjear Regalo' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Canjear Regalo' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Token de Regalo')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('canjear regalo: formato inválido', async ({ page }) => {
    await page.getByRole('button', { name: 'Canjear Regalo' }).click();
    await giftForm(page).getByLabel('Token de Regalo').fill('NO-ES-UN-TOKEN');
    await giftForm(page).getByRole('button', { name: 'Canjear Regalo' }).click();
    await expect(page.getByText('Token de regalo inválido')).toBeVisible();
  });

  test('canjear regalo: token con formato válido pero inexistente', async ({ page }) => {
    await page.getByRole('button', { name: 'Canjear Regalo' }).click();
    await giftForm(page).getByLabel('Token de Regalo').fill('GIFT-NOPE-FFFFFFFFFFFFFFFF');
    await giftForm(page).getByRole('button', { name: 'Canjear Regalo' }).click();
    await expect(page.getByText('Regalo no encontrado o pago no confirmado')).toBeVisible();
    await giftForm(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.getByLabel('Token de Regalo')).toBeHidden();
  });

  test('cerrar sesión', async ({ page }) => {
    await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Iniciar Sesión' })).toBeVisible();
    await page.goto('/mi-cuenta');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

test.describe('cursos sin compra', () => {
  test('no puede abrir lecciones de un curso que no compró', async ({ page }) => {
    await page.goto(`/cursos/${COURSE.slug}/leccion/0/0`);
    await expect(page).toHaveURL(new RegExp(`/cursos/${COURSE.slug}\\?requireAccess=true`));
    await expect(page.getByText('Acceso Requerido', { exact: true })).toBeVisible();
  });

  test('el detalle del curso ofrece comprarlo (no redirige a lecciones)', async ({ page }) => {
    await page.goto(`/cursos/${COURSE.slug}`);
    await expect(page.getByRole('button', { name: 'Comenzar mi Viaje' }).first()).toBeVisible();
    await expect(page).toHaveURL(`/cursos/${COURSE.slug}`);
  });

  test('progreso de un curso ajeno es rechazado por la API', async ({ request }) => {
    const response = await request.post('/api/courses/progress', { data: { courseId: COURSE.id, lessonId: '0-0' } });
    expect(response.status()).toBe(403);
  });

  test('el historial no muestra órdenes de otros usuarios', async ({ page }) => {
    await page.goto('/mi-cuenta');
    await page.getByRole('button', { name: 'Ver Historial' }).click();
    await expect(page.getByText(ORDERS.paid.orderId)).toHaveCount(0);
  });
});

test('checkout con sesión: contacto prellenado', async ({ page }) => {
  await seedCart(page, [terrariumCartItem()]);
  await page.goto('/checkout');
  await expect(page.getByText(`Sesión iniciada como ${USERS.customer.email}`)).toBeVisible();
  await expect(page.getByRole('button', { name: `Pagar $${TERRARIUM.price.toLocaleString('es-CL')} CLP` })).toBeEnabled();
});
