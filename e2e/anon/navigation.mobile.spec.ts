import { expect, test } from '@playwright/test';
import { TERRARIUM } from '../fixtures';
import { expectCartCount } from '../helpers/ui';

test('menú móvil abre, navega y se cierra', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  const open = header.getByRole('button', { name: 'Abrir menú' });
  const close = header.getByRole('button', { name: 'Cerrar menú' });

  await expect(open).toHaveAttribute('aria-expanded', 'false');
  await open.click();
  await expect(close).toHaveAttribute('aria-expanded', 'true');
  await header.getByRole('button', { name: 'Aprender' }).click();
  await header.getByRole('link', { name: 'Cursos Online' }).click();
  await expect(page).toHaveURL('/cursos');
  await expect(header.getByRole('button', { name: 'Aprender' })).toBeHidden();

  await open.click();
  await expect(header.getByRole('link', { name: 'Iniciar Sesión' })).toBeVisible();
  await close.click();
  await expect(header.getByRole('button', { name: 'Tienda' })).toBeHidden();
});

test('agregar al carrito y ver el carrito en móvil', async ({ page }) => {
  await page.goto(`/terrarios/${TERRARIUM.slug}`);
  await page.getByRole('button', { name: 'Adoptar Terrario' }).click();
  await page.getByRole('button', { name: 'Ver Carrito' }).click();

  await expect(page).toHaveURL('/carrito');
  await expect(page.getByRole('main').getByRole('heading', { name: TERRARIUM.name })).toBeVisible();
  await expectCartCount(page, 1);
  await page.getByRole('link', { name: 'Proceder al Pago' }).click();
  await expect(page).toHaveURL('/checkout');
  await expect(page.getByRole('button', { name: /Ver resumen \(1 producto\)/ })).toBeVisible();
});
