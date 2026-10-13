import { expect, test } from '@playwright/test';
import { TERRARIUM } from '../fixtures';
import { expectCartCount } from '../helpers/ui';

test('menú móvil abre, navega y se cierra', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  // A11Y: el botón se llama "Toggle menu" (inglés) y no expone aria-expanded (components/shared/Header.tsx:171).
  const toggle = header.getByRole('button', { name: 'Toggle menu' });

  await toggle.click();
  await header.getByRole('button', { name: 'Aprender' }).click();
  await header.getByRole('link', { name: 'Cursos Online' }).click();
  await expect(page).toHaveURL('/cursos');
  await expect(header.getByRole('button', { name: 'Aprender' })).toBeHidden();

  await toggle.click();
  await expect(header.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  await toggle.click();
  await expect(header.getByRole('button', { name: 'Tienda' })).toBeHidden();
});

test('agregar al carrito y ver el carrito en móvil', async ({ page }) => {
  await page.goto(`/terrarios/${TERRARIUM.slug}`);
  await page.getByRole('button', { name: 'Adoptar Terrario' }).click();
  await page.getByRole('button', { name: 'Ver Carrito' }).click();

  await expect(page).toHaveURL('/carrito');
  await expect(page.getByRole('main').getByRole('heading', { name: TERRARIUM.name })).toBeVisible();
  await expectCartCount(page, 1);
  await page.getByRole('button', { name: 'Proceder al Pago' }).click();
  await expect(page).toHaveURL('/checkout');
  await expect(page.getByRole('button', { name: /Ver resumen \(1 producto\)/ })).toBeVisible();
});
