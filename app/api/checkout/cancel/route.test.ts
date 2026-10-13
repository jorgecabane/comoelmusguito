import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrderByOrderId, updateOrderPaymentStatus } from '@/lib/sanity/orders';
import { POST } from './route';

vi.mock('@/lib/sanity/orders', () => ({ getOrderByOrderId: vi.fn(), updateOrderPaymentStatus: vi.fn() }));

const getOrder = getOrderByOrderId as unknown as ReturnType<typeof vi.fn>;
const post = (body: string) => POST(new NextRequest('http://localhost/api/checkout/cancel', { method: 'POST', body }));

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ['log', 'warn', 'error'] as const) vi.spyOn(console, k).mockImplementation(() => {});
});

describe('POST /api/checkout/cancel', () => {
  it('400 con body inválido', async () => {
    expect((await post('{')).status).toBe(400);
  });

  it.each(['{}', 'null'])('400 sin orderId (%s)', async (body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'orderId is required' });
  });

  it('404 si la orden no existe', async () => {
    getOrder.mockResolvedValue(null);
    expect((await post('{"orderId":"X"}')).status).toBe(404);
  });

  it('409 y no toca la orden si ya está pagada', async () => {
    getOrder.mockResolvedValue({ paymentStatus: 2 });
    const res = await post('{"orderId":"X"}');
    expect(res.status).toBe(409);
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it('idempotente si ya estaba anulada', async () => {
    getOrder.mockResolvedValue({ paymentStatus: 4 });
    const res = await post('{"orderId":"X"}');
    expect(await res.json()).toEqual({ success: true, alreadyCancelled: true });
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it.each([1, 3])('anula (status 4) una orden en estado %i', async (paymentStatus) => {
    getOrder.mockResolvedValue({ paymentStatus });
    const res = await post('{"orderId":"ORD-1"}');
    expect(await res.json()).toEqual({ success: true });
    expect(updateOrderPaymentStatus).toHaveBeenCalledWith('ORD-1', 4);
  });

  it('500 si Sanity falla', async () => {
    getOrder.mockResolvedValue({ paymentStatus: 1 });
    (updateOrderPaymentStatus as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    expect((await post('{"orderId":"ORD-1"}')).status).toBe(500);
  });
});
