import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

async function load(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  vi.stubEnv('INSTAGRAM_APP_ID', 'app-id');
  vi.stubEnv('INSTAGRAM_APP_SECRET', 'app-secret');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://musgo.test');
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import('./route')).GET;
}

const req = (qs: string) => new Request(`https://musgo.test/api/instagram/callback${qs}`);

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/instagram/callback', () => {
  it('exchanges the code for a long-lived token', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ access_token: 'short' }))
      .mockResolvedValueOnce(Response.json({ access_token: 'long', expires_in: 5184000 }));
    const GET = await load();

    const res = await GET(req('?code=abc'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, token: 'long', expiresIn: 5184000, expiresInDays: 60 });
    expect(body.instructions).toContain('   INSTAGRAM_ACCESS_TOKEN=long');

    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe('https://api.instagram.com/oauth/access_token');
    const form = tokenInit.body as URLSearchParams;
    expect(Object.fromEntries(form)).toEqual({
      client_id: 'app-id',
      client_secret: 'app-secret',
      grant_type: 'authorization_code',
      redirect_uri: 'https://musgo.test/api/instagram/callback',
      code: 'abc',
    });
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=app-secret&access_token=short'
    );
  });

  it('defaults the redirect URI to localhost', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({}, { status: 400 }));
    const GET = await load({ NEXT_PUBLIC_SITE_URL: '' });
    await GET(req('?code=abc'));
    expect((fetchMock.mock.calls[0][1].body as URLSearchParams).get('redirect_uri')).toBe(
      'http://localhost:3000/api/instagram/callback'
    );
  });

  it('rejects when the user denied authorization', async () => {
    const GET = await load();
    const res = await GET(req('?error=access_denied'));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ details: 'access_denied' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects when the code is missing', async () => {
    const GET = await load();
    const res = await GET(req(''));
    expect(res.status).toBe(400);
  });

  it('fails with 500 when app credentials are missing', async () => {
    const GET = await load({ INSTAGRAM_APP_SECRET: '' });
    const res = await GET(req('?code=abc'));
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates the status when the code exchange fails', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ error_message: 'bad code' }, { status: 400 }));
    const GET = await load();
    const res = await GET(req('?code=abc'));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ details: { error_message: 'bad code' } });
  });

  it('tolerates a non-JSON error body on code exchange', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 502 }));
    const GET = await load();
    const res = await GET(req('?code=abc'));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ details: {} });
  });

  it('returns the short-lived token as fallback when the long-lived exchange fails', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ access_token: 'short' }))
      .mockResolvedValueOnce(new Response('', { status: 403 }));
    const GET = await load();
    const res = await GET(req('?code=abc'));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ shortLivedToken: 'short' });
  });

  it('returns 500 on unexpected errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const GET = await load();
    const res = await GET(req('?code=abc'));
    expect(res.status).toBe(500);
  });
});
