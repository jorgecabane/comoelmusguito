import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem } from '@/types/cart';
import { createPaymentOrder } from '@/lib/flow/client';
import { saveOrderToSanity } from '@/lib/sanity/orders';
import { calculateOrderTotals, CheckoutValidationError } from '@/lib/checkout/calculateOrderTotals';
import { POST } from './route';

vi.mock('@/lib/flow/client', () => ({ createPaymentOrder: vi.fn() }));
vi.mock('@/lib/utils/geolocation', () => ({ getUserCurrency: vi.fn(async () => 'CLP') }));
vi.mock('@/lib/sanity/orders', () => ({ saveOrderToSanity: vi.fn() }));
vi.mock('@/lib/utils/gift-token', () => ({ generateGiftToken: () => 'gift-tok' }));
// Solo usamos CheckoutValidationError del módulo real; sus dependencias quedan vacías.
vi.mock('@/lib/sanity/fetch', () => ({}));
vi.mock('@/lib/sanity/inventory', () => ({}));
vi.mock('@/lib/sanity/utils', () => ({}));
vi.mock('@/lib/checkout/calculateOrderTotals', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/checkout/calculateOrderTotals')>()),
  calculateOrderTotals: vi.fn(),
}));

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

const cartItem = (over: Partial<CartItem> = {}): CartItem => ({
  id: 't1',
  type: 'terrarium',
  name: 'Terrario Bosque',
  slug: 'bosque',
  image: '',
  price: 25990,
  currency: 'CLP',
  quantity: 1,
  inStock: true,
  ...over,
});

const shipping = {
  region: ' RM ',
  comuna: ' Ñuñoa ',
  address: ' Av. Siempre Viva ',
  number: ' 742 ',
  details: ' Depto 3 ',
  contactEmail: ' Juan@Mail.CL ',
  phone: ' +56911112222 ',
  rut: ' 11.111.111-1 ',
};

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify(body) }));

const base = { items: [cartItem()], email: 'comprador@mail.cl' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://comoelmusguito.cl');
  m(calculateOrderTotals).mockImplementation(async ({ items }: { items: CartItem[] }) => ({
    validatedItems: items,
    total: 25990.4,
    currency: 'CLP',
  }));
  m(createPaymentOrder).mockResolvedValue({ url: 'https://flow/pay', token: 'tk', flowOrder: 'F1' });
});

describe('POST /api/checkout — validaciones de entrada', () => {
  it.each([
    ['carrito vacío', { ...base, items: [] }, 'El carrito está vacío'],
    ['sin items', { email: 'a@b.cl' }, 'El carrito está vacío'],
    ['email inválido', { ...base, email: 'nope' }, 'Email válido requerido'],
    ['regalo sin destinatario', { ...base, isGift: true }, 'Email del destinatario es requerido para regalos'],
    ['regalo con email mal formado', { ...base, isGift: true, recipientEmail: 'a@b' }, 'Email del destinatario inválido'],
    [
      'mensaje de regalo > 500',
      { ...base, isGift: true, recipientEmail: 'r@x.cl', giftMessage: 'x'.repeat(501) },
      'El mensaje personalizado no puede exceder 500 caracteres',
    ],
    ['regalo a sí mismo', { ...base, isGift: true, recipientEmail: 'COMPRADOR@mail.cl' }, 'No puedes regalarte algo a ti mismo'],
    ['despacho sin dirección', { ...base, requiresShipping: true }, 'Dirección de despacho es requerida'],
    [
      'despacho con campos faltantes',
      { ...base, requiresShipping: true, shippingAddress: { ...shipping, comuna: '' } },
      'Todos los campos de dirección son requeridos para despacho',
    ],
    [
      'dirección solo espacios',
      { ...base, requiresShipping: true, shippingAddress: { ...shipping, address: '   ' } },
      'Dirección y número no pueden estar vacíos',
    ],
    [
      'email de contacto inválido',
      { ...base, requiresShipping: true, shippingAddress: { ...shipping, contactEmail: 'x' } },
      'Email de contacto válido es requerido para despacho',
    ],
    [
      'sin teléfono',
      { ...base, requiresShipping: true, shippingAddress: { ...shipping, phone: ' ' } },
      'Teléfono de contacto es requerido para despacho',
    ],
    ['sin RUT', { ...base, requiresShipping: true, shippingAddress: { ...shipping, rut: '' } }, 'RUT es requerido para despacho'],
    ['más de 20 productos', { ...base, items: Array.from({ length: 21 }, () => cartItem()) }, 'Máximo 20 productos por orden'],
  ])('400 si %s', async (_label, body, error) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(calculateOrderTotals).not.toHaveBeenCalled();
    expect(saveOrderToSanity).not.toHaveBeenCalled();
  });

  it('acepta exactamente 20 productos (límite inclusivo)', async () => {
    const res = await post({ ...base, items: Array.from({ length: 20 }, () => cartItem({ quantity: 10 })) });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/checkout — errores de validación de totales', () => {
  it('devuelve el status y los datos del item con problema de stock', async () => {
    m(calculateOrderTotals).mockRejectedValue(
      new CheckoutValidationError(400, 'Sin stock', { outOfStock: true, itemId: 't1', itemType: 'terrarium', itemName: 'T' }),
    );
    const res = await post(base);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Sin stock',
      availabilityIssue: true,
      itemId: 't1',
      itemType: 'terrarium',
      itemName: 'T',
      outOfStock: true,
    });
  });

  it('availabilityIssue sin outOfStock no expone outOfStock', async () => {
    m(calculateOrderTotals).mockRejectedValue(new CheckoutValidationError(400, 'Fecha pasada', { availabilityIssue: true, itemId: 'w' }));
    const body = await (await post(base)).json();
    expect(body).toMatchObject({ availabilityIssue: true, itemId: 'w' });
    expect(body).not.toHaveProperty('outOfStock');
  });

  it('error genérico de validación solo trae el mensaje', async () => {
    m(calculateOrderTotals).mockRejectedValue(new CheckoutValidationError(400, 'Precio inválido'));
    const res = await post(base);
    expect(await res.json()).toEqual({ error: 'Precio inválido' });
  });

  it('errores inesperados devuelven 500 genérico sin detalles internos', async () => {
    m(calculateOrderTotals).mockRejectedValue(new Error('FLOW_API_KEY no está configurada'));
    const res = await post(base);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error al procesar el pago' });
  });
});

