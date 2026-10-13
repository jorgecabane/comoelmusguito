import { expect, test, type Page } from '@playwright/test';
import { COURSE, TERRARIUM, WORKSHOP } from '../fixtures';
import { sanity, uniqueEmail } from '../helpers/sanity';
import { seedCart, terrariumCartItem } from '../helpers/ui';

// A11Y: los campos del checkout no tienen <label>, solo placeholder, y los <select> de región/comuna
// no tienen nombre accesible (app/checkout/page.tsx:562-935). Por eso se ubican por placeholder/orden.
const payButton = (page: Page) => page.getByRole('button', { name: `Pagar $${TERRARIUM.price.toLocaleString('es-CL')} CLP` });

async function fillContact(page: Page, email: string) {
  await page.getByPlaceholder('Correo electrónico *').fill(email);
  await page.getByPlaceholder('Nombre completo *').fill('Visitante E2E');
}

async function fillShipping(page: Page, email: string) {
  await page.getByRole('button', { name: /Despacho a domicilio/ }).click();
  await expect(page.getByRole('heading', { name: 'Dirección de despacho' })).toBeVisible();
  await page.getByPlaceholder('Email de contacto *').fill(email);
  await page.getByPlaceholder('Teléfono *').fill('+56 9 1234 5678');
  await page.getByPlaceholder('RUT *').fill('11.111.111-1');
  await page.getByRole('combobox').nth(0).selectOption('Región Metropolitana de Santiago');
  await page.getByRole('combobox').nth(1).selectOption('Providencia');
  await page.getByPlaceholder('Calle / Avenida *').fill('Av. Providencia');
  await page.getByPlaceholder('N° *').fill('123');
}

test.describe('checkout', () => {
  test.beforeEach(async ({ page }) => {
    await seedCart(page, [terrariumCartItem()]);
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Contacto' })).toBeVisible();
  });

  test('el pago se habilita solo con los campos requeridos', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tu pedido' })).toBeVisible();
    await expect(payButton(page)).toBeDisabled();
    await fillContact(page, uniqueEmail('checkout'));
    await expect(payButton(page)).toBeEnabled();
  });

  test('despacho exige dirección completa y la comuna depende de la región', async ({ page }) => {
    const email = uniqueEmail('checkout');
    await fillContact(page, email);
    await page.getByRole('button', { name: /Despacho a domicilio/ }).click();
    await expect(payButton(page)).toBeDisabled();

    // La comuna solo aparece tras elegir región, y lista las comunas de esa región.
    await expect(page.getByRole('combobox')).toHaveCount(1);
    await page.getByRole('combobox').first().selectOption('Región de Valparaíso');
    await expect(page.getByRole('combobox').nth(1).getByRole('option', { name: 'Viña del Mar' })).toBeAttached();
    await expect(page.getByRole('combobox').nth(1).getByRole('option', { name: 'Providencia' })).toHaveCount(0);

    await fillShipping(page, email);
    await expect(payButton(page)).toBeEnabled();

    await page.getByRole('button', { name: /Retiro en tienda/ }).click();
    await expect(page.getByRole('heading', { name: 'Dirección de despacho' })).toBeHidden();
  });

  test('crear cuenta valida que las contraseñas coincidan', async ({ page }) => {
    await fillContact(page, uniqueEmail('checkout'));
    await page.getByRole('checkbox', { name: /Crear cuenta/ }).check();
    await page.getByPlaceholder('Contraseña (mín. 6 caracteres) *').fill('secreta123');
    await page.getByPlaceholder('Confirmar contraseña *').fill('otra-cosa');
    await payButton(page).click();
    await expect(page.getByText('Las contraseñas no coinciden').filter({ visible: true })).toBeVisible();
  });

  test('regalo: no se puede regalar a uno mismo', async ({ page }) => {
    const email = uniqueEmail('checkout');
    await fillContact(page, email);
    await page.getByRole('checkbox', { name: /Comprar como regalo/ }).check();
    await page.getByPlaceholder('Email del destinatario *').fill(email);
    await payButton(page).click();
    await expect(page.getByText('No puedes regalarte algo a ti mismo').filter({ visible: true })).toBeVisible();
  });

  test('sin credenciales de Flow muestra error y no crea la orden', async ({ page }) => {
    const email = uniqueEmail('checkout');
    await fillContact(page, email);
    const checkoutResponse = page.waitForResponse('**/api/checkout');
    await payButton(page).click();
    expect((await checkoutResponse).status()).toBe(500);

    await expect(page.getByText('Error al procesar el pago').filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/no está configurada/)).toHaveCount(0);
    await expect(payButton(page)).toBeEnabled();
    const orders = await sanity.fetch<number>(`count(*[_type == "order" && customerEmail == $email])`, { email });
    expect(orders).toBe(0);
  });

  test('con orden creada redirige a Flow con el token (Flow mockeado)', async ({ page }) => {
    const email = uniqueEmail('checkout');
    const flowUrl = 'https://sandbox.flow.cl/app/web/pay.php';
    await page.route('**/api/checkout', (route) =>
      route.fulfill({ json: { success: true, gateway: 'flow', paymentUrl: flowUrl, token: 'e2e-token', commerceOrder: 'ORD-E2E' } }),
    );
    await page.route('https://sandbox.flow.cl/**', (route) => route.fulfill({ contentType: 'text/html', body: '<h1>Flow mock</h1>' }));

    await fillContact(page, email);
    await fillShipping(page, email);
    const request = page.waitForRequest('**/api/checkout');
    await payButton(page).click();

    const body = (await request).postDataJSON();
    expect(body).toMatchObject({
      email,
      gateway: 'flow',
      requiresShipping: true,
      shippingAddress: { region: 'Región Metropolitana de Santiago', comuna: 'Providencia', number: '123' },
      items: [{ id: TERRARIUM.id, type: 'terrarium', quantity: 1 }],
    });
    await expect(page).toHaveURL(`${flowUrl}?token=e2e-token`);
    await expect(page.getByRole('heading', { name: 'Flow mock' })).toBeVisible();
  });
});

test('checkout de curso + taller: todo es retiro, sin sección de despacho', async ({ page }) => {
  await seedCart(page, [
    terrariumCartItem({ id: COURSE.id, type: 'course', name: COURSE.name, slug: COURSE.slug, price: COURSE.price, shippingAvailable: false, maxQuantity: 1 }),
    terrariumCartItem({ id: WORKSHOP.id, type: 'workshop', name: WORKSHOP.name, slug: WORKSHOP.slug, price: WORKSHOP.price, shippingAvailable: false }),
  ]);
  await page.goto('/checkout');
  await expect(page.getByText('Todos los productos son de retiro en tienda')).toBeVisible();
  await expect(page.getByRole('button', { name: /Despacho a domicilio/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: `Pagar $${(COURSE.price + WORKSHOP.price).toLocaleString('es-CL')} CLP` })).toBeVisible();
});
