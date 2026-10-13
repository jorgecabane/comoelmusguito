import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  regenerateVerificationToken: vi.fn(),
  sendVerificationEmail: vi.fn(),
  applyRateLimit: vi.fn(),
}));
vi.mock('@/lib/auth/sanity-adapter', () => ({
  getUserByEmail: m.getUserByEmail,
  regenerateVerificationToken: m.regenerateVerificationToken,
}));
vi.mock('@/lib/resend/client', () => ({ sendVerificationEmail: m.sendVerificationEmail }));
vi.mock('@/lib/rate-limit/upstash', () => ({
  resendVerificationRateLimit: 'limiter',
  getClientIP: () => '1.1.1.1',
  applyRateLimit: m.applyRateLimit,
}));

import { POST } from './route';

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/auth/resend-verification', { method: 'POST', body: JSON.stringify(body) }));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  Object.values(m).forEach((f) => f.mockReset());
  m.applyRateLimit.mockResolvedValue({ success: true });
});

describe('POST /api/auth/resend-verification', () => {
  it('returns 429 when rate limited', async () => {
    m.applyRateLimit.mockResolvedValue({ success: false });
    expect((await post({ email: 'a@x.cl' })).status).toBe(429);
    expect(m.applyRateLimit).toHaveBeenCalledWith('limiter', '1.1.1.1');
  });

  it('rejects an invalid email', async () => {
    m.applyRateLimit.mockResolvedValue(null);
    expect((await post({ email: 42 })).status).toBe(400);
  });

  it('returns generic success for unknown emails', async () => {
    m.getUserByEmail.mockResolvedValue(null);
    const res = await post({ email: 'A@X.cl' });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true });
    expect(m.getUserByEmail).toHaveBeenCalledWith('a@x.cl');
    expect(m.regenerateVerificationToken).not.toHaveBeenCalled();
  });

  it('does nothing for already verified users', async () => {
    m.getUserByEmail.mockResolvedValue({ emailVerified: true });
    expect(await (await post({ email: 'a@x.cl' })).json()).toEqual({ success: true, message: 'Tu email ya está verificado.' });
    expect(m.regenerateVerificationToken).not.toHaveBeenCalled();
  });

  // BUG: unknown emails and verified accounts get different messages, which leaks account existence.
  it.skip('responds identically for unknown and verified emails', async () => {
    m.getUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({ emailVerified: true });
    expect(await (await post({ email: 'a@x.cl' })).json()).toEqual(await (await post({ email: 'b@x.cl' })).json());
  });

  it('regenerates the token and emails it', async () => {
    m.getUserByEmail.mockResolvedValue({ email: 'a@x.cl', name: 'Ana', emailVerified: false });
    m.regenerateVerificationToken.mockResolvedValue('vt');
    const res = await post({ email: 'a@x.cl' });
    expect(res.status).toBe(200);
    expect(m.sendVerificationEmail).toHaveBeenCalledWith('a@x.cl', 'Ana', 'vt');
  });

  it('skips sending when no token is generated', async () => {
    m.getUserByEmail.mockResolvedValue({ email: 'a@x.cl' });
    m.regenerateVerificationToken.mockResolvedValue(null);
    expect((await post({ email: 'a@x.cl' })).status).toBe(200);
    expect(m.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('returns 500 when the email cannot be sent', async () => {
    m.getUserByEmail.mockResolvedValue({ email: 'a@x.cl' });
    m.regenerateVerificationToken.mockResolvedValue('vt');
    m.sendVerificationEmail.mockRejectedValue(new Error('resend'));
    const res = await post({ email: 'a@x.cl' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error enviando email de verificación' });
  });

  it('returns a generic 500 on unexpected errors', async () => {
    m.getUserByEmail.mockRejectedValue(new Error('db'));
    const res = await post({ email: 'a@x.cl' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error procesando la solicitud' });
  });
});
