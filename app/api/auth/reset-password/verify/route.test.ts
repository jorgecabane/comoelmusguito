import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({ getUserByResetToken: vi.fn(), hasPassword: vi.fn(), applyRateLimit: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByResetToken: m.getUserByResetToken, hasPassword: m.hasPassword }));
vi.mock('@/lib/rate-limit/upstash', () => ({
  apiRateLimit: 'limiter',
  getClientIP: () => '1.1.1.1',
  applyRateLimit: m.applyRateLimit,
}));

import { GET } from './route';

const get = (qs = '') => GET(new NextRequest(`http://localhost/api/auth/reset-password/verify${qs}`));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  Object.values(m).forEach((f) => f.mockReset());
  m.applyRateLimit.mockResolvedValue({ success: true });
});

describe('GET /api/auth/reset-password/verify', () => {
  it('returns 429 when rate limited', async () => {
    m.applyRateLimit.mockResolvedValue({ success: false });
    const res = await get('?token=t');
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ valid: false });
  });

  it('is invalid without a token', async () => {
    m.applyRateLimit.mockResolvedValue(null);
    expect(await (await get()).json()).toEqual({ valid: false });
  });

  it('is invalid for unknown or expired tokens', async () => {
    m.getUserByResetToken.mockResolvedValue(null);
    expect(await (await get('?token=t')).json()).toEqual({ valid: false });
  });

  it('is valid and flags OAuth-only users as initializing, without leaking user data', async () => {
    m.getUserByResetToken.mockResolvedValue({ _id: 'u1', email: 'a@x.cl' });
    m.hasPassword.mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(await (await get('?token=t')).json()).toEqual({ valid: true, isInitializing: true });
    expect(await (await get('?token=t')).json()).toEqual({ valid: true, isInitializing: false });
  });

  it('returns 500 invalid on errors', async () => {
    m.getUserByResetToken.mockRejectedValue(new Error('db'));
    const res = await get('?token=t');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ valid: false });
  });
});
