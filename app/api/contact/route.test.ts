import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const sendContactEmail = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resend/client', () => ({ sendContactEmail }));
const applyRateLimit = vi.hoisted(() => vi.fn());
vi.mock('@/lib/rate-limit/upstash', () => ({
  contactRateLimit: 'contact-limiter',
  getClientIP: () => '1.2.3.4',
  applyRateLimit,
}));

import { POST } from './route';

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/contact', { method: 'POST', body: JSON.stringify(body) }));
const valid = { name: 'Ana', email: 'a@x.cl', subject: 'Hola', message: 'Quiero un terrario' };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  sendContactEmail.mockReset().mockResolvedValue(undefined);
  applyRateLimit.mockReset().mockResolvedValue({ success: true });
});

describe('POST /api/contact', () => {
  it.each(['name', 'email', 'subject', 'message'])('requires %s', async (field) => {
    const res = await post({ ...valid, [field]: '' });
    expect(res.status).toBe(400);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('rejects emails without @', async () => {
    const res = await post({ ...valid, email: 'nope' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Email inválido' });
  });

  it('sends the email and normalizes empty phone to undefined', async () => {
    const res = await post({ ...valid, phone: '' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true });
    expect(sendContactEmail).toHaveBeenCalledWith({ ...valid, phone: undefined });
  });

  it('passes the phone through when present', async () => {
    await post({ ...valid, phone: '+56 9 1234' });
    expect(sendContactEmail).toHaveBeenCalledWith(expect.objectContaining({ phone: '+56 9 1234' }));
  });

  // El HTML se escapa al renderizar el email (lib/resend/client.ts, ver client.contact-gift.test.ts):
  // la ruta reenvía el texto tal cual para no mutilar mensajes legítimos que contengan "<" o ">".
  it('forwards the raw text so the email renderer can escape it', async () => {
    await post({ ...valid, message: '<a href="https://evil">click</a>' });
    expect(sendContactEmail.mock.calls[0][0].message).toBe('<a href="https://evil">click</a>');
  });

  it('rate limits by client IP with the contact limiter', async () => {
    applyRateLimit.mockResolvedValueOnce({ success: false });
    const res = await post(valid);
    expect(res.status).toBe(429);
    expect(applyRateLimit).toHaveBeenCalledWith('contact-limiter', '1.2.3.4');
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('allows the request when the limiter falls back (no Upstash)', async () => {
    applyRateLimit.mockResolvedValueOnce(null);
    expect((await post(valid)).status).toBe(200);
  });

  it.each([
    ['name', 101],
    ['email', 255],
    ['phone', 31],
    ['subject', 201],
    ['message', 5001],
  ])('rejects %s longer than the cap', async (field, length) => {
    const res = await post({ ...valid, [field]: 'a'.repeat(length - 1) + '@' });
    expect(res.status).toBe(400);
    expect(sendContactEmail).not.toHaveBeenCalled();
  });

  it('accepts fields at the cap', async () => {
    const res = await post({ ...valid, message: 'a'.repeat(5000) });
    expect(res.status).toBe(200);
  });

  it('returns 500 when delivery fails', async () => {
    sendContactEmail.mockRejectedValue(new Error('resend'));
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/Error al enviar el mensaje/);
  });

  it('returns a generic 500 on malformed JSON without parser details', async () => {
    const res = await POST(new NextRequest('http://localhost/api/contact', { method: 'POST', body: '{' }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error al procesar el formulario' });
  });
});
