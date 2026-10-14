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
    });
    expect(getPaymentStatus).not.toHaveBeenCalled();
    expect(getPaymentStatusByOrder).not.toHaveBeenCalled();
  });

  it('con token consulta Flow sin exponer datos personales (email, nombre, payer)', async () => {
    m(getPaymentStatus).mockResolvedValue(flowStatus);
    const body = await (await post({ token: 'tk' })).json();
    expect(getPaymentStatus).toHaveBeenCalledWith('tk');
    expect(getOrderByOrderId).not.toHaveBeenCalled();
    expect(body).toEqual({
      success: true,
      paymentStatus: 2,
      amount: 25990,
      currency: 'CLP',
      commerceOrder: 'ORD-1',
      flowOrder: 'F1',
      paymentDate: flowStatus.paymentDate,
    });
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

  it('500 genérico si Flow falla, sin filtrar el mensaje interno', async () => {
    m(getPaymentStatus).mockRejectedValue(new Error('FLOW_SECRET_KEY no está configurada'));
    const res = await post({ token: 'tk' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error al consultar estado del pago' });
  });
});
