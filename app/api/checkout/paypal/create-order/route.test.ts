import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPayPalOrder } from '@/lib/paypal';
import { getOrderByOrderId } from '@/lib/sanity/orders';
import { POST } from './route';

const { patch, set, commit } = vi.hoisted(() => {
  const commit = vi.fn();
  const set = vi.fn(() => ({ commit }));
  const patch = vi.fn(() => ({ set }));
  return { patch, set, commit };
});

vi.mock('@/lib/paypal', () => ({ createPayPalOrder: vi.fn() }));
vi.mock('@/lib/sanity/orders', () => ({ getOrderByOrderId: vi.fn() }));
vi.mock('@/sanity/lib/client', () => ({ writeClient: { patch } }));

const m = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const post = (body: unknown) =>
  POST(new Request('http://localhost/api/checkout/paypal/create-order', { method: 'POST', body: JSON.stringify(body) }));

const pendingOrder = {
  _id: 'doc-1',
  orderId: 'ORD-1',
  paymentStatus: 1,
  paymentProvider: 'paypal',
  total: 45.5,
  currency: 'USD',
  items: [
    { name: 'Curso A', quantity: 1, price: 20.5 },
    { name: 'Curso B', quantity: 1, price: 25 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ['log', 'error'] as const) vi.spyOn(console, k).mockImplementation(() => {});
});

describe('POST /api/checkout/paypal/create-order', () => {
  it('400 sin orderId', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('404 si la orden no existe', async () => {
    m(getOrderByOrderId).mockResolvedValue(null);
    expect((await post({ orderId: 'X' })).status).toBe(404);
  });

  it.each([
    [{ paymentStatus: 2 }, 'Order is already paid or rejected'],
    [{ paymentStatus: 3 }, 'Order is already paid or rejected'],
    [{ paymentProvider: 'flow' }, 'Order is not a PayPal order'],
  ])('409 si %o', async (over, error) => {
    m(getOrderByOrderId).mockResolvedValue({ ...pendingOrder, ...over });
    const res = await post({ orderId: 'ORD-1' });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error });
    expect(createPayPalOrder).not.toHaveBeenCalled();
  });

  it('idempotente: devuelve el paypalOrderId existente sin crear otro', async () => {
    m(getOrderByOrderId).mockResolvedValue({ ...pendingOrder, paypalOrderId: 'PP-OLD' });
    expect(await (await post({ orderId: 'ORD-1' })).json()).toEqual({ success: true, paypalOrderId: 'PP-OLD' });
    expect(createPayPalOrder).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it('crea la orden PayPal con los montos guardados y persiste el paypalOrderId', async () => {
    m(getOrderByOrderId).mockResolvedValue(pendingOrder);
    m(createPayPalOrder).mockResolvedValue({ id: 'PP-NEW' });

    expect(await (await post({ orderId: 'ORD-1' })).json()).toEqual({ success: true, paypalOrderId: 'PP-NEW' });
    expect(createPayPalOrder).toHaveBeenCalledWith({
      orderId: 'ORD-1',
      total: 45.5,
      currency: 'USD',
      items: [
        { name: 'Curso A', quantity: 1, unitPrice: 20.5, currency: 'USD' },
        { name: 'Curso B', quantity: 1, unitPrice: 25, currency: 'USD' },
      ],
    });
    expect(patch).toHaveBeenCalledWith('doc-1');
    expect(set).toHaveBeenCalledWith({ paypalOrderId: 'PP-NEW', updatedAt: expect.any(String) });
    expect(commit).toHaveBeenCalled();
  });

  it('500 si PayPal falla, sin persistir', async () => {
    m(getOrderByOrderId).mockResolvedValue(pendingOrder);
    m(createPayPalOrder).mockRejectedValue(new Error('422'));
    const res = await post({ orderId: 'ORD-1' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Failed to create PayPal order' });
    expect(patch).not.toHaveBeenCalled();
  });

});
