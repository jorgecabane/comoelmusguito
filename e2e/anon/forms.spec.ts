import { expect, test, type Page } from '@playwright/test';
import { sanity, uniqueEmail } from '../helpers/sanity';

async function fillContactForm(page: Page, email: string) {
  const main = page.getByRole('main');
  await main.getByLabel('Nombre').fill('Visitante E2E');
  await main.getByLabel('Email').fill(email);
  await main.getByLabel('Teléfono').fill('+56 9 1234 5678');
  await main.getByLabel('Asunto').fill('Consulta de prueba');
  await main.getByLabel('Mensaje').fill('Hola, esto es un mensaje de prueba automatizada.');
  await main.getByRole('button', { name: 'Enviar Mensaje' }).click();
}

test.describe('contacto', () => {
  test('envío exitoso muestra confirmación y permite enviar otro', async ({ page }) => {
    const email = uniqueEmail('contact');
    // Sin Resend en E2E el envío real falla: se mockea la API para validar el flujo de UI.
    await page.route('**/api/contact', (route) => route.fulfill({ json: { success: true } }));
    await page.goto('/contacto');
    const request = page.waitForRequest('**/api/contact');
    await fillContactForm(page, email);

    expect((await request).postDataJSON()).toMatchObject({ email, subject: 'Consulta de prueba' });
    await expect(page.getByRole('heading', { name: '¡Mensaje enviado!' })).toBeVisible();
    await page.getByRole('button', { name: 'Enviar otro mensaje' }).click();
    await expect(page.getByRole('main').getByLabel('Asunto')).toBeVisible();
  });

  test('si el envío falla muestra un error recuperable', async ({ page }) => {
    await page.goto('/contacto');
    await fillContactForm(page, uniqueEmail('contact'));
    await expect(page.getByText(/Error al enviar el mensaje/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar Mensaje' })).toBeEnabled();
  });
});

test.describe('newsletter', () => {
  test('suscripción desde el footer queda guardada', async ({ page }) => {
    const email = uniqueEmail('newsletter');
    try {
      await page.goto('/');
      const footer = page.getByRole('contentinfo');
      await footer.getByLabel('Email para el newsletter').fill(email);
      await footer.getByRole('button', { name: 'Suscribirme' }).click();
      await expect(footer.getByText('¡Te has suscrito exitosamente!')).toBeVisible();

      const saved = await sanity.fetch<number>(`count(*[_type == "newsletterSubscriber" && email == $email && _id in path("private.**")])`, { email });
      expect(saved).toBe(1);
    } finally {
      await sanity.delete({ query: `*[_type == "newsletterSubscriber" && email == $email]`, params: { email } });
    }
  });
});
