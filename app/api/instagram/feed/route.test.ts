import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

async function load(token: string | undefined = 'ig-token') {
  vi.resetModules();
  vi.stubEnv('INSTAGRAM_ACCESS_TOKEN', token);
  return (await import('./route')).GET;
}

const req = (qs = '') => new Request(`https://musgo.test/api/instagram/feed${qs}`);

const media = (id: string, media_type: string, extra: Record<string, unknown> = {}) => ({
  id,
  media_type,
  media_url: `https://cdn/${id}.jpg`,
  permalink: `https://instagram.com/p/${id}`,
  timestamp: '2025-01-01T00:00:00Z',
  ...extra,
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('GET /api/instagram/feed', () => {
  it('returns formatted images and drops videos', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        data: [
          media('1', 'IMAGE', { caption: 'Musgo' }),
          media('2', 'VIDEO'),
          media('3', 'CAROUSEL_ALBUM', { thumbnail_url: 'https://cdn/3-thumb.jpg' }),
        ],
      })
    );
    const GET = await load();

    const res = await GET(req('?limit=5'));
    const body = await res.json();

    expect(body.count).toBe(2);
    expect(body.data).toEqual([
      { id: '1', url: 'https://cdn/1.jpg', thumbnail: 'https://cdn/1.jpg', permalink: 'https://instagram.com/p/1', caption: 'Musgo', timestamp: '2025-01-01T00:00:00Z' },
      { id: '3', url: 'https://cdn/3.jpg', thumbnail: 'https://cdn/3-thumb.jpg', permalink: 'https://instagram.com/p/3', caption: '', timestamp: '2025-01-01T00:00:00Z' },
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('https://graph.instagram.com/me/media?');
    expect(url).toContain('limit=5&access_token=ig-token');
    expect(init).toEqual({ next: { revalidate: 3600 } });
  });

  it('defaults to 8 items and truncates to the limit', async () => {
    fetchMock.mockResolvedValue(Response.json({ data: Array.from({ length: 10 }, (_, i) => media(String(i), 'IMAGE')) }));
    const GET = await load();
    const body = await (await GET(req())).json();
    expect(fetchMock.mock.calls[0][0]).toContain('limit=8&');
    expect(body.count).toBe(8);
  });

  it('fails with 500 when the access token is not configured', async () => {
    const GET = await load('');
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns TOKEN_EXPIRED on 401 from Instagram', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: 190 } }, { status: 401 }));
    const GET = await load();
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'TOKEN_EXPIRED' });
  });

  it('propagates other Instagram errors with details', async () => {
    fetchMock.mockResolvedValue(new Response('rate limited', { status: 429 }));
    const GET = await load();
    const res = await GET(req());
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ details: {} });
  });

  it('returns 500 on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const GET = await load();
    expect((await GET(req())).status).toBe(500);
  });
});
