import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderData } from './store';

async function load() {
  vi.resetModules();
  return import('./store');
}

const order = (orderId: string, createdAt = new Date().toISOString()): OrderData => ({
  orderId,
  customerEmail: 'a@b.cl',
  items: [],
  total: 1000,
  currency: 'CLP',
  createdAt,
});

let store: Awaited<ReturnType<typeof load>>;
beforeEach(async () => {
  store = await load();
});

describe('orders store (en memoria)', () => {
  it('guarda y recupera una orden', () => {
    const o = order('ORD-1');
    store.saveOrder(o);
    expect(store.getOrder('ORD-1')).toEqual(o);
    expect(store.getOrder('NO-EXISTE')).toBeUndefined();
  });

  it('elimina órdenes de más de 7 días al guardar', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    store.saveOrder(order('VIEJA', eightDaysAgo));
    store.saveOrder(order('NUEVA'));
    expect(store.getOrder('VIEJA')).toBeUndefined();
    expect(store.getOrder('NUEVA')).toBeDefined();
  });

  it('actualiza estado, fecha y flowOrder de una orden existente', () => {
    store.saveOrder(order('ORD-1'));
    store.updateOrderPaymentStatus('ORD-1', 2, '2026-01-01T00:00:00Z', 'F-9');
    expect(store.getOrder('ORD-1')).toMatchObject({
      paymentStatus: 2,
      paymentDate: '2026-01-01T00:00:00Z',
      flowOrder: 'F-9',
    });
  });

  it('no pisa fecha ni flowOrder si no se pasan', () => {
    store.saveOrder({ ...order('ORD-1'), paymentDate: 'd0', flowOrder: 'f0' });
    store.updateOrderPaymentStatus('ORD-1', 3);
    expect(store.getOrder('ORD-1')).toMatchObject({ paymentStatus: 3, paymentDate: 'd0', flowOrder: 'f0' });
  });

  it('ignora actualizaciones de órdenes inexistentes', () => {
    store.updateOrderPaymentStatus('NO-EXISTE', 2);
    expect(store.getOrder('NO-EXISTE')).toBeUndefined();
  });
});
