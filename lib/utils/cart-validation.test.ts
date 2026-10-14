import { describe, expect, it } from 'vitest';
import type { CartItem, CartItemType } from '@/types/cart';
import { canPurchaseInternationally, isDigitalOnlyCart, isPhysicalItem } from './cart-validation';

const item = (type: CartItemType, id: string = type): CartItem => ({
  id, type, name: id, slug: id, image: '', price: 1, currency: 'CLP', quantity: 1, inStock: true,
});

describe('cart-validation', () => {
  it.each([
    ['terrarium', true], ['workshop', true], ['supply', true], ['course', false],
  ] as const)('isPhysicalItem(%s) → %s', (type, expected) => {
    expect(isPhysicalItem(item(type))).toBe(expected);
  });

  it('splits blocked physical items from digital ones', () => {
    const cart = [item('course'), item('terrarium'), item('supply')];
    const res = canPurchaseInternationally(cart);
    expect(res.ok).toBe(false);
    expect(res.blockedItems.map((i) => i.type)).toEqual(['terrarium', 'supply']);
    expect(res.digitalItems.map((i) => i.type)).toEqual(['course']);
  });

  it('allows international purchase for course-only and empty carts', () => {
    expect(canPurchaseInternationally([item('course')]).ok).toBe(true);
    expect(canPurchaseInternationally([]).ok).toBe(true);
  });

  it('isDigitalOnlyCart', () => {
    expect(isDigitalOnlyCart([item('course'), item('course', 'c2')])).toBe(true);
    expect(isDigitalOnlyCart([item('course'), item('workshop')])).toBe(false);
    expect(isDigitalOnlyCart([])).toBe(true);
  });
});
