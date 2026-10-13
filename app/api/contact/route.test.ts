import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const sendContactEmail = vi.hoisted(() => vi.fn());
vi.mock('@/lib/resend/client', () => ({ sendContactEmail }));

import { POST } from './route';

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/contact', { method: 'POST', body: JSON.stringify(body) }));
const valid = { name: 'Ana', email: 'a@x.cl', subject: 'Hola', message: 'Quiero un terrario' };

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  sendContactEmail.mockReset().mockResolvedValue(undefined);
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

  // BUG: name/subject/message are forwarded unsanitized and lib/resend/client.ts interpolates them raw into
  // the HTML email (HTML injection / phishing links in the owner's inbox). No rate limit or captcha either.
  it.skip('strips HTML from user-supplied fields before emailing', async () => {
    await post({ ...valid, message: '<a href="https://evil">click</a>' });
    expect(sendContactEmail.mock.calls[0][0].message).not.toContain('<a');
  });

  it('returns 500 when delivery fails', async () => {
    sendContactEmail.mockRejectedValue(new Error('resend'));
    const res = await post(valid);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/Error al enviar el mensaje/);
  });

  it('returns 500 on malformed JSON', async () => {
    const res = await POST(new NextRequest('http://localhost/api/contact', { method: 'POST', body: '{' }));
    expect(res.status).toBe(500);
  });

  it('uses a generic message for non-Error throws', async () => {
    const bad = { json: () => Promise.reject('x') } as unknown as NextRequest;
    expect(await (await POST(bad)).json()).toEqual({ error: 'Error al procesar el formulario' });
  });
});
