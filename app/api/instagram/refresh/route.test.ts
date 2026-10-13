import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshInstagramToken = vi.hoisted(() => vi.fn());
vi.mock('@/lib/instagram/token', () => ({ refreshInstagramToken }));

const SECRET = 'cron-secret';

async function load(env: Record<string, string> = {}) {
  vi.resetModules();
  vi.stubEnv('INSTAGRAM_ACCESS_TOKEN', 'ig-token');
  vi.stubEnv('CRON_SECRET', SECRET);
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import('./route')).GET;
}

const req = (authorization: string | null = `Bearer ${SECRET}`) =>
  new Request('https://musgo.test/api/instagram/refresh', {
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  refreshInstagramToken.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/instagram/refresh — auth', () => {
  it('fails with 500 when CRON_SECRET is not configured', async () => {
    const GET = await load({ CRON_SECRET: '' });
    expect((await GET(req())).status).toBe(500);
    expect(refreshInstagramToken).not.toHaveBeenCalled();
  });

  it('rejects a wrong or missing bearer token', async () => {
    const GET = await load();
    expect((await GET(req('Bearer nope'))).status).toBe(401);
    expect((await GET(req(SECRET))).status).toBe(401);
    expect((await GET(req(null))).status).toBe(401);
    expect(refreshInstagramToken).not.toHaveBeenCalled();
  });
});

describe('GET /api/instagram/refresh', () => {
  it('refreshes the configured token and reports only its expiry', async () => {
    refreshInstagramToken.mockResolvedValue({ token: 'new-secret-token', expiresIn: 5184000 });
    const GET = await load();

    const res = await GET(req());
    const text = await res.text();
    const body = JSON.parse(text);

    expect(refreshInstagramToken).toHaveBeenCalledWith('ig-token');
    expect(body).toMatchObject({ success: true, expiresInDays: 60 });
    expect(body).not.toHaveProperty('token');
    expect(text).not.toContain('new-secret-token');
    expect(Date.parse(body.expiresAt)).toBeGreaterThan(Date.now());
  });

  it('fails with 500 when no token is configured', async () => {
    const GET = await load({ INSTAGRAM_ACCESS_TOKEN: '' });
    expect((await GET(req())).status).toBe(500);
    expect(refreshInstagramToken).not.toHaveBeenCalled();
  });

  it('returns REFRESH_FAILED when Instagram refuses', async () => {
    refreshInstagramToken.mockResolvedValue(null);
    const GET = await load();
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'REFRESH_FAILED' });
  });

  it('returns 500 on unexpected errors', async () => {
    refreshInstagramToken.mockRejectedValue(new Error('boom'));
    const GET = await load();
    expect((await GET(req())).status).toBe(500);
  });
});
