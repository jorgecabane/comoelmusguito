import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentStatus } from '@/lib/flow';
import { getOrderByOrderId, processSuccessfulPayment, updateOrderPaymentStatus } from '@/lib/sanity/orders';
import { GET, POST } from './route';

vi.mock('@/lib/flow', () => ({ getPaymentStatus: vi.fn() }));
vi.mock('@/lib/sanity/orders', () => ({
  getOrderByOrderId: vi.fn(),
  updateOrderPaymentStatus: vi.fn(),
  processSuccessfulPayment: vi.fn(),
}));

const m = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const URL_WH = 'http://localhost/api/webhooks/flow';
const postForm = (body: string) =>
  POST(
    new NextRequest(URL_WH, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }),
  );
const postJson = (body: string) => POST(new NextRequest(URL_WH, { method: 'POST', body }));

const paid = {
  status: 2,
  amount: 25990,
  currency: 'CLP',
  commerceOrder: 'ORD-1',
  flowOrder: 'F1',
  paymentDate: '2026-01-01T03:00:00.000Z',
};

async function expectReply(res: Response, status: number, message: string | RegExp) {
  expect(res.status).toBe(status);
  expect((await res.json()).message).toMatch(message);
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ['log', 'warn', 'error'] as const) vi.spyOn(console, k).mockImplementation(() => {});
  m(processSuccessfulPayment).mockResolvedValue({ success: true, alreadyProcessed: false });
  m(getOrderByOrderId).mockResolvedValue({ orderId: 'ORD-1', paymentStatus: 1 });
  m(updateOrderPaymentStatus).mockResolvedValue(undefined);
});

describe('GET /api/webhooks/flow', () => {
  it('405 con Allow: POST', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });
});

describe('POST /api/webhooks/flow — 200 sin reintento', () => {
  it('sin token: 200 con success=false y no consulta Flow', async () => {
    const res = await postForm('commerceOrder=ORD-1');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: false, error: 'Token requerido' });
    expect(getPaymentStatus).not.toHaveBeenCalled();
  });

  it('body ilegible: 200 sin token', async () => {
    const res = await postJson('{');
    expect(res.status).toBe(200);
    expect(getPaymentStatus).not.toHaveBeenCalled();
  });

  it('status pendiente (1): sin acción', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 1 });
    await expectReply(await postJson('{"token":"tk"}'), 200, 'pendiente o desconocido');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it('pago confirmado de orden inexistente: 200 sin procesar', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    m(getOrderByOrderId).mockResolvedValue(null);
    await expectReply(await postForm('token=tk'), 200, 'Orden no encontrada');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });
});

describe('POST /api/webhooks/flow — pago confirmado', () => {
  it('consulta el estado real en Flow (no confía en el body) y procesa el pago', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    const res = await postForm('token=tk-1&status=2&commerceOrder=ORD-FALSA');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    await expectReply(res, 200, 'Webhook procesado correctamente');
    expect(getPaymentStatus).toHaveBeenCalledWith('tk-1');
    expect(processSuccessfulPayment).toHaveBeenCalledWith({
      orderId: 'ORD-1',
      paymentDate: '2026-01-01T03:00:00.000Z',
      providerOrderId: 'F1',
    });
  });

  it('ya procesado: 200 (idempotente)', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    m(processSuccessfulPayment).mockResolvedValue({ success: true, alreadyProcessed: true });
    await expectReply(await postForm('token=tk'), 200, 'Webhook procesado correctamente');
  });
});

describe('POST /api/webhooks/flow — 500 para que Flow reintente', () => {
  it('si Flow getStatus falla no toca la orden', async () => {
    m(getPaymentStatus).mockRejectedValue(new Error('timeout'));
    await expectReply(await postForm('token=tk'), 500, 'reintentar');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('si processSuccessfulPayment falla (Sanity caído)', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    m(processSuccessfulPayment).mockRejectedValue(new Error('Sanity 503'));
    await expectReply(await postForm('token=tk'), 500, 'reintentar');
  });

  it('si no puede leer la orden', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    m(getOrderByOrderId).mockRejectedValue(new Error('Sanity 503'));
    await expectReply(await postForm('token=tk'), 500, 'reintentar');
  });

  it('si falla actualizar un rechazo', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 3 });
    m(updateOrderPaymentStatus).mockRejectedValue(new Error('down'));
    await expectReply(await postForm('token=tk'), 500, 'reintentar');
  });
});

describe('POST /api/webhooks/flow — rechazado / anulado', () => {
  it.each([
    [3, 'Rechazado'],
    [4, 'Anulado'],
  ])('status %i actualiza la orden pendiente', async (status, label) => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status });
    await expectReply(await postForm('token=tk'), 200, `Pago ${label} procesado`);
    expect(updateOrderPaymentStatus).toHaveBeenCalledWith('ORD-1', status, paid.paymentDate, 'F1');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('idempotente: no actualiza si ya tiene ese estado', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 3 });
    m(getOrderByOrderId).mockResolvedValue({ paymentStatus: 3 });
    await expectReply(await postForm('token=tk'), 200, 'Pago Rechazado procesado');
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it('orden inexistente: 200 sin actualizar', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 4 });
    m(getOrderByOrderId).mockResolvedValue(null);
    await expectReply(await postForm('token=tk'), 200, 'Pago Anulado procesado');
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });
});
