import { beforeEach, describe, expect, it, vi } from 'vitest';
import { capturePayPalOrder } from '@/lib/paypal';
import { getOrderByOrderId, processSuccessfulPayment, updateOrderPaymentStatus } from '@/lib/sanity/orders';
import { POST } from './route';

vi.mock('@/lib/paypal', () => ({ capturePayPalOrder: vi.fn() }));
vi.mock('@/lib/sanity/orders', () => ({
  getOrderByOrderId: vi.fn(),
  updateOrderPaymentStatus: vi.fn(),
  processSuccessfulPayment: vi.fn(),
}));

const m = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const post = (body: unknown) =>
  POST(new Request('http://localhost/api/checkout/paypal/capture-order', { method: 'POST', body: JSON.stringify(body) }));

const pending = { orderId: 'ORD-1', paymentStatus: 1, paymentProvider: 'paypal', paypalOrderId: 'PP-1', total: 45.5, currency: 'USD' };
const ids = { orderId: 'ORD-1', paypalOrderId: 'PP-1' };
const completed = (capture?: object) => ({
  id: 'PP-1',
  status: 'COMPLETED',
  purchase_units: capture ? [{ payments: { captures: [capture] } }] : [],
});

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ['log', 'warn', 'error'] as const) vi.spyOn(console, k).mockImplementation(() => {});
  m(getOrderByOrderId).mockResolvedValue(pending);
});

describe('POST /api/checkout/paypal/capture-order', () => {
  it.each([[{}], [{ orderId: 'ORD-1' }], [{ paypalOrderId: 'PP-1' }]])('400 si faltan ids %o', async (body) => {
    expect((await post(body)).status).toBe(400);
  });

  it('404 si la orden no existe', async () => {
    m(getOrderByOrderId).mockResolvedValue(null);
    expect((await post(ids)).status).toBe(404);
  });

  it('409 si no es orden PayPal', async () => {
    m(getOrderByOrderId).mockResolvedValue({ ...pending, paymentProvider: 'flow' });
    expect((await post(ids)).status).toBe(409);
    expect(capturePayPalOrder).not.toHaveBeenCalled();
  });

  it('idempotente: orden ya pagada no se vuelve a capturar', async () => {
    m(getOrderByOrderId).mockResolvedValue({ ...pending, paymentStatus: 2 });
    expect(await (await post(ids)).json()).toEqual({ success: true, alreadyProcessed: true });
    expect(capturePayPalOrder).not.toHaveBeenCalled();
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it.each([3, 4])('409 si la orden está en estado %i', async (paymentStatus) => {
    m(getOrderByOrderId).mockResolvedValue({ ...pending, paymentStatus });
    expect((await post(ids)).status).toBe(409);
    expect(capturePayPalOrder).not.toHaveBeenCalled();
  });

  it('captura COMPLETED → procesa el pago con captureId y fecha de PayPal', async () => {
    m(capturePayPalOrder).mockResolvedValue(completed({ id: 'CAP-1', create_time: '2026-01-01T00:00:00Z' }));
    expect(await (await post(ids)).json()).toEqual({ success: true, alreadyProcessed: false });
    expect(capturePayPalOrder).toHaveBeenCalledWith('PP-1');
    expect(processSuccessfulPayment).toHaveBeenCalledWith({
      orderId: 'ORD-1',
      paymentDate: '2026-01-01T00:00:00Z',
      providerOrderId: 'CAP-1',
    });
  });

  it('COMPLETED sin datos de captura usa la fecha actual', async () => {
    m(capturePayPalOrder).mockResolvedValue(completed());
    await post(ids);
    expect(processSuccessfulPayment).toHaveBeenCalledWith({ orderId: 'ORD-1', paymentDate: expect.any(String), providerOrderId: undefined });
  });

  it('captura no completada marca la orden rechazada (3)', async () => {
    m(capturePayPalOrder).mockResolvedValue({ status: 'DECLINED' });
    const res = await post(ids);
    expect(res.status).toBe(400);
    expect(updateOrderPaymentStatus).toHaveBeenCalledWith('ORD-1', 3);
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('500 si la captura lanza', async () => {
    m(capturePayPalOrder).mockRejectedValue(new Error('INSTRUMENT_DECLINED'));
    expect((await post(ids)).status).toBe(500);
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });

  // BUG (dinero): app/api/checkout/paypal/capture-order/route.ts:52 captura el paypalOrderId que
  // manda el cliente sin compararlo con order.paypalOrderId ni validar el monto capturado.
  // Se puede pagar una orden PayPal barata y usar su id para marcar como pagada otra más cara.
  it.skip('BUG: debería rechazar un paypalOrderId distinto al de la orden', async () => {
    const res = await post({ orderId: 'ORD-1', paypalOrderId: 'PP-DE-OTRA-ORDEN' });
    expect(res.status).toBe(409);
    expect(capturePayPalOrder).not.toHaveBeenCalled();
  });

  it.skip('BUG: debería rechazar una captura cuyo monto no coincide con order.total', async () => {
    m(capturePayPalOrder).mockResolvedValue(
      completed({ id: 'CAP', create_time: 'd', amount: { currency_code: 'USD', value: '1.00' } }),
    );
    await post(ids);
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });
});
