import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refreshInstagramToken = vi.hoisted(() => vi.fn());
vi.mock('@/lib/instagram/token', () => ({ refreshInstagramToken }));

const fetchMock = vi.fn();
const SECRET = 'cron-secret';
const ENV_URL = 'https://api.vercel.com/v9/projects/prj_1/env';

async function load(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('INSTAGRAM_ACCESS_TOKEN', 'ig-old');
  vi.stubEnv('VERCEL_TOKEN', 'vc-token');
  vi.stubEnv('VERCEL_PROJECT_ID', 'prj_1');
  vi.stubEnv('VERCEL_TEAM_ID', '');
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import('./route')).GET;
}

const req = (qs = `?secret=${SECRET}`, headers: Record<string, string> = {}) =>
  new Request(`https://musgo.test/api/instagram/refresh-auto${qs}`, { headers });

/** Vercel API: list → (delete) → create */
function vercelApi({ existing = true, list = 200, del = 200, create = 200 } = {}) {
  fetchMock.mockResolvedValueOnce(
    Response.json(list === 200 ? { envs: existing ? [{ id: 'env_1', key: 'INSTAGRAM_ACCESS_TOKEN' }] : [] } : { error: 'forbidden' }, { status: list })
  );
  if (list !== 200) return;
  if (existing) fetchMock.mockResolvedValueOnce(new Response(del === 200 ? '{}' : 'x', { status: del }));
  fetchMock.mockResolvedValueOnce(Response.json(create === 200 ? {} : { error: 'bad' }, { status: create }));
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  refreshInstagramToken.mockReset().mockResolvedValue({ token: 'ig-new', expiresIn: 5184000 });
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/instagram/refresh-auto — auth', () => {
  it('fails with 500 when CRON_SECRET is not configured', async () => {
    const GET = await load({ CRON_SECRET: '' });
    expect((await GET(req())).status).toBe(500);
  });

  it('rejects a wrong or missing secret', async () => {
    const GET = await load();
    expect((await GET(req('?secret=nope'))).status).toBe(401);
    expect((await GET(req(''))).status).toBe(401);
    expect(refreshInstagramToken).not.toHaveBeenCalled();
  });

  it('accepts the secret via the x-cron-secret header', async () => {
    vercelApi();
    const GET = await load();
    expect((await GET(req('', { 'x-cron-secret': SECRET }))).status).toBe(200);
  });

  // BUG: app/api/instagram/refresh-auto/route.ts:127 — searchParams.get() decodes '+' as a space, so a
  // base64 CRON_SECRET containing '+' (like the one in vercel.json's cron path) never matches → cron always 401.
  // Also, Vercel Cron authenticates with `Authorization: Bearer <CRON_SECRET>`, which this route ignores.
  it.skip('accepts a secret containing "+" passed in the cron query string', async () => {
    vercelApi();
    const GET = await load({ CRON_SECRET: 'abc+def=' });
    expect((await GET(req('?secret=abc+def='))).status).toBe(200);
  });
});

describe('GET /api/instagram/refresh-auto — refresh + Vercel update', () => {
  it('refreshes the token and replaces the Vercel env var', async () => {
    vercelApi();
    const GET = await load();

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, token: 'ig-new', expiresInDays: 60 });
    expect(refreshInstagramToken).toHaveBeenCalledWith('ig-old');

    const [list, del, create] = fetchMock.mock.calls;
    expect(list).toEqual([ENV_URL, { headers: { Authorization: 'Bearer vc-token' } }]);
    expect(del[0]).toBe(`${ENV_URL}/env_1`);
    expect(del[1].method).toBe('DELETE');
    expect(create[0]).toBe(ENV_URL);
    expect(create[1].method).toBe('POST');
    expect(JSON.parse(create[1].body)).toEqual({
      key: 'INSTAGRAM_ACCESS_TOKEN',
      value: 'ig-new',
      type: 'encrypted',
      target: ['production', 'preview'],
    });
  });

  it('scopes Vercel calls to the team and skips delete when the var is new', async () => {
    vercelApi({ existing: false });
    const GET = await load({ VERCEL_TEAM_ID: 'team_1' });

    expect((await GET(req())).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(`${ENV_URL}?teamId=team_1`);
    expect(fetchMock.mock.calls[1][0]).toBe(`${ENV_URL}?teamId=team_1`);
  });

  it('continues to create when delete fails', async () => {
    vercelApi({ del: 404 });
    const GET = await load();
    expect((await GET(req())).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns the token for manual update when listing env vars fails', async () => {
    vercelApi({ list: 403 });
    const GET = await load();
    const res = await GET(req());
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body).toMatchObject({ token: 'ig-new' });
    expect(body.vercelError).toContain('Error al listar variables');
  });

  it('reports a failed create', async () => {
    vercelApi({ create: 400 });
    const GET = await load();
    const body = await (await GET(req())).json();
    expect(body.vercelError).toContain('Error al crear variable');
  });

  it('reports non-JSON Vercel errors and network failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response('down', { status: 503 }));
    const GET = await load();
    expect((await (await GET(req())).json()).vercelError).toBe('Error al listar variables: {}');

    fetchMock.mockReset().mockResolvedValueOnce(Response.json({ envs: [] })).mockResolvedValueOnce(new Response('x', { status: 500 }));
    expect((await (await GET(req())).json()).vercelError).toBe('Error al crear variable: {}');

    fetchMock.mockReset().mockRejectedValueOnce(new Error('offline'));
    expect((await (await GET(req())).json()).vercelError).toBe('offline');

    fetchMock.mockReset().mockRejectedValueOnce('weird');
    expect((await (await GET(req())).json()).vercelError).toBe('Error desconocido');
  });

  it('returns REFRESH_FAILED without touching Vercel when Instagram refuses', async () => {
    refreshInstagramToken.mockResolvedValue(null);
    const GET = await load();
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'REFRESH_FAILED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails with 500 when the Instagram token is missing', async () => {
    const GET = await load({ INSTAGRAM_ACCESS_TOKEN: '' });
    expect((await GET(req())).status).toBe(500);
  });

  it('reports which Vercel settings are missing', async () => {
    const GET = await load({ VERCEL_TOKEN: '' });
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ details: { hasVercelToken: false, hasProjectId: true } });
  });

  it('returns 500 with details on unexpected errors', async () => {
    refreshInstagramToken.mockRejectedValueOnce(new Error('boom'));
    const GET = await load();
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ details: 'boom' });

    refreshInstagramToken.mockRejectedValueOnce('weird');
    expect(await (await GET(req())).json()).toMatchObject({ details: 'Error desconocido' });
  });
});
