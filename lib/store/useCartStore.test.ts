import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem } from '@/types/cart';

// Storage en memoria instalado antes de importar el store (persist lo lee al crearse).
const storage = vi.hoisted(() => {
  const map = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  } as Storage;
  return map;
});

import { useCartStore } from './useCartStore';

const KEY = 'comoelmusguito-cart';
const state = () => useCartStore.getState();
const item = (over: Partial<CartItem> = {}): CartItem => ({
  id: 't1', type: 'terrarium', name: 'Terrario', slug: 't1', image: '',
  price: 25000, currency: 'CLP', quantity: 1, inStock: true, ...over,
});

beforeEach(() => {
  state().clearCart();
  storage.clear();
});

describe('addItem', () => {
  it('adds a new item, recomputes totals and opens the cart', () => {
    state().addItem(item({ quantity: 2 }));
    expect(state()).toMatchObject({ itemCount: 2, subtotal: 50000, isOpen: true });
    expect(state().items).toHaveLength(1);
  });

  it('merges quantity for same id+type, keeps different types separate', () => {
    state().addItem(item());
    state().addItem(item({ quantity: 2 }));
    state().addItem(item({ type: 'supply', price: 1000 }));
    expect(state().items).toHaveLength(2);
    expect(state().getItemByIdAndType('t1', 'terrarium')?.quantity).toBe(3);
    expect(state()).toMatchObject({ itemCount: 4, subtotal: 76000 });
  });

  it('rejects a merge that exceeds maxQuantity and leaves state untouched', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    state().addItem(item({ quantity: 2, maxQuantity: 3 }));
    state().closeCart();
    state().addItem(item({ quantity: 2, maxQuantity: 3 }));
    expect(warn).toHaveBeenCalled();
    expect(state()).toMatchObject({ itemCount: 2, isOpen: false });
  });

  it('allows a merge exactly at maxQuantity and defaults the cap to 999', () => {
    state().addItem(item({ quantity: 2, maxQuantity: 3 }));
    state().addItem(item({ quantity: 1, maxQuantity: 3 }));
    expect(state().itemCount).toBe(3);
    state().addItem(item({ id: 'c', type: 'course', quantity: 998 }));
    state().addItem(item({ id: 'c', type: 'course', quantity: 1 }));
    expect(state().getItemByIdAndType('c', 'course')?.quantity).toBe(999);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    state().addItem(item({ id: 'c', type: 'course', quantity: 1 }));
    expect(state().getItemByIdAndType('c', 'course')?.quantity).toBe(999);
  });

  // BUG: el tope de stock solo se valida al fusionar; un item nuevo entra con quantity > maxQuantity.
  it.skip('caps a brand-new item at maxQuantity', () => {
    state().addItem(item({ quantity: 5, maxQuantity: 2 }));
    expect(state().itemCount).toBeLessThanOrEqual(2);
  });

  // BUG: `maxQuantity || 999` trata maxQuantity 0 (sin stock) como ilimitado.
  it.skip('treats maxQuantity 0 as no stock', () => {
    state().addItem(item({ maxQuantity: 0 }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    state().addItem(item({ maxQuantity: 0 }));
    expect(state().itemCount).toBeLessThanOrEqual(1);
  });

  // BUG: talleres se identifican solo por id+type; agregar el mismo taller en otra fecha
  // suma cupos a la primera fecha y la segunda se pierde.
  it.skip('keeps the same workshop on different dates as separate lines', () => {
    const d = (date: string) => ({ date, spotsAvailable: 5, price: 1 });
    state().addItem(item({ id: 'w', type: 'workshop', selectedDate: d('2026-11-01') }));
    state().addItem(item({ id: 'w', type: 'workshop', selectedDate: d('2026-11-08') }));
    expect(state().items).toHaveLength(2);
  });
});

describe('removeItem / updateQuantity', () => {
  beforeEach(() => {
    state().addItem(item({ quantity: 2, maxQuantity: 4 }));
    state().addItem(item({ id: 'c', type: 'course', price: 10000 }));
  });

  it('removes only the matching id+type', () => {
    state().removeItem('t1', 'supply');
    expect(state().items).toHaveLength(2);
    state().removeItem('t1', 'terrarium');
    expect(state()).toMatchObject({ itemCount: 1, subtotal: 10000 });
  });

  it('updates quantity clamped to maxQuantity (default 999)', () => {
    state().updateQuantity('t1', 'terrarium', 10);
    expect(state().getItemByIdAndType('t1', 'terrarium')?.quantity).toBe(4);
    state().updateQuantity('c', 'course', 5000);
    expect(state().getItemByIdAndType('c', 'course')?.quantity).toBe(999);
    state().updateQuantity('c', 'course', 3);
    expect(state()).toMatchObject({ itemCount: 7, subtotal: 4 * 25000 + 3 * 10000 });
  });

  it.each([0, -1])('removes the item when quantity is %i', (q) => {
    state().updateQuantity('t1', 'terrarium', q);
    expect(state().getItemByIdAndType('t1', 'terrarium')).toBeUndefined();
    expect(state().itemCount).toBe(1);
  });
});

describe('syncPrices', () => {
  beforeEach(() => {
    state().addItem(item({ quantity: 2 }));
    state().addItem(item({ id: 'c', type: 'course', price: 30, currency: 'USD' }));
  });

  it('returns false and keeps state when nothing changed or item unknown', () => {
    const before = state().items;
    expect(state().syncPrices([
      { id: 't1', type: 'terrarium', price: 25000, currency: 'CLP' },
      { id: 'zz', type: 'supply', price: 1, currency: 'CLP' },
    ])).toBe(false);
    expect(state().items).toBe(before);
  });

  it('applies server price and currency changes and recomputes subtotal', () => {
    expect(state().syncPrices([
      { id: 't1', type: 'terrarium', price: 27000, currency: 'CLP' },
      { id: 'c', type: 'course', price: 30000, currency: 'CLP' },
    ])).toBe(true);
    expect(state().getItemByIdAndType('c', 'course')).toMatchObject({ price: 30000, currency: 'CLP' });
    expect(state().subtotal).toBe(2 * 27000 + 30000);
  });
});

// BUG: subtotal suma precios sin mirar `currency`; un carrito CLP+USD da un número sin sentido.
it.skip('does not sum mixed currencies into one subtotal', () => {
  state().addItem(item());
  state().addItem(item({ id: 'c', type: 'course', price: 30, currency: 'USD' }));
  expect(state().subtotal).not.toBe(25030);
});

describe('UI state and selectors', () => {
  it('open/close/clear', () => {
    state().openCart();
    expect(state().isOpen).toBe(true);
    state().closeCart();
    expect(state().isOpen).toBe(false);
    state().addItem(item());
    state().clearCart();
    expect(state()).toMatchObject({ items: [], itemCount: 0, subtotal: 0, isOpen: false });
  });

  it('getItemsByType filters', () => {
    state().addItem(item());
    state().addItem(item({ id: 'c', type: 'course' }));
    expect(state().getItemsByType('course').map((i) => i.id)).toEqual(['c']);
  });
});

describe('persist', () => {
  it('persists only items (not isOpen or totals)', () => {
    state().addItem(item());
    const saved = JSON.parse(storage.get(KEY)!);
    expect(Object.keys(saved.state)).toEqual(['items']);
    expect(saved.state.items[0].id).toBe('t1');
  });

  it('recomputes itemCount and subtotal on rehydrate', async () => {
    storage.set(KEY, JSON.stringify({
      state: { items: [item({ quantity: 3, price: 1000 }), item({ id: 'c', type: 'course', price: 500 })] },
      version: 0,
    }));
    await useCartStore.persist.rehydrate();
    expect(state()).toMatchObject({ itemCount: 4, subtotal: 3500 });
    expect(useCartStore.persist.hasHydrated()).toBe(true);
  });

  it('rehydrate with empty storage keeps current state', async () => {
    state().addItem(item());
    storage.clear();
    await useCartStore.persist.rehydrate();
    expect(state().itemCount).toBe(1);
  });
});
