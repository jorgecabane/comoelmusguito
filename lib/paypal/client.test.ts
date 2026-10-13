import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

const BASE = 'https://api-m.sandbox.paypal.com';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const tokenResponse = (token = 'tok-1', expiresIn = 32400) =>
  json({ access_token: token, token_type: 'Bearer', expires_in: expiresIn });

// El token se cachea a nivel de módulo: cada test parte de un módulo limpio.
async function load() {
  vi.resetModules();
  return import('./client');
}

let fetchMock: MockInstance<typeof fetch>;

beforeEach(() => {
  vi.stubEnv('PAYPAL_BASE_URL', BASE);
  vi.stubEnv('PAYPAL_CLIENT_ID', 'cid');
  vi.stubEnv('PAYPAL_CLIENT_SECRET', 'csecret');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://comoelmusguito.cl');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock = vi.spyOn(globalThis, 'fetch');
});

const orderParams = {
  orderId: 'ORD-1',
  items: [
    { name: 'Curso A', quantity: 3, unitPrice: 10.1, currency: 'USD' },
    { name: 'Curso B', quantity: 1, unitPrice: 25, currency: 'USD' },
  ],
  total: 55.3,
  currency: 'USD',
};

describe('autenticación OAuth', () => {
  it.each(['PAYPAL_BASE_URL', 'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'])(
    'lanza si falta %s',
    async (name) => {
      const { capturePayPalOrder } = await load();
      vi.stubEnv(name, '');
      await expect(capturePayPalOrder('PP-1')).rejects.toThrow(`${name} is not configured`);
    },
  );

  it('pide token con Basic auth y lo reutiliza mientras no expire', async () => {
    const { capturePayPalOrder } = await load();
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith('/v1/oauth2/token') ? tokenResponse() : json({ id: 'PP-1', status: 'COMPLETED' }),
    );

    await capturePayPalOrder('PP-1');
    await capturePayPalOrder('PP-2');

    const oauthCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/v1/oauth2/token'));
    expect(oauthCalls).toHaveLength(1);
    const init = oauthCalls[0][1];
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from('cid:csecret').toString('base64')}`,
    );
    expect(init?.body).toBe('grant_type=client_credentials');
  });

  it('renueva el token 5 minutos antes de que expire', async () => {
    const { capturePayPalOrder } = await load();
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    fetchMock.mockImplementation(async (url) =>
      String(url).endsWith('/v1/oauth2/token') ? tokenResponse('tok', 600) : json({ status: 'COMPLETED' }),
    );

    await capturePayPalOrder('A');
    now.mockReturnValue(1_000_000 + 299_000); // dentro de la ventana (600 - 300 s)
    await capturePayPalOrder('B');
    now.mockReturnValue(1_000_000 + 300_000); // expirado
    await capturePayPalOrder('C');

    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/oauth2/token'))).toHaveLength(2);
  });

  it('lanza si OAuth responde error', async () => {
    const { createPayPalOrder } = await load();
    fetchMock.mockResolvedValue(new Response('invalid_client', { status: 401 }));
    await expect(createPayPalOrder(orderParams)).rejects.toThrow('PayPal OAuth failed: 401');
  });
});

describe('createPayPalOrder', () => {
  it('construye la orden con montos a 2 decimales, item_total, NO_SHIPPING y URLs del sitio', async () => {
    const { createPayPalOrder } = await load();
    fetchMock.mockResolvedValueOnce(tokenResponse('tok-xyz')).mockResolvedValueOnce(json({ id: 'PP-9', status: 'CREATED', links: [] }));

    const order = await createPayPalOrder(orderParams);

    expect(order.id).toBe('PP-9');
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe(`${BASE}/v2/checkout/orders`);
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok-xyz');
    const body = JSON.parse(init?.body as string);
    const unit = body.purchase_units[0];
    expect(body.intent).toBe('CAPTURE');
    expect(unit.reference_id).toBe('ORD-1');
    expect(unit.amount).toEqual({
      currency_code: 'USD',
      value: '55.30',
      breakdown: { item_total: { currency_code: 'USD', value: '55.30' } },
    });
    expect(unit.items[0]).toEqual({ name: 'Curso A', quantity: '3', unit_amount: { currency_code: 'USD', value: '10.10' } });
    expect(body.application_context).toMatchObject({
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      return_url: 'https://comoelmusguito.cl/api/checkout/callback?order=ORD-1',
      cancel_url: 'https://comoelmusguito.cl/checkout?cancelled=ORD-1',
    });
  });

  it('usa localhost si no hay NEXT_PUBLIC_SITE_URL', async () => {
    const { createPayPalOrder } = await load();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(json({ id: 'PP' }));
    await createPayPalOrder(orderParams);
    const body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(body.application_context.return_url).toMatch(/^http:\/\/localhost:3000\//);
  });

  it('lanza si PayPal rechaza la creación', async () => {
    const { createPayPalOrder } = await load();
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response('UNPROCESSABLE', { status: 422 }));
    await expect(createPayPalOrder(orderParams)).rejects.toThrow('PayPal create order failed: 422');
  });
});

describe('capturePayPalOrder', () => {
  it('hace POST al endpoint de captura y devuelve el resultado', async () => {
    const { capturePayPalOrder } = await load();
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(json({ id: 'PP-1', status: 'COMPLETED' }));
    await expect(capturePayPalOrder('PP-1')).resolves.toMatchObject({ status: 'COMPLETED' });
    expect(fetchMock.mock.calls[1][0]).toBe(`${BASE}/v2/checkout/orders/PP-1/capture`);
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
  });

  it('lanza si la captura falla', async () => {
    const { capturePayPalOrder } = await load();
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(new Response('INSTRUMENT_DECLINED', { status: 422 }));
    await expect(capturePayPalOrder('PP-1')).rejects.toThrow('PayPal capture failed: 422');
  });
});
