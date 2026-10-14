import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/sanity/lib/client', () => ({ client: { fetch: vi.fn() } }));
vi.mock('@/lib/sanity/utils', () => ({ getImageUrl: vi.fn((img) => (img ? `img:${img}` : '')) }));

import { client } from '@/sanity/lib/client';
import { getImageUrl } from '@/lib/sanity/utils';
import { GET } from './route';

const get = async (qs: string) => {
  const res = await GET(new NextRequest(`http://x/api/products/snapshot${qs}`));
  return { status: res.status, json: await res.json() };
};
const base = { description: 'd', longDescription: 'ld' };

beforeEach(() => vi.clearAllMocks());

describe('GET /api/products/snapshot', () => {
  it.each(['', '?id=a', '?type=course'])('400 without id and type (%s)', async (qs) => {
    expect((await get(qs)).status).toBe(400);
  });

  it.each([
    ['terrarium', { ...base, images: ['t'], size: 'M', category: 'bosque' },
      { image: 'img:t', ...base, size: 'M', category: 'bosque' }],
    ['course', { shortDescription: 's', longDescription: 'ld', thumbnail: 'c', duration: 3, level: 'basic' },
      { image: 'img:c', description: 's', longDescription: 'ld', duration: 3, level: 'basic' }],
    ['workshop', { ...base, images: ['w'], location: { address: 'Calle 1' } },
      { image: 'img:w', ...base, location: 'Calle 1' }],
    ['supply', { ...base, images: ['s'], category: 'sustrato', weight: 2 },
      { image: 'img:s', ...base, category: 'sustrato', weight: 2 }],
  ])('returns a %s snapshot', async (type, product, data) => {
    vi.mocked(client.fetch).mockResolvedValue(product as never);
    const { status, json } = await get(`?id=p1&type=${type}`);
    expect(status).toBe(200);
    expect(json).toEqual({ success: true, data });
    expect(client.fetch).toHaveBeenCalledWith(expect.stringContaining(`_type == "${type}"`), { id: 'p1' });
    expect(getImageUrl).toHaveBeenCalledWith(expect.anything(), { width: 400, height: 400 });
  });

  it('defaults workshop location and tolerates missing images', async () => {
    vi.mocked(client.fetch).mockResolvedValue(base as never);
    const { json } = await get('?id=w&type=workshop');
    expect(json.data).toMatchObject({ image: '', location: 'Santa Isabel 676, Providencia, Santiago' });
  });

  it.each(['terrarium', 'course', 'workshop', 'supply'])('404 when %s not found', async (type) => {
    vi.mocked(client.fetch).mockResolvedValue(null as never);
    expect((await get(`?id=x&type=${type}`)).status).toBe(404);
  });

  it('404 for unknown type without querying', async () => {
    expect((await get('?id=x&type=bogus')).status).toBe(404);
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('500 with message when Sanity fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(client.fetch).mockRejectedValue(new Error('sanity down'));
    expect(await get('?id=x&type=course')).toEqual({ status: 500, json: { error: 'sanity down' } });
    vi.mocked(client.fetch).mockRejectedValue('weird');
    expect((await get('?id=x&type=course')).json.error).toBe('Error al obtener snapshot');
  });
});
