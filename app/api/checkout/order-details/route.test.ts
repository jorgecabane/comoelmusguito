import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrderByOrderId } from '@/lib/sanity/orders';
import { GET } from './route';

vi.mock('@/lib/sanity/orders', () => ({ getOrderByOrderId: vi.fn() }));

const getOrder = getOrderByOrderId as unknown as ReturnType<typeof vi.fn>;
const get = (qs = '') => GET(new NextRequest(`http://localhost/api/checkout/order-details${qs}`));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/checkout/order-details', () => {
  it('400 sin orderId', async () => {
    expect((await get()).status).toBe(400);
  });

  it('404 si no existe', async () => {
    getOrder.mockResolvedValue(null);
    expect((await get('?orderId=X')).status).toBe(404);
  });

  it('devuelve solo los campos públicos de los items y defaults de regalo/despacho', async () => {
    getOrder.mockResolvedValue({
      customerEmail: 'a@b.cl',
      customerName: 'Ana',
      items: [{ id: 'i', name: 'Curso', type: 'course', quantity: 1, price: 100, currency: 'CLP', slug: 'curso', snapshot: { x: 1 } }],
    });
    const body = await (await get('?orderId=ORD-1')).json();
    expect(getOrder).toHaveBeenCalledWith('ORD-1');
    expect(body).toEqual({
      success: true,
      items: [{ name: 'Curso', type: 'course', quantity: 1, price: 100, currency: 'CLP', slug: 'curso' }],
      customerEmail: 'a@b.cl',
      customerName: 'Ana',
      isGift: false,
      requiresShipping: false,
    });
  });

  it('incluye datos de regalo y despacho cuando existen', async () => {
    getOrder.mockResolvedValue({
      items: [],
      isGift: true,
      recipientEmail: 'r@x.cl',
      requiresShipping: true,
      shippingAddress: { region: 'RM' },
    });
    expect(await (await get('?orderId=O')).json()).toMatchObject({
      isGift: true,
      recipientEmail: 'r@x.cl',
      requiresShipping: true,
      shippingAddress: { region: 'RM' },
    });
  });

  it.each([
    [new Error('down'), 'down'],
    ['raro', 'Error al obtener detalles de la orden'],
  ])('500 si falla Sanity (%s)', async (err, msg) => {
    getOrder.mockRejectedValue(err);
    const res = await get('?orderId=O');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: msg });
  });
});