describe('POST /api/checkout — Flow', () => {
  it('crea la orden en Flow con monto entero redondeado y la guarda con flowOrder', async () => {
    const res = await post({ ...base, userId: 'u1', customerName: 'Juan' });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, gateway: 'flow', paymentUrl: 'https://flow/pay', token: 'tk', flowOrder: 'F1' });
    expect(body.commerceOrder).toMatch(/^ORD-\d{13}-[0-9a-f]{12}$/);
    expect(body.commerceOrder.length).toBeLessThanOrEqual(45);
    expect(calculateOrderTotals).toHaveBeenCalledWith({ items: base.items, gateway: 'flow', isGift: false, userCurrency: 'CLP' });

    const flowArgs = m(createPaymentOrder).mock.calls[0][0];
    expect(flowArgs).toMatchObject({
      commerceOrder: body.commerceOrder,
      subject: 'Terrario Bosque',
      currency: 'CLP',
      amount: 25990,
      email: 'comprador@mail.cl',
      paymentMethod: 9,
      urlReturn: `https://comoelmusguito.cl/api/checkout/callback?order=${body.commerceOrder}`,
      urlConfirmation: 'https://comoelmusguito.cl/api/webhooks/flow',
    });

    expect(saveOrderToSanity).toHaveBeenCalledTimes(1);
    expect(m(saveOrderToSanity).mock.calls[0][0]).toMatchObject({
      orderId: body.commerceOrder,
      flowOrder: 'F1',
      total: 25990.4,
      currency: 'CLP',
      paymentProvider: 'flow',
      userId: 'u1',
      isGift: false,
      requiresShipping: false,
      shippingAddress: undefined,
      giftToken: undefined,
    });
  });

  it('usa un subject genérico con varios productos y localhost sin NEXT_PUBLIC_SITE_URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    await post({ ...base, items: [cartItem(), cartItem({ id: 't2' })] });
    expect(m(createPaymentOrder).mock.calls[0][0]).toMatchObject({
      subject: '2 productos - comoelmusguito',
      urlConfirmation: 'http://localhost:3000/api/webhooks/flow',
    });
  });

  it('500 y no guarda la orden si Flow no entrega URL de pago', async () => {
    m(createPaymentOrder).mockResolvedValue({ token: 'tk' });
    const res = await post(base);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'No se pudo generar la URL de pago' });
    expect(saveOrderToSanity).not.toHaveBeenCalled();
  });

  it('500 si Flow falla', async () => {
    m(createPaymentOrder).mockRejectedValue(new Error('Flow 401'));
    const res = await post(base);
    expect(res.status).toBe(500);
    expect(saveOrderToSanity).not.toHaveBeenCalled();
  });

  it('normaliza la dirección de despacho y datos de regalo', async () => {
    await post({
      ...base,
      requiresShipping: true,
      shippingAddress: shipping,
      isGift: true,
      recipientEmail: 'Amiga@Mail.CL',
      recipientName: ' <b>Ana</b> ',
      giftMessage: ' Feliz <cumple> ',
    });
    expect(m(saveOrderToSanity).mock.calls[0][0]).toMatchObject({
      isGift: true,
      giftToken: 'gift-tok',
      recipientEmail: 'amiga@mail.cl',
      recipientName: 'bAna/b',
      giftMessage: 'Feliz cumple',
      requiresShipping: true,
      shippingAddress: {
        region: 'RM',
        comuna: 'Ñuñoa',
        address: 'Av. Siempre Viva',
        number: '742',
        details: 'Depto 3',
        contactEmail: 'juan@mail.cl',
        phone: '+56911112222',
        rut: '11.111.111-1',
      },
    });
  });

  it('details vacío queda undefined', async () => {
    await post({ ...base, requiresShipping: true, shippingAddress: { ...shipping, details: undefined } });
    expect(m(saveOrderToSanity).mock.calls[0][0].shippingAddress.details).toBeUndefined();
  });
});

