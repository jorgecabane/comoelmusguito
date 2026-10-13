import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({ getUserByEmail: vi.fn(), applyRateLimit: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: m.getUserByEmail }));
vi.mock('@/lib/rate-limit/upstash', () => ({
  checkEmailRateLimit: 'limiter',
  getClientIP: () => '1.1.1.1',
  applyRateLimit: m.applyRateLimit,
}));

import { GET } from './route';

const get = (email?: string) =>
  GET(new NextRequest(`http://localhost/api/auth/check-email${email === undefined ? '' : `?email=${encodeURIComponent(email)}`}`));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m.getUserByEmail.mockReset();
  m.applyRateLimit.mockReset().mockResolvedValue({ success: true });
});

describe('GET /api/auth/check-email', () => {
  it('returns 429 when rate limited', async () => {
    m.applyRateLimit.mockResolvedValue({ success: false });
    expect((await get('a@x.cl')).status).toBe(429);
    expect(m.applyRateLimit).toHaveBeenCalledWith('limiter', '1.1.1.1');
    expect(m.getUserByEmail).not.toHaveBeenCalled();
  });

  it('proceeds when limiter returns null', async () => {
    m.applyRateLimit.mockResolvedValue(null);
    m.getUserByEmail.mockResolvedValue(null);
    expect((await get('a@x.cl')).status).toBe(200);
  });

  it.each([[undefined], ['nope']])('rejects invalid email %j', async (email) => {
    expect((await get(email)).status).toBe(400);
  });

  it('looks up the normalized email', async () => {
    m.getUserByEmail.mockResolvedValue(null);
    await get(' Ana@X.cl ');
    expect(m.getUserByEmail).toHaveBeenCalledWith('ana@x.cl');
  });

  it('flags accounts pending verification', async () => {
    m.getUserByEmail.mockResolvedValue({ emailVerified: false });
    expect(await (await get('a@x.cl')).json()).toEqual({ pendingVerification: true });
  });

  it('returns the same body for unknown and verified emails (no enumeration)', async () => {
    m.getUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce({ emailVerified: true });
    const unknown = await (await get('a@x.cl')).json();
    const verified = await (await get('b@x.cl')).json();
    expect(unknown).toEqual({ pendingVerification: false });
    expect(verified).toEqual(unknown);
  });

  it('hides error details on failure', async () => {
    m.getUserByEmail.mockRejectedValue(new Error('secret db detail'));
    const res = await get('a@x.cl');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error procesando la solicitud' });
  });
});
