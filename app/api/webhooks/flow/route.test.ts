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
const postForm = (body: string, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest(URL_WH, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
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

async function expect200(res: Response, message: string | RegExp) {
  expect(res.status).toBe(200);
  expect((await res.json()).message).toMatch(message);
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ['log', 'warn', 'error'] as const) vi.spyOn(console, k).mockImplementation(() => {});
  m(processSuccessfulPayment).mockResolvedValue({ success: true, alreadyProcessed: false });
});

describe('GET /api/webhooks/flow', () => {
  it('405 con Allow: POST', async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('POST');
  });
});

describe('POST /api/webhooks/flow — siempre 200 para Flow', () => {
  it('sin token: 200 con success=false y no consulta Flow', async () => {
    const res = await postForm('commerceOrder=ORD-1', { 'x-real-ip': '1.2.3.4' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: false, error: 'Token requerido' });
    expect(getPaymentStatus).not.toHaveBeenCalled();
  });

  it('body inválido: 200 con mensaje de error', async () => {
    const res = await postJson('{');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, message: 'Webhook recibido pero hubo un error procesándolo' });
  });

  it('error no-Error en el catch general', async () => {
    const req = new NextRequest(URL_WH, { method: 'POST', body: '{}' });
    vi.spyOn(req, 'json').mockRejectedValue('raro');
    expect(await (await POST(req)).json()).toMatchObject({ error: 'Error procesando webhook' });
  });

  it('si Flow getStatus falla responde 200 sin tocar la orden', async () => {
    m(getPaymentStatus).mockRejectedValue(new Error('401'));
    await expect200(await postForm('token=tk'), 'hubo error consultando estado');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('si Flow devuelve vacío responde 200 sin tocar la orden', async () => {
    m(getPaymentStatus).mockResolvedValue(null);
    await expect200(await postForm('token=tk'), 'no se pudo obtener estado');
  });

  it('status 0/ausente: sin acción', async () => {
    m(getPaymentStatus).mockResolvedValue({});
    await expect200(await postForm('token=tk'), 'estado no disponible');
    expect(getOrderByOrderId).not.toHaveBeenCalled();
  });

  it('status pendiente (1): sin acción', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 1 });
    await expect200(await postJson('{"token":"tk"}'), 'Estado de pago desconocido');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });
});

describe('POST /api/webhooks/flow — pago confirmado', () => {
  it('consulta el estado real en Flow (no confía en el body) y procesa el pago', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    // El body trae status/commerceOrder falsos: deben ignorarse.
    const res = await postForm('token=tk-1&status=2&commerceOrder=ORD-FALSA');
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    await expect200(res, 'Webhook procesado correctamente');
    expect(getPaymentStatus).toHaveBeenCalledWith('tk-1');
    expect(processSuccessfulPayment).toHaveBeenCalledWith({
      orderId: 'ORD-1',
      paymentDate: '2026-01-01T03:00:00.000Z',
      providerOrderId: 'F1',
    });
  });

  it('idempotente: webhook duplicado delega en processSuccessfulPayment y responde 200', async () => {
    m(getPaymentStatus).mockResolvedValue(paid);
    m(processSuccessfulPayment).mockResolvedValue({ success: true, alreadyProcessed: true });
    await expect200(await postForm('token=tk'), 'Webhook procesado correctamente');
    await expect200(await postForm('token=tk'), 'Webhook procesado correctamente');
    expect(processSuccessfulPayment).toHaveBeenCalledTimes(2);
  });

  it('si processSuccessfulPayment falla igual responde 200', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, currency: undefined, commerceOrder: undefined });
    m(processSuccessfulPayment).mockRejectedValue(new Error('Orden no encontrada'));
    await expect200(await postForm('token=tk'), 'Webhook procesado correctamente');
    expect(processSuccessfulPayment).toHaveBeenCalledWith(expect.objectContaining({ orderId: '' }));
  });
});

describe('POST /api/webhooks/flow — rechazado / anulado', () => {
  it.each([
    [3, 'Rechazado'],
    [4, 'Anulado'],
  ])('status %i actualiza la orden pendiente', async (status, label) => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status });
    m(getOrderByOrderId).mockResolvedValue({ paymentStatus: 1 });
    await expect200(await postForm('token=tk'), `Pago ${label} procesado`);
    expect(updateOrderPaymentStatus).toHaveBeenCalledWith('ORD-1', status, paid.paymentDate, 'F1');
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('idempotente: no actualiza si ya tiene ese estado', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 3 });
    m(getOrderByOrderId).mockResolvedValue({ paymentStatus: 3 });
    await expect200(await postForm('token=tk'), 'Pago Rechazado procesado');
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it('orden inexistente: 200 sin actualizar', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 4 });
    m(getOrderByOrderId).mockResolvedValue(null);
    await expect200(await postForm('token=tk'), 'Pago Anulado procesado');
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  it('error al actualizar no rompe el webhook', async () => {
    m(getPaymentStatus).mockResolvedValue({ ...paid, status: 3 });
    m(getOrderByOrderId).mockResolvedValue({ paymentStatus: 1 });
    m(updateOrderPaymentStatus).mockRejectedValue(new Error('down'));
    await expect200(await postForm('token=tk'), 'Pago Rechazado procesado');
  });
});