describe('POST /api/checkout — PayPal', () => {
  it('guarda la orden sin llamar a Flow y devuelve total/currency', async () => {
    m(calculateOrderTotals).mockResolvedValue({ validatedItems: base.items, total: 27.36, currency: 'USD' });
    const res = await post({ ...base, gateway: 'paypal' });
    const body = await res.json();

    expect(body).toMatchObject({ success: true, gateway: 'paypal', total: 27.36, currency: 'USD' });
    expect(createPaymentOrder).not.toHaveBeenCalled();
    expect(m(saveOrderToSanity).mock.calls[0][0]).toMatchObject({
      orderId: body.commerceOrder,
      paymentProvider: 'paypal',
      total: 27.36,
      currency: 'USD',
    });
    expect(m(saveOrderToSanity).mock.calls[0][0]).not.toHaveProperty('flowOrder');
  });
});

describe('POST /api/checkout — atribución de Meta', () => {
  const postWith = (body: unknown, headers: Record<string, string>) =>
    POST(new NextRequest('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify(body), headers }));

  it('guarda las cookies de Meta, la IP y el navegador del comprador junto a la orden (Flow)', async () => {
    await postWith(base, {
      cookie: 'cem_consent=ads; _fbp=fb.1.111.222; _fbc=fb.1.111.AbC; otra=x',
      'x-forwarded-for': '200.1.2.3, 10.0.0.1',
      'user-agent': 'Mozilla/5.0 Test',
    });
    expect(m(saveOrderToSanity).mock.calls[0][0].metaAttribution).toEqual({
      consent: true,
      fbp: 'fb.1.111.222',
      fbc: 'fb.1.111.AbC',
      clientIp: '200.1.2.3',
      userAgent: 'Mozilla/5.0 Test',
    });
  });

  it('también la guarda con PayPal', async () => {
    m(calculateOrderTotals).mockResolvedValue({ validatedItems: base.items, total: 27.36, currency: 'USD' });
    await postWith({ ...base, gateway: 'paypal' }, { cookie: 'cem_consent=ads; _fbp=fb.1.1.2' });
    expect(m(saveOrderToSanity).mock.calls[0][0].metaAttribution).toMatchObject({ fbp: 'fb.1.1.2' });
  });

  it('sin consentimiento no guarda datos de Meta, aunque existan sus cookies', async () => {
    await postWith(base, { cookie: '_fbp=fb.1.1.2; cem_consent=none', 'x-forwarded-for': '200.1.2.3' });
    expect(m(saveOrderToSanity).mock.calls[0][0].metaAttribution).toBeUndefined();
  });

  it('no rompe el checkout si no hay datos de Meta (sin cookies de Meta)', async () => {
    const res = await post(base);
    expect(res.status).toBe(200);
    expect(m(saveOrderToSanity).mock.calls[0][0].metaAttribution).toBeUndefined();
  });
});
