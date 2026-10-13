import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const subscribeToNewsletter = vi.hoisted(() => vi.fn());
vi.mock('@/lib/sanity/newsletter', () => ({ subscribeToNewsletter }));

import { POST } from './route';

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/newsletter/subscribe', { method: 'POST', body: JSON.stringify(body) }));

let fetchSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  subscribeToNewsletter.mockReset().mockResolvedValue({ subscriberId: 's1' });
  fetchSpy = vi.spyOn(globalThis, 'fetch');
  vi.stubEnv('RECAPTCHA_SECRET_KEY', '');
});

describe('POST /api/newsletter/subscribe', () => {
  it.each([[{}], [{ email: 'nope' }]])('rejects invalid email %#', async (body) => {
    expect((await post(body)).status).toBe(400);
  });

  it('subscribes without captcha when no secret is configured, defaulting source', async () => {
    const res = await post({ email: 'a@x.cl', name: 'Ana' });
    expect(await res.json()).toMatchObject({ success: true, subscriberId: 's1' });
    expect(subscribeToNewsletter).toHaveBeenCalledWith({ email: 'a@x.cl', name: 'Ana', source: 'footer-home' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('passes an explicit source', async () => {
    await post({ email: 'a@x.cl', source: 'contact-page' });
    expect(subscribeToNewsletter).toHaveBeenCalledWith(expect.objectContaining({ source: 'contact-page' }));
  });

  it('reports already subscribed', async () => {
    subscribeToNewsletter.mockResolvedValue({ alreadySubscribed: true });
    expect(await (await post({ email: 'a@x.cl' })).json()).toMatchObject({ success: true, alreadySubscribed: true });
  });

  it('returns 500 when the subscription fails', async () => {
    subscribeToNewsletter.mockRejectedValue(new Error('db'));
    expect((await post({ email: 'a@x.cl' })).status).toBe(500);
  });

  it('returns 500 on malformed JSON (Error and non-Error)', async () => {
    const res = await POST(new NextRequest('http://localhost/x', { method: 'POST', body: '{' }));
    expect(res.status).toBe(500);
    const bad = { json: () => Promise.reject('x') } as unknown as NextRequest;
    expect(await (await POST(bad)).json()).toEqual({ error: 'Error al procesar la suscripción' });
  });

  describe('with reCAPTCHA configured', () => {
    beforeEach(() => vi.stubEnv('RECAPTCHA_SECRET_KEY', 'sk'));

    it('requires a token', async () => {
      const res = await post({ email: 'a@x.cl' });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'Verificación de seguridad requerida' });
    });

    it('accepts a passing score', async () => {
      fetchSpy.mockResolvedValue(Response.json({ success: true, score: 0.5 }));
      expect((await post({ email: 'a@x.cl', recaptchaToken: 'rt' })).status).toBe(200);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        expect.objectContaining({ body: 'secret=sk&response=rt' })
      );
    });

    it.each([[{ success: true, score: 0.49 }], [{ success: false }]])('rejects %j', async (data) => {
      fetchSpy.mockResolvedValue(Response.json(data));
      expect((await post({ email: 'a@x.cl', recaptchaToken: 'rt' })).status).toBe(400);
      expect(subscribeToNewsletter).not.toHaveBeenCalled();
    });

    it('fails closed when Google is unreachable', async () => {
      fetchSpy.mockRejectedValue(new Error('net'));
      expect((await post({ email: 'a@x.cl', recaptchaToken: 'rt' })).status).toBe(400);
    });
  });
});
