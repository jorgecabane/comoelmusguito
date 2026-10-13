import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

const API_KEY = 'api-key-1';
const SECRET = 'secret-1';
const hmac = (s: string) => crypto.createHmac('sha256', SECRET).update(s, 'utf8').digest('hex');

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

async function load(env: 'sandbox' | 'production' = 'sandbox') {
  vi.resetModules();
  vi.stubEnv('FLOW_ENV', env);
  return import('./client');
}

let fetchMock: MockInstance<typeof fetch>;

beforeEach(() => {
  vi.stubEnv('FLOW_API_KEY', API_KEY);
  vi.stubEnv('FLOW_SECRET_KEY', SECRET);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock = vi.spyOn(globalThis, 'fetch');
});

const orderParams = {
  commerceOrder: 'ORD-1',
  subject: 'Terrario',
  currency: 'CLP' as const,
  amount: 25990,
  email: 'a@b.cl',
  urlReturn: 'https://site.cl/api/checkout/callback?order=ORD-1',
};

describe('credenciales', () => {
  it.each([
    ['FLOW_API_KEY', /FLOW_API_KEY/],
    ['FLOW_SECRET_KEY', /FLOW_SECRET_KEY/],
  ])('lanza si falta %s y no llama a Flow', async (name, msg) => {
    const { createPaymentOrder, getPaymentStatus, getPaymentStatusByOrder } = await load();
    vi.stubEnv(name, '');
    await expect(createPaymentOrder(orderParams)).rejects.toThrow(msg);
    await expect(getPaymentStatus('t')).rejects.toThrow(msg);
    await expect(getPaymentStatusByOrder('o')).rejects.toThrow(msg);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('createPaymentOrder', () => {
  it('envía form-urlencoded firmado con HMAC-SHA256 al sandbox y devuelve url/token', async () => {
    const { createPaymentOrder } = await load();
    fetchMock.mockResolvedValue(jsonResponse({ token: 'tk', url: 'https://pay', flowOrder: 99, status: 1 }));

    const res = await createPaymentOrder({ ...orderParams, urlConfirmation: 'https://site.cl/wh', paymentMethod: 9 });

    expect(res).toEqual({ token: 'tk', url: 'https://pay', flowOrder: 99, status: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://sandbox.flow.cl/api/payment/create');
    expect(init?.method).toBe('POST');
    const body = new URLSearchParams(init?.body as string);
    expect(body.get('amount')).toBe('25990');
    expect(body.get('currency')).toBe('CLP');
    expect(body.get('paymentMethod')).toBe('9');
    // La firma se calcula sobre valores sin codificar, ordenados alfabéticamente.
    const expected = hmac(
      `amount=25990&apiKey=${API_KEY}&commerceOrder=ORD-1&currency=CLP&email=a@b.cl&paymentMethod=9` +
        `&subject=Terrario&urlConfirmation=https://site.cl/wh&urlReturn=${orderParams.urlReturn}`,
    );
    expect(body.get('s')).toBe(expected);
  });

  it('omite urlConfirmation y paymentMethod cuando no vienen', async () => {
    const { createPaymentOrder } = await load();
    fetchMock.mockResolvedValue(jsonResponse({ token: 'tk', url: 'u', status: 1 }));
    await createPaymentOrder(orderParams);
    const body = new URLSearchParams(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.has('urlConfirmation')).toBe(false);
    expect(body.has('paymentMethod')).toBe(false);
  });

  it('usa la API de producción cuando FLOW_ENV=production', async () => {
    const { createPaymentOrder } = await load('production');
    fetchMock.mockResolvedValue(jsonResponse({ url: 'u', status: 1 }));
    await createPaymentOrder(orderParams);
    expect(fetchMock.mock.calls[0][0]).toBe('https://www.flow.cl/api/payment/create');
  });

  it.each([
    ['HTTP no-ok con mensaje', jsonResponse({ message: 'apiKey not found' }, 401), 'apiKey not found'],
    ['status=0 en 200', jsonResponse({ status: 0 }), 'Error al crear orden de pago en Flow'],
  ])('lanza ante %s', async (_label, response, msg) => {
    const { createPaymentOrder } = await load();
    fetchMock.mockResolvedValue(response);
    await expect(createPaymentOrder(orderParams)).rejects.toThrow(msg);
  });

  it('propaga errores de red', async () => {
    const { createPaymentOrder } = await load();
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));
    await expect(createPaymentOrder(orderParams)).rejects.toThrow('ECONNRESET');
  });
});

describe.each([
  ['getPaymentStatus', 'payment/getStatus', 'token', 'tok-1'],
  ['getPaymentStatusByOrder', 'payment/getStatusByCommerceId', 'commerceId', 'ORD-1'],
] as const)('%s', (fn, endpoint, param, arg) => {
  const call = async (env?: 'production') => (await load(env))[fn](arg);

  it(`hace GET firmado a ${endpoint} con ${param}`, async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: 2, amount: 25990, currency: 'CLP', commerceOrder: 'ORD-1', flowOrder: '7', payer: 'p@x.cl' }),
    );
    const res = await call();

    const url = new URL(fetchMock.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe(`https://sandbox.flow.cl/api/${endpoint}`);
    expect(url.searchParams.get(param)).toBe(arg);
    expect(url.searchParams.get('s')).toBe(hmac(`apiKey=${API_KEY}&${param}=${arg}`));
    expect(res).toMatchObject({ status: 2, amount: 25990, currency: 'CLP', commerceOrder: 'ORD-1', flowOrder: '7' });
    expect(res.paymentDate).toBeUndefined();
  });

  it('usa producción con FLOW_ENV=production', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 1 }));
    await call('production');
    expect(fetchMock.mock.calls[0][0]).toMatch(/^https:\/\/www\.flow\.cl\/api\//);
  });

  it.each([
    ['verano (UTC-3)', '2024-01-15 10:30:00', '2024-01-15T13:30:00.000Z'],
    ['invierno (UTC-4)', '2024-07-15 10:30:00', '2024-07-15T14:30:00.000Z'],
  ])('convierte paymentData.date de hora Santiago a ISO UTC en %s', async (_l, date, iso) => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 2, paymentData: { date } }));
    const res = await call();
    expect(res.paymentDate).toBe(iso);
    expect(res.paymentData).toEqual({ date });
  });

  it('cae a paymentDate raíz si no hay paymentData.date', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 2, paymentDate: '2024-01-15 00:00:00' }));
    expect((await call()).paymentDate).toBe('2024-01-15T03:00:00.000Z');
  });

  it('devuelve paymentDate undefined si la fecha es inválida', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 2, paymentData: { date: 'no-es-fecha' } }));
    expect((await call()).paymentDate).toBeUndefined();
  });

  it.each([
    ['HTTP no-ok', jsonResponse({ message: 'token inválido' }, 400), 'token inválido'],
    ['status=0', jsonResponse({ status: 0 }), 'Error al consultar estado del pago'],
  ])('lanza ante %s', async (_l, response, msg) => {
    fetchMock.mockResolvedValue(response);
    await expect(call()).rejects.toThrow(msg);
  });
});
