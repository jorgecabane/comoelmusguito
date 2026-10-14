import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({
  createPasswordResetToken: vi.fn(),
  getUserByEmail: vi.fn(),
  hasPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  applyRateLimit: vi.fn(),
}));
vi.mock('@/lib/auth/sanity-adapter', () => ({
  createPasswordResetToken: m.createPasswordResetToken,
  getUserByEmail: m.getUserByEmail,
  hasPassword: m.hasPassword,
}));
vi.mock('@/lib/resend/client', () => ({ sendPasswordResetEmail: m.sendPasswordResetEmail }));
vi.mock('@/lib/rate-limit/upstash', () => ({
  forgotPasswordRateLimit: 'limiter',
  getClientIP: () => '1.1.1.1',
  applyRateLimit: m.applyRateLimit,
}));

import { POST } from './route';

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(body) }));
const GENERIC = {
  success: true,
  message: 'Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.',
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  Object.values(m).forEach((f) => f.mockReset());
  m.applyRateLimit.mockResolvedValue({ success: true });
});

describe('POST /api/auth/forgot-password', () => {
  it('returns 429 when rate limited', async () => {
    m.applyRateLimit.mockResolvedValue({ success: false });
    expect((await post({ email: 'a@x.cl' })).status).toBe(429);
    expect(m.applyRateLimit).toHaveBeenCalledWith('limiter', '1.1.1.1');
  });

  it('rejects an invalid email', async () => {
    expect((await post({ email: 'x' })).status).toBe(400);
  });

  it('returns the same generic success for unknown emails without sending anything', async () => {
    m.applyRateLimit.mockResolvedValue(null);
    m.getUserByEmail.mockResolvedValue(null);
    const res = await post({ email: 'Nobody@X.cl' });
    expect(await res.json()).toEqual(GENERIC);
    expect(m.getUserByEmail).toHaveBeenCalledWith('nobody@x.cl');
    expect(m.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('sends a reset email to existing users (reset vs initialize)', async () => {
    const user = { email: 'a@x.cl', name: 'Ana' };
    m.getUserByEmail.mockResolvedValue(user);
    m.createPasswordResetToken.mockResolvedValue('rt');
    m.hasPassword.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(await (await post({ email: 'a@x.cl' })).json()).toEqual(GENERIC);
    expect(m.sendPasswordResetEmail).toHaveBeenLastCalledWith('a@x.cl', 'Ana', 'rt', false);
    await post({ email: 'a@x.cl' });
    expect(m.sendPasswordResetEmail).toHaveBeenLastCalledWith('a@x.cl', 'Ana', 'rt', true);
  });

  it('does not send when token creation fails, still generic success', async () => {
    m.getUserByEmail.mockResolvedValue({ email: 'a@x.cl' });
    m.createPasswordResetToken.mockResolvedValue(null);
    expect(await (await post({ email: 'a@x.cl' })).json()).toEqual(GENERIC);
    expect(m.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('swallows email delivery errors (no enumeration via 500)', async () => {
    m.getUserByEmail.mockResolvedValue({ email: 'a@x.cl' });
    m.createPasswordResetToken.mockResolvedValue('rt');
    m.sendPasswordResetEmail.mockRejectedValue(new Error('resend'));
    const res = await post({ email: 'a@x.cl' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(GENERIC);
  });

  it('returns a generic 500 on unexpected errors', async () => {
    m.getUserByEmail.mockRejectedValue(new Error('db'));
    const res = await post({ email: 'a@x.cl' });
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error procesando la solicitud' });
  });
});
