import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { verifyPayPalWebhook } from './webhook';
import type { PayPalWebhookEvent, PayPalWebhookHeaders } from './types';

const BASE = 'https://api-m.sandbox.paypal.com';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });

const headers: PayPalWebhookHeaders = {
  'paypal-auth-algo': 'SHA256withRSA',
  'paypal-cert-url': 'https://api.paypal.com/cert',
  'paypal-transmission-id': 'tid',
  'paypal-transmission-sig': 'sig',
  'paypal-transmission-time': '2026-01-01T00:00:00Z',
};
const event = { id: 'WH-1', event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: {} } as PayPalWebhookEvent;

let fetchMock: MockInstance<typeof fetch>;

beforeEach(() => {
  vi.stubEnv('PAYPAL_BASE_URL', BASE);
  vi.stubEnv('PAYPAL_CLIENT_ID', 'cid');
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'csecret');
  vi.stubEnv('PAYPAL_WEBHOOK_ID', 'WH-ID');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock = vi.spyOn(globalThis, 'fetch');
});

const respondVerification = (verify: Response) =>
  fetchMock.mockResolvedValueOnce(json({ access_token: 'tok' })).mockResolvedValueOnce(verify);

describe('verifyPayPalWebhook', () => {
  it('devuelve true con SUCCESS y envía headers, webhook_id y evento a PayPal', async () => {
    respondVerification(json({ verification_status: 'SUCCESS' }));

    await expect(verifyPayPalWebhook(headers, event)).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${BASE}/v1/notifications/verify-webhook-signature`);
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(JSON.parse(init?.body as string)).toEqual({
      auth_algo: 'SHA256withRSA',
      cert_url: 'https://api.paypal.com/cert',
      transmission_id: 'tid',
      transmission_sig: 'sig',
      transmission_time: '2026-01-01T00:00:00Z',
      webhook_id: 'WH-ID',
      webhook_event: event,
    });
    expect((fetchMock.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from('cid:csecret').toString('base64')}`,
    );
  });

  it('devuelve false si PayPal responde FAILURE', async () => {
    respondVerification(json({ verification_status: 'FAILURE' }));
    await expect(verifyPayPalWebhook(headers, event)).resolves.toBe(false);
  });

  it('devuelve false si el endpoint de verificación falla', async () => {
    respondVerification(new Response('bad', { status: 500 }));
    await expect(verifyPayPalWebhook(headers, event)).resolves.toBe(false);
  });

  it('devuelve false si OAuth falla', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 }));
    await expect(verifyPayPalWebhook(headers, event)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_BASE_URL'])(
    'devuelve false (sin lanzar) si falta %s',
    async (name) => {
      vi.stubEnv(name, '');
      await expect(verifyPayPalWebhook(headers, event)).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('devuelve false si falta PAYPAL_WEBHOOK_ID', async () => {
    vi.stubEnv('PAYPAL_WEBHOOK_ID', '');
    fetchMock.mockResolvedValueOnce(json({ access_token: 'tok' }));
    await expect(verifyPayPalWebhook(headers, event)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
