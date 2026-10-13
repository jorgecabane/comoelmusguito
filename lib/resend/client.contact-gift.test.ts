import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiftEmailData } from './client';

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

beforeEach(() => {
  send.mockReset().mockResolvedValue({ data: { id: 'email_1' }, error: null });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sendContactEmail', () => {
  const contact = { name: 'Ana', email: 'ana@test.cl', phone: '+56911112222', subject: 'Pedido', message: 'Hola!' };

  it('notifies the shop and confirms to the user', async () => {
    const { sendContactEmail } = await load();
    vi.stubEnv('CONTACT_EMAIL', 'admin@test.cl');
    vi.stubEnv('NEXT_PUBLIC_PHONE_NUMBER', '+56966563208');
    await sendContactEmail(contact);

    expect(send).toHaveBeenCalledTimes(2);
    const [toShop, toUser] = send.mock.calls.map((c) => c[0]);
    expect(toShop).toMatchObject({ from: 'tienda@test.cl', to: 'admin@test.cl', replyTo: 'ana@test.cl', subject: '[Contacto] Pedido' });
    expect(toShop.html).toContain('href="tel:+56911112222"');
    expect(toShop.html).toContain('Hola!');
    expect(toUser).toMatchObject({ to: 'ana@test.cl', subject: 'Hemos recibido tu mensaje - Como el Musguito' });
    expect(toUser.html).toContain('<strong>Pedido</strong>');
    expect(toUser.html).toContain('href="tel:+56966563208"');
    expect(toUser.html).toContain('+56 9 6656 3208');
  });

  it('uses default addresses and omits the phone row when absent', async () => {
    const { sendContactEmail } = await load();
    vi.stubEnv('RESEND_FROM_EMAIL', undefined);
    vi.stubEnv('CONTACT_EMAIL', undefined);
    await sendContactEmail({ ...contact, phone: undefined });
    const toShop = send.mock.calls[0][0];
    expect(toShop).toMatchObject({ from: 'hola@comoelmusguito.cl', to: 'hola@comoelmusguito.cl' });
    expect(toShop.html).not.toContain('Teléfono:');
  });

  it('throws when Resend is not configured', async () => {
    const { sendContactEmail } = await load('');
    await expect(sendContactEmail(contact)).rejects.toThrow('Resend no está configurado');
    expect(send).not.toHaveBeenCalled();
  });

  // BUG: lib/resend/client.ts:735 — public contact-form fields (name, subject, message) are
  // interpolated into the HTML unescaped, allowing HTML injection into the shop's and user's inbox.
  it.skip('escapes user-supplied HTML', async () => {
    const { sendContactEmail } = await load();
    await sendContactEmail({ ...contact, message: '<img src=x onerror=alert(1)>' });
    expect(send.mock.calls[0][0].html).not.toContain('<img src=x');
  });
});

describe('sendGiftEmail', () => {
  const gift: GiftEmailData = {
    giftToken: 'GIFT-ABC',
    recipientName: 'Luis',
    recipientEmail: 'luis@test.cl',
    senderName: 'Ana',
    senderEmail: 'ana@test.cl',
    giftMessage: 'Disfrútalo',
    orderId: 'ORD-1',
    items: [
      { name: 'Curso Musgos', type: 'course', quantity: 2, price: 1, currency: 'CLP' },
      { name: 'Taller Kokedama', type: 'workshop', quantity: 2, price: 1, currency: 'CLP', selectedDate: { date: '2025-04-05T14:00:00.000Z' } },
      { name: 'Terrario Bosque', type: 'terrarium', quantity: 3, price: 1, currency: 'CLP', selectedDate: { date: '2025-04-06T14:00:00.000Z' } },
      { name: 'Sustrato', type: 'supply', quantity: 4, price: 1, currency: 'CLP' },
    ],
    requiresShipping: true,
    shippingAddress: { region: 'RM', comuna: 'Ñuñoa', address: 'Irarrázaval', number: '100', details: 'Depto 5' },
  };

  it('sends the redeem code and item list to the recipient', async () => {
    const { sendGiftEmail } = await load();
    await sendGiftEmail(gift);

    const msg = send.mock.calls[0][0];
    expect(msg).toMatchObject({ from: 'comoelmusguito <tienda@test.cl>', to: 'luis@test.cl' });
    expect(msg.subject).toBe('¡Tienes un regalo de Ana! 🎁');
    const { html } = msg;
    expect(html).toContain('GIFT-ABC');
    expect(html).toContain('¡Hola Luis!');
    expect(html).toContain('<strong>Ana</strong>');
    expect(html).toContain('"Disfrútalo"');
    expect(html).toContain('• Curso Musgos x2');
    expect(html).toContain('• Taller Kokedama - 5 de abril de 2025 x2');
    expect(html).toContain('• Terrario Bosque x3');
    expect(html).toContain('• Sustrato x4');
    expect(html).toContain('href="https://musgo.test/mi-cuenta"');
    expect(html).toContain('href="https://musgo.test/auth/register"');
    expect(html).toContain('href="https://musgo.test/mi-cuenta?filter=courses"');
    expect(html).toContain('Recuerda: 5 de abril de 2025 a las');
    expect(html).toContain('Te contactaremos pronto para coordinar el retiro');
    expect(html).toContain('Irarrázaval 100');
    expect(html).toContain('Ñuñoa, RM<br>Depto 5');
  });

  it('handles minimal gifts with anonymous sender and no extras', async () => {
    const { sendGiftEmail } = await load();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    await sendGiftEmail({
      ...gift,
      recipientName: undefined,
      senderName: undefined,
      giftMessage: undefined,
      requiresShipping: false,
      items: [
        { name: 'Taller Solo', type: 'workshop', quantity: 1, price: 1, currency: 'CLP' },
        { name: 'Terrario Solo', type: 'terrarium', quantity: 1, price: 1, currency: 'CLP' },
      ],
    });
    const msg = send.mock.calls[0][0];
    expect(msg.subject).toBe('¡Tienes un regalo de alguien especial! 🎁');
    const { html } = msg;
    expect(html).toContain('¡Hola!');
    expect(html).toContain('<strong>ana@test.cl</strong>');
    expect(html).toContain('• Taller Solo</p>');
    expect(html).toContain('• Terrario Solo</p>');
    expect(html).toContain('https://comoelmusguito.cl/mi-cuenta');
    expect(html).toContain('coordinar el retiro de tu terrario. Si tienes');
    expect(html).not.toContain('Recuerda:');
    expect(html).not.toContain('Dirección de Despacho');
    expect(html).not.toContain('Cursos Online:');
    expect(html).not.toContain('Insumos:');
  });

  it('omits the shipping details line when not provided', async () => {
    const { sendGiftEmail } = await load();
    await sendGiftEmail({ ...gift, shippingAddress: { ...gift.shippingAddress!, details: undefined } });
    expect(send.mock.calls[0][0].html).toContain('Ñuñoa, RM\n');
  });

  it('skips sending without an API key', async () => {
    const { sendGiftEmail } = await load('');
    await sendGiftEmail(gift);
    expect(send).not.toHaveBeenCalled();
  });

  it('rethrows SDK failures', async () => {
    const { sendGiftEmail } = await load();
    send.mockRejectedValueOnce(new Error('boom'));
    await expect(sendGiftEmail(gift)).rejects.toThrow('boom');
  });
});
