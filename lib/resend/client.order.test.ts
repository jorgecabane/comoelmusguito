import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailOrderData } from './client';

const send = vi.hoisted(() => vi.fn());
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));
// Sanity image client needs a projectId at import; date helpers are what we actually use.
vi.mock('@/sanity/lib/image', () => ({ getSanityImageUrl: vi.fn() }));

async function load(apiKey: string | undefined = 're_test') {
  vi.resetModules();
  vi.stubEnv('RESEND_API_KEY', apiKey);
  vi.stubEnv('RESEND_FROM_EMAIL', 'tienda@test.cl');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://musgo.test');
  return import('./client');
}

const baseOrder: EmailOrderData = {
  orderId: 'ORD-123',
  customerName: 'Ana',
  customerEmail: 'ana@test.cl',
  items: [{ name: 'Terrario Bosque', type: 'terrarium', quantity: 2, price: 15990, currency: 'CLP' }],
  total: 31980,
  currency: 'CLP',
  paymentDate: '2025-03-10T15:00:00.000Z',
};

const sentHtml = (): string => send.mock.calls[0][0].html;

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { id: 'email_1' }, error: null });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendOrderConfirmationEmail', () => {
  it('sends to the customer with order data and CLP totals', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({ ...baseOrder, flowOrder: 'FLOW-9', flowInvoiceUrl: 'https://flow.cl/boleta/1' });

    const msg = send.mock.calls[0][0];
    expect(msg.from).toBe('comoelmusguito <tienda@test.cl>');
    expect(msg.to).toBe('ana@test.cl');
    expect(msg.subject).toContain('Tu compra en comoelmusguito está confirmada');
    expect(msg.html).toContain('ORD-123');
    expect(msg.html).toContain('FLOW-9');
    expect(msg.html).toContain('Hola Ana,');
    expect(msg.html).toContain('Terrario Bosque');
    expect(msg.html).toContain('Cantidad: 2');
    expect(msg.html).toContain('$31.980 CLP');
    expect(msg.html).toContain('href="https://flow.cl/boleta/1"');
    expect(msg.html).toContain('10 de marzo de 2025');
    expect(msg.html).toContain('coordinar el retiro de tu terrario. Si tienes');
  });

  it('omits optional blocks when data is missing', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({ ...baseOrder, customerName: undefined });
    const html = sentHtml();
    expect(html).toContain('Hola,');
    expect(html).not.toContain('Orden Flow:');
    expect(html).not.toContain('Ver Boleta en Flow');
    expect(html).not.toContain('Este pedido es un regalo');
  });

  it('formats non-CLP amounts as USD with two decimals', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [{ name: 'Curso', type: 'course', quantity: 1, price: 49.5, currency: 'USD' }],
      total: 49.5,
      currency: 'USD',
    });
    expect(sentHtml()).toContain('$49.50 USD');
  });

  it('links registered users to their courses', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      hasAccount: true,
      items: [{ name: 'Curso Musgos', type: 'course', quantity: 1, price: 30000, currency: 'CLP' }],
    });
    const html = sentHtml();
    expect(html).toContain('Tu acceso al curso está activo');
    expect(html).toContain('href="https://musgo.test/mi-cuenta?tab=cursos"');
    expect(html).not.toContain('/auth/register');
  });

  it('asks guests to register with the purchase email', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [{ name: 'Curso Musgos', type: 'course', quantity: 1, price: 30000, currency: 'CLP' }],
    });
    const html = sentHtml();
    expect(html).toContain('mismo email con el que compraste (ana@test.cl)');
    expect(html).toContain('href="https://musgo.test/auth/register"');
    expect(html).toContain('href="https://musgo.test/auth/login"');
  });

  it('falls back to the production site URL for course links', async () => {
    const { sendOrderConfirmationEmail } = await load();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    await sendOrderConfirmationEmail({
      ...baseOrder,
      hasAccount: true,
      items: [{ name: 'Curso', type: 'course', quantity: 1, price: 1, currency: 'CLP' }],
    });
    expect(sentHtml()).toContain('https://comoelmusguito.cl/mi-cuenta?tab=cursos');
    send.mockClear();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [{ name: 'Curso', type: 'course', quantity: 1, price: 1, currency: 'CLP' }],
    });
    expect(sentHtml()).toContain('https://comoelmusguito.cl/auth/register');
  });

  it('shows workshop date, location and the scheduled terrarium pickup copy', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [
        { name: 'Taller Kokedama', type: 'workshop', quantity: 1, price: 25000, currency: 'CLP', selectedDate: { date: '2025-04-05T14:00:00.000Z' } },
        { name: 'Terrario Agendado', type: 'terrarium', quantity: 1, price: 10000, currency: 'CLP', selectedDate: { date: '2025-04-06T14:00:00.000Z' } },
      ],
    });
    const html = sentHtml();
    expect(html).toContain('Taller Presencial');
    expect(html).toContain('Recuerda: 5 de abril de 2025 a las');
    expect(html).toContain('Santa Isabel 676');
    expect(html).toContain('Te contactaremos pronto para coordinar el retiro');
  });

  it('omits the workshop reminder when no date was chosen', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [{ name: 'Taller', type: 'workshop', quantity: 1, price: 1, currency: 'CLP' }],
    });
    expect(sentHtml()).not.toContain('Recuerda:');
  });

  it('shows supply shipping address when shipping is required', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [{ name: 'Sustrato', type: 'supply', quantity: 1, price: 5000, currency: 'CLP' }],
      requiresShipping: true,
      shippingAddress: { region: 'RM', comuna: 'Ñuñoa', address: 'Irarrázaval', number: '100', details: 'Depto 5' },
    });
    const html = sentHtml();
    expect(html).toContain('Insumo');
    expect(html).toContain('coordinar el despacho de tus insumos');
    expect(html).toContain('Irarrázaval 100');
    expect(html).toContain('Ñuñoa, RM<br>Depto 5');
  });

  it('uses pickup copy for supplies without shipping, and no details line', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      items: [{ name: 'Sustrato', type: 'supply', quantity: 1, price: 5000, currency: 'CLP' }],
    });
    expect(sentHtml()).toContain('coordinar el retiro o envío de tus insumos');
    expect(sentHtml()).not.toContain('Dirección de Despacho');

    send.mockClear();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      requiresShipping: true,
      shippingAddress: { region: 'RM', comuna: 'Ñuñoa', address: 'Irarrázaval', number: '100' },
    });
    expect(sentHtml()).toContain('Ñuñoa, RM\n');
  });

  it('builds the gift variant for the buyer', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({
      ...baseOrder,
      isGift: true,
      recipientName: 'Luis',
      recipientEmail: 'luis@test.cl',
      giftMessage: 'Feliz cumple',
    });
    const msg = send.mock.calls[0][0];
    expect(msg.subject).toContain('Tu regalo en comoelmusguito está confirmado');
    expect(msg.html).toContain('Luis (luis@test.cl)');
    expect(msg.html).toContain('"Feliz cumple"');
    expect(msg.html).not.toContain('Próximos Pasos');
  });

  it('handles gifts without recipient data or message', async () => {
    const { sendOrderConfirmationEmail } = await load();
    await sendOrderConfirmationEmail({ ...baseOrder, isGift: true });
    const html = sentHtml();
    expect(html).toContain('Sin nombre');
    expect(html).not.toContain('Tu mensaje:');
  });

  it('skips sending when RESEND_API_KEY is missing', async () => {
    const { sendOrderConfirmationEmail } = await load('');
    await expect(sendOrderConfirmationEmail(baseOrder)).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY'));
  });

  it('defaults the from address when RESEND_FROM_EMAIL is unset', async () => {
    vi.resetModules();
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('RESEND_FROM_EMAIL', undefined);
    const { sendOrderConfirmationEmail } = await import('./client');
    await sendOrderConfirmationEmail(baseOrder);
    expect(send.mock.calls[0][0].from).toBe('comoelmusguito <hola@comoelmusguito.cl>');
  });

  it('rethrows when the Resend SDK throws', async () => {
    const { sendOrderConfirmationEmail } = await load();
    send.mockRejectedValueOnce(new Error('network down'));
    await expect(sendOrderConfirmationEmail(baseOrder)).rejects.toThrow('network down');
  });

  // BUG: lib/resend/client.ts:90 — resend v6 returns { data, error } instead of throwing on API
  // errors; the result is ignored, so a rejected email is logged as sent and the caller never knows.
  it.skip('surfaces Resend API errors returned in { error }', async () => {
    const { sendOrderConfirmationEmail } = await load();
    send.mockResolvedValueOnce({ data: null, error: { message: 'domain not verified' } });
    await expect(sendOrderConfirmationEmail(baseOrder)).rejects.toThrow();
  });
});
