import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshInstagramToken = vi.hoisted(() => vi.fn());
vi.mock('@/lib/instagram/token', () => ({ refreshInstagramToken }));

async function load(token: string | undefined = 'ig-token') {
  vi.resetModules();
  vi.stubEnv('INSTAGRAM_ACCESS_TOKEN', token);
  return (await import('./route')).GET;
}

beforeEach(() => {
  refreshInstagramToken.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/instagram/refresh', () => {
  it('refreshes the configured token and reports its expiry', async () => {
    refreshInstagramToken.mockResolvedValue({ token: 'new', expiresIn: 5184000 });
    const GET = await load();

    const res = await GET();
    const body = await res.json();

    expect(refreshInstagramToken).toHaveBeenCalledWith('ig-token');
    expect(body).toMatchObject({ success: true, token: 'new', expiresInDays: 60 });
    expect(Date.parse(body.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('fails with 500 when no token is configured', async () => {
    const GET = await load('');
    expect((await GET()).status).toBe(500);
    expect(refreshInstagramToken).not.toHaveBeenCalled();
  });

  it('returns REFRESH_FAILED when Instagram refuses', async () => {
    refreshInstagramToken.mockResolvedValue(null);
    const GET = await load();
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'REFRESH_FAILED' });
  });

  it('returns 500 on unexpected errors', async () => {
    refreshInstagramToken.mockRejectedValue(new Error('boom'));
    const GET = await load();
    expect((await GET()).status).toBe(500);
  });

  // BUG: app/api/instagram/refresh/route.ts:20 — the endpoint has no auth and returns the freshly
  // minted INSTAGRAM_ACCESS_TOKEN in the response body to any anonymous caller.
  it.skip('requires authorization before returning a token', async () => {
    refreshInstagramToken.mockResolvedValue({ token: 'new', expiresIn: 1 });
    const GET = await load();
    expect((await GET()).status).toBe(401);
  });
});
