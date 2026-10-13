import { expect, type Page } from '@playwright/test';
import type { CartItem } from '@/types/cart';
import { TERRARIUM, TERRARIUM_SOLD_OUT } from '../fixtures';

/** Login por el formulario real. Deja la página en /mi-cuenta (o el callbackUrl). */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  const main = page.getByRole('main');
  await main.getByLabel('Email').fill(email);
  await main.getByLabel('Contraseña', { exact: true }).fill(password);
  await main.getByRole('button', { name: 'Iniciar Sesión' }).click();
}

const CART_STORAGE_KEY = 'comoelmusguito-cart'; // lib/store/useCartStore.ts

/** Precarga el carrito persistido (zustand/persist) sin pasar por la UI. */
export async function seedCart(page: Page, items: CartItem[]) {
  await page.goto('/terminos');
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [CART_STORAGE_KEY, JSON.stringify({ state: { items }, version: 0 })] as const,
  );
}

export const terrariumCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: TERRARIUM.id,
  type: 'terrarium',
  name: TERRARIUM.name,
  slug: TERRARIUM.slug,
  image: '/images/placeholder.jpg',
  price: TERRARIUM.price,
  currency: 'CLP',
  quantity: 1,
  maxQuantity: TERRARIUM.stock,
  inStock: true,
  shippingAvailable: true,
  ...overrides,
});

export const soldOutCartItem = (): CartItem =>
  terrariumCartItem({
    id: TERRARIUM_SOLD_OUT.id,
    name: TERRARIUM_SOLD_OUT.name,
    slug: TERRARIUM_SOLD_OUT.slug,
    price: TERRARIUM_SOLD_OUT.price,
  });

/** El header muestra el conteo en el aria-label del link al carrito. */
export async function expectCartCount(page: Page, count: number) {
  await expect(page.getByRole('link', { name: `Carrito de compras (${count} items)` })).toBeVisible();
}
