import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPurchaseEvent, hashEmail, sendMetaPurchase } from './meta-capi';

const order = {
  orderId: 'ORD-1',
  customerEmail: '  Ana@Test.CL ',
  total: 31980,
  currency: 'CLP' as const,
  paymentDate: '2026-10-26T15:00:00.000Z',
  items: [
    { _key: 'k1', id: 'p1', type: 'terrarium' as const, name: 'Terrario', slug: 't', price: 15990, currency: 'CLP' as const, quantity: 2 },
    { _key: 'k2', id: 'p2', type: 'course' as const, name: 'Curso', slug: 'c', price: 0, currency: 'CLP' as const, quantity: 1 },
  ],
  metaAttribution: { consent: true as const, fbp: 'fb.1.123.456', fbc: 'fb.1.123.AbC', clientIp: '200.1.2.3', userAgent: 'UA/1.0' },
};
const now = new Date('2026-10-26T16:00:00.000Z');

describe('hashEmail', () => {
  it('normaliza (trim + minúsculas) y aplica SHA-256 en hexadecimal', () => {
    expect(hashEmail('  Ana@Test.CL ')).toBe(hashEmail('ana@test.cl'));
    expect(hashEmail('ana@test.cl')).toMatch(/^[0-9a-f]{64}$/);
    // Valor de referencia: SHA-256 de "ana@test.cl" (el que Meta espera recibir)
    expect(hashEmail('ana@test.cl')).toBe('196e6933d2c26c532f30d088bc9dc0c3f5147037becea0a0fe393609c9223589');
  });
});

describe('buildPurchaseEvent', () => {
  const event = buildPurchaseEvent(order, 'https://comoelmusguito.cl/', now);

  it('usa el orderId como event_id para deduplicar con el Pixel del navegador', () => {
    expect(event).toMatchObject({ event_name: 'Purchase', event_id: 'ORD-1', action_source: 'website' });
    expect(event.event_source_url).toBe('https://comoelmusguito.cl/checkout/callback');
  });

  it('manda el email hasheado y nunca en claro', () => {
    expect(event.user_data.em).toEqual([hashEmail('ana@test.cl')]);
    expect(JSON.stringify(event)).not.toContain('ana@test.cl');
    expect(JSON.stringify(event).toLowerCase()).not.toContain('ana@test');
  });

  it('incluye los datos de atribución guardados al crear el pedido', () => {
    expect(event.user_data).toMatchObject({
      fbp: 'fb.1.123.456',
      fbc: 'fb.1.123.AbC',
      client_ip_address: '200.1.2.3',
      client_user_agent: 'UA/1.0',
    });
  });

  it('omite los campos de atribución que no existen', () => {
    const e = buildPurchaseEvent({ ...order, metaAttribution: undefined }, 'https://x.cl', now);
    expect(Object.keys(e.user_data)).toEqual(['em']);
  });

  it('arma custom_data con monto, moneda, productos y cantidad total', () => {
    expect(event.custom_data).toEqual({
      currency: 'CLP',
      value: 31980,
      content_type: 'product',
      content_ids: ['p1', 'p2'],
      contents: [
        { id: 'p1', quantity: 2, item_price: 15990 },
        { id: 'p2', quantity: 1, item_price: 0 },
      ],
      num_items: 3,
      order_id: 'ORD-1',
    });
  });

  it('usa la fecha de pago como event_time cuando es reciente', () => {
    expect(event.event_time).toBe(Math.floor(new Date(order.paymentDate).getTime() / 1000));
  });

  it('usa "ahora" si la fecha de pago falta, es futura, inválida o tiene más de 7 días', () => {
    const nowSec = Math.floor(now.getTime() / 1000);
    for (const paymentDate of [undefined, 'no-es-fecha', '2026-12-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z']) {
      expect(buildPurchaseEvent({ ...order, paymentDate }, 'https://x.cl', now).event_time).toBe(nowSec);
    }
  });

  it('respeta la moneda del pedido (USD)', () => {
    expect(buildPurchaseEvent({ ...order, currency: 'USD', total: 25.5 }, 'https://x.cl', now).custom_data).toMatchObject({
      currency: 'USD',
      value: 25.5,
    });
  });
});

describe('sendMetaPurchase', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'TOKEN-SECRETO');
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '999');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://comoelmusguito.cl');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('no hace nada sin token (dev, vistas previas, CI)', async () => {
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '');
    await sendMetaPurchase(order);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no hace nada si el comprador no aceptó las cookies publicitarias', async () => {
    await sendMetaPurchase({ ...order, metaAttribution: undefined });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no hace nada sin ID de Pixel', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '');
    await sendMetaPurchase(order);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía el evento a la Graph API; el token va en el cuerpo y no en la URL', async () => {
    await sendMetaPurchase(order);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graph.facebook.com/v25.0/999/events');
    expect(url).not.toContain('TOKEN-SECRETO');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.access_token).toBe('TOKEN-SECRETO');
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ event_name: 'Purchase', event_id: 'ORD-1' });
    expect(body.test_event_code).toBeUndefined();
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('agrega el código de prueba cuando está configurado', async () => {
    vi.stubEnv('META_CAPI_TEST_EVENT_CODE', 'TEST123');
    await sendMetaPurchase(order);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).test_event_code).toBe('TEST123');
  });

  it('nunca lanza: una respuesta de error de Meta solo se registra', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'Invalid parameter' });
    await expect(sendMetaPurchase(order)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('400'));
    expect(vi.mocked(console.error).mock.calls.flat().join(' ')).not.toContain('TOKEN-SECRETO');
  });

  it('nunca lanza: una caída de red o un timeout solo se registra', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    await expect(sendMetaPurchase(order)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('nunca lanza aunque el cuerpo del error no se pueda leer', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => { throw new Error('boom'); } });
    await expect(sendMetaPurchase(order)).resolves.toBeUndefined();
  });
});
