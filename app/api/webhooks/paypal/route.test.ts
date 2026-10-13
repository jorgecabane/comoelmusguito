import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyPayPalWebhook } from '@/lib/paypal/webhook';
import { processSuccessfulPayment, updateOrderPaymentStatus } from '@/lib/sanity/orders';
import { POST } from './route';

const { fetchOrder } = vi.hoisted(() => ({ fetchOrder: vi.fn() }));

vi.mock('@/lib/paypal/webhook', () => ({ verifyPayPalWebhook: vi.fn() }));
vi.mock('@/sanity/lib/client', () => ({ writeClient: { fetch: fetchOrder } }));
vi.mock('@/lib/sanity/orders', () => ({ updateOrderPaymentStatus: vi.fn(), processSuccessfulPayment: vi.fn() }));

const m = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
const sigHeaders = {
  'paypal-auth-algo': 'SHA256withRSA',
  'paypal-cert-url': 'https://cert',
  'paypal-transmission-id': 'tid',
  'paypal-transmission-sig': 'sig',
  'paypal-transmission-time': 't',
};
const post = (body: unknown, headers: Record<string, string> = sigHeaders) =>
  POST(
    new NextRequest('http://localhost/api/webhooks/paypal', {
      method: 'POST',
      headers,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
const captureEvent = (type: string, resource: object) => ({ id: 'WH', event_type: type, resource });
const usd = { currency_code: 'USD', value: '45.50' };
const related = (orderId?: string, amount: object = usd) => ({
  id: 'CAP-1',
  create_time: 'd1',
  amount,
  supplementary_data: { related_ids: { order_id: orderId } },
});

async function expectOk(res: Response) {
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ received: true });
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ['log', 'warn', 'error'] as const) vi.spyOn(console, k).mockImplementation(() => {});
  m(verifyPayPalWebhook).mockResolvedValue(true);
  fetchOrder.mockResolvedValue({ orderId: 'ORD-1', total: 45.5, currency: 'USD' });
});

describe('POST /api/webhooks/paypal — seguridad', () => {
  it('body inválido: 200 sin verificar', async () => {
    await expectOk(await post('{'));
    expect(verifyPayPalWebhook).not.toHaveBeenCalled();
  });

  it('firma inválida: 200 e ignora el evento', async () => {
    m(verifyPayPalWebhook).mockResolvedValue(false);
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', related('PP-1'))));
    expect(fetchOrder).not.toHaveBeenCalled();
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('pasa los headers de firma a la verificación (vacíos si faltan)', async () => {
    const event = captureEvent('X', {});
    await post(event);
    expect(verifyPayPalWebhook).toHaveBeenCalledWith(sigHeaders, event);
    await post(event, {});
    expect(m(verifyPayPalWebhook).mock.calls[1][0]).toEqual(
      Object.fromEntries(Object.keys(sigHeaders).map((k) => [k, ''])),
    );
  });
});

describe('PAYMENT.CAPTURE.COMPLETED', () => {
  it('procesa el pago de la orden asociada al paypalOrderId', async () => {
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', related('PP-1'))));
    expect(fetchOrder).toHaveBeenCalledWith(expect.stringContaining('paypalOrderId == $paypalOrderId'), { paypalOrderId: 'PP-1' });
    expect(processSuccessfulPayment).toHaveBeenCalledWith({ orderId: 'ORD-1', paymentDate: 'd1', providerOrderId: 'CAP-1' });
  });

  it('idempotente: omite órdenes con email ya enviado', async () => {
    fetchOrder.mockResolvedValue({ orderId: 'ORD-1', total: 45.5, currency: 'USD', emailSent: true });
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', related('PP-1'))));
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('sin order_id o sin orden: no hace nada', async () => {
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', {})));
    fetchOrder.mockResolvedValue(null);
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', related('PP-X'))));
    expect(fetchOrder).toHaveBeenCalledTimes(1);
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it.each([
    ['monto distinto', { currency_code: 'USD', value: '1.00' }],
    ['otra moneda', { currency_code: 'EUR', value: '45.50' }],
    ['monto sin valor', { currency_code: 'USD' }],
  ])('%s al total de la orden: no marca pagada', async (_, amount) => {
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', related('PP-1', amount))));
    expect(processSuccessfulPayment).not.toHaveBeenCalled();
  });

  it('errores de procesamiento igual responden 200', async () => {
    m(processSuccessfulPayment).mockRejectedValue(new Error('down'));
    await expectOk(await post(captureEvent('PAYMENT.CAPTURE.COMPLETED', related('PP-1'))));
  });
});

describe.each([
  ['PAYMENT.CAPTURE.DENIED', 3, related],
  ['CHECKOUT.ORDER.VOIDED', 4, (id?: string) => ({ id })],
] as const)('%s', (type, status, resource) => {
  it(`marca la orden con status ${status}`, async () => {
    await expectOk(await post(captureEvent(type, resource('PP-1'))));
    expect(fetchOrder).toHaveBeenCalledWith(expect.any(String), { paypalOrderId: 'PP-1' });
    expect(updateOrderPaymentStatus).toHaveBeenCalledWith('ORD-1', status);
  });

  it('sin id de orden: no consulta', async () => {
    await expectOk(await post(captureEvent(type, resource(undefined))));
    expect(fetchOrder).not.toHaveBeenCalled();
  });

  it('orden no encontrada: no actualiza', async () => {
    fetchOrder.mockResolvedValue(null);
    await expectOk(await post(captureEvent(type, resource('PP-1'))));
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });
});

describe('otros eventos', () => {
  it.each(['CUSTOMER.DISPUTE.CREATED', 'BILLING.SUBSCRIPTION.CREATED'])('%s: solo se registra', async (type) => {
    await expectOk(await post(captureEvent(type, {})));
    expect(fetchOrder).not.toHaveBeenCalled();
    expect(updateOrderPaymentStatus).not.toHaveBeenCalled();
  });
});
