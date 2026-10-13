import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentStatus, getPaymentStatusByOrder } from '@/lib/flow/client';
import { getOrderByOrderId } from '@/lib/sanity/orders';
import { POST } from './route';

vi.mock('@/lib/flow/client', () => ({ getPaymentStatus: vi.fn(), getPaymentStatusByOrder: vi.fn() }));
vi.mock('@/lib/sanity/orders', () => ({ getOrderByOrderId: vi.fn() }));

const m = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/checkout/status', { method: 'POST', body: JSON.stringify(body) }));

const flowStatus = {
  status: 2,
  amount: 25990,
  currency: 'CLP',
  commerceOrder: 'ORD-1',
  flowOrder: 'F1',
  paymentDate: '2026-01-01T00:00:00.000Z',
  payer: 'p@x.cl',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/checkout/status', () => {
  it('400 sin token ni orderId', async () => {
    expect((await post({})).status).toBe(400);
  });

  it('órdenes PayPal se leen de Sanity sin consultar Flow', async () => {
    m(getOrderByOrderId).mockResolvedValue({
      paymentProvider: 'paypal',
      paymentStatus: 2,
      total: 27.36,
      currency: 'USD',
      orderId: 'ORD-P',
      paymentDate: 'd',
      customerEmail: 'a@b.cl',
      customerName: 'Ana',
    });
    const body = await (await post({ orderId: 'ORD-P', token: 'ignored' })).json();
    expect(body).toEqual({
      success: true,
      paymentStatus: 2,
      amount: 27.36,
      currency: 'USD',
      commerceOrder: 'ORD-P',
      paymentDate: 'd',
      customerEmail: 'a@b.cl',
      customerName: 'Ana',
    });
    expect(getPaymentStatus).not.toHaveBeenCalled();
    expect(getPaymentStatusByOrder).not.toHaveBeenCalled();
  });

  it('con token consulta Flow por token y agrega datos del cliente', async () => {
    m(getPaymentStatus).mockResolvedValue(flowStatus);
    m(getOrderByOrderId).mockResolvedValue({ customerEmail: 'a@b.cl', customerName: 'Ana' });
    const body = await (await post({ token: 'tk' })).json();
    expect(getPaymentStatus).toHaveBeenCalledWith('tk');
    expect(getOrderByOrderId).toHaveBeenCalledWith('ORD-1');
    expect(body).toEqual({ success: true, paymentStatus: 2, ...flowStatus, status: undefined, customerEmail: 'a@b.cl', customerName: 'Ana' });
  });

  it('token tiene prioridad sobre orderId en órdenes Flow', async () => {
    m(getOrderByOrderId).mockResolvedValue({ paymentProvider: 'flow' });
    m(getPaymentStatus).mockResolvedValue(flowStatus);
    await post({ token: 'tk', orderId: 'ORD-1' });
    expect(getPaymentStatus).toHaveBeenCalledWith('tk');
    expect(getPaymentStatusByOrder).not.toHaveBeenCalled();
  });

  it('solo orderId consulta Flow por commerceOrder', async () => {
    m(getOrderByOrderId).mockResolvedValue(null);
    m(getPaymentStatusByOrder).mockResolvedValue(flowStatus);
    const body = await (await post({ orderId: 'ORD-1' })).json();
    expect(getPaymentStatusByOrder).toHaveBeenCalledWith('ORD-1');
    expect(body.paymentStatus).toBe(2);
    expect(body).not.toHaveProperty('customerEmail');
  });

  it('no falla si no puede leer la orden para el email', async () => {
    m(getPaymentStatus).mockResolvedValue(flowStatus);
    m(getOrderByOrderId).mockRejectedValue(new Error('down'));
    const res = await post({ token: 'tk' });
    expect(res.status).toBe(200);
    expect((await res.json()).customerEmail).toBeUndefined();
  });

  it('no busca la orden si Flow no devuelve commerceOrder', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...flowStatus, commerceOrder: '' });
    await post({ token: 'tk' });
    expect(getOrderByOrderId).not.toHaveBeenCalled();
  });

  it.each([
    [new Error('Flow caído'), 'Flow caído'],
    ['raro', 'Error al consultar estado del pago'],
  ])('500 si Flow falla (%s)', async (err, msg) => {
    m(getPaymentStatus).mockRejectedValue(err);
    const res = await post({ token: 'tk' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: msg });
  });
});
