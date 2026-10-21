import { expect, test } from '@playwright/test';
import { COURSE, SUPPLY, TERRARIUM, WORKSHOP, clp } from '../fixtures';
import { expectCartCount, seedCart, soldOutCartItem, terrariumCartItem } from '../helpers/ui';

test.describe('carrito', () => {
  test('agregar terrario desde el detalle, ver carrito y persistir al recargar', async ({ page }) => {
    await page.goto(`/terrarios/${TERRARIUM.slug}`);
    await page.getByRole('button', { name: 'Adoptar Terrario' }).click();

    await expect(page.getByRole('heading', { name: '¡Producto Agregado!' })).toBeVisible();
    await expectCartCount(page, 1);
    await page.getByRole('button', { name: 'Ver Carrito' }).click();

    await expect(page).toHaveURL('/carrito');
    await expect(page.getByRole('main').getByRole('heading', { name: TERRARIUM.name })).toBeVisible();
    await expect(page.getByText(clp(TERRARIUM.price)).first()).toBeVisible();

    await page.reload();
    await expect(page.getByRole('main').getByRole('heading', { name: TERRARIUM.name })).toBeVisible();
    await expectCartCount(page, 1);
  });

  test('"Seguir Comprando" cierra el modal sin salir del producto', async ({ page }) => {
    await page.goto(`/insumos/${SUPPLY.slug}`);
    await page.getByRole('button', { name: 'Agregar al Carrito' }).click();
    await page.getByRole('button', { name: 'Seguir Comprando' }).click();
    await expect(page.getByRole('heading', { name: '¡Producto Agregado!' })).toBeHidden();
    await expect(page).toHaveURL(`/insumos/${SUPPLY.slug}`);
    await expectCartCount(page, 1);
  });

  test('el modal de agregado es un diálogo: Escape lo cierra y el foco vuelve al botón', async ({ page }) => {
    // Curso: se agrega sin validar stock, así el botón nunca se deshabilita y conserva el foco.
    await page.goto(`/cursos/${COURSE.slug}`);
    const trigger = page.getByRole('button', { name: 'Comenzar mi Viaje' }).first();
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '¡Producto Agregado!' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog.getByRole('button', { name: 'Cerrar' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: 'Ver Carrito' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('agregar curso (sin validación de stock)', async ({ page }) => {
    await page.goto(`/cursos/${COURSE.slug}`);
    await page.getByRole('button', { name: 'Comenzar mi Viaje' }).first().click();
    await page.getByRole('button', { name: 'Ver Carrito' }).click();
    await expect(page.getByRole('heading', { name: 'Cursos Online' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { name: COURSE.name })).toBeVisible();
  });

  test('eliminar ítem deja el carrito vacío', async ({ page }) => {
    await seedCart(page, [terrariumCartItem()]);
    await page.goto('/carrito');
    await page.getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
    await expectCartCount(page, 0);
  });

  test('vaciar carrito', async ({ page }) => {
    await seedCart(page, [terrariumCartItem(), terrariumCartItem({ id: SUPPLY.id, type: 'supply', name: SUPPLY.name, slug: SUPPLY.slug, price: SUPPLY.price })]);
    await page.goto('/carrito');
    await expectCartCount(page, 2);
    page.once('dialog', (dialog) => dialog.accept()); // confirm() nativo
    await page.getByRole('button', { name: 'Vaciar carrito' }).click();
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  });

  test('cambiar cantidad respeta el stock máximo', async ({ page }) => {
    await seedCart(page, [terrariumCartItem()]);
    await page.goto('/carrito');
    const increase = page.getByRole('button', { name: 'Aumentar cantidad' });
    for (let i = 1; i < TERRARIUM.stock; i++) await increase.click();
    await expect(increase).toBeDisabled();
    await expectCartCount(page, TERRARIUM.stock);
    await page.getByRole('button', { name: 'Disminuir cantidad' }).click();
    await expectCartCount(page, TERRARIUM.stock - 1);
  });

  test('ítem agotado bloquea el pago', async ({ page }) => {
    await seedCart(page, [soldOutCartItem()]);
    await page.goto('/carrito');
    await expect(page.getByText('Este producto está agotado')).toBeVisible();
    await expect(page.getByText('Algunos ítems ya no están disponibles')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceder al Pago' })).toBeDisabled();
  });

  test('cantidad mayor al stock bloquea el pago', async ({ page }) => {
    await seedCart(page, [terrariumCartItem({ quantity: TERRARIUM.stock + 2, maxQuantity: undefined })]);
    await page.goto('/carrito');
    await expect(page.getByText(`Solo quedan ${TERRARIUM.stock} unidades disponibles`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proceder al Pago' })).toBeDisabled();
  });

  test('carrito válido permite ir al checkout', async ({ page }) => {
    await seedCart(page, [terrariumCartItem()]);
    await page.goto('/carrito');
    await expect(page.getByRole('heading', { name: 'Resumen' })).toBeVisible();
    await page.getByRole('link', { name: 'Proceder al Pago' }).click();
    await expect(page).toHaveURL('/checkout');
  });

  test('checkout con carrito vacío vuelve al carrito', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL('/carrito');
    await expect(page.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeVisible();
  });
});

test.describe('talleres: selección de fecha', () => {
  test('la fecha sin cupos está deshabilitada y se preselecciona la disponible', async ({ page }) => {
    await page.goto(`/talleres/${WORKSHOP.slug}`);
    await expect(page.getByRole('heading', { name: 'Fechas Disponibles' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Agotado/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: new RegExp(`${WORKSHOP.openSpots} cupos`) })).toBeEnabled();

    await page.getByRole('button', { name: 'Reservar Cupo' }).click();
    await page.getByRole('button', { name: 'Ver Carrito' }).click();
    await expect(page.getByRole('heading', { name: 'Talleres Presenciales' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('heading', { name: WORKSHOP.name })).toBeVisible();
    await expect(page.getByText(/📅 .+ a las /)).toBeVisible();
  });
});
