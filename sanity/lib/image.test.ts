import { describe, it, expect, vi, beforeEach } from 'vitest';

const img = { _type: 'image', asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' } };
const BASE = 'https://cdn.sanity.io/images/proj/prod/abc123-800x600.jpg';

async function load() {
  vi.resetModules();
  return import('./image');
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'proj');
  vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'prod');
});

describe('sanity image helpers', () => {
  it('urlFor builds a CDN url for the project/dataset', async () => {
    const { urlFor } = await load();
    expect(urlFor(img).url()).toBe(BASE);
  });

  it('getSanityImageUrl defaults to auto format + fit max', async () => {
    const { getSanityImageUrl } = await load();
    const url = new URL(getSanityImageUrl(img));
    expect(url.origin + url.pathname).toBe(BASE);
    expect(Object.fromEntries(url.searchParams)).toEqual({ auto: 'format', fit: 'max' });
  });

  it('applies every option', async () => {
    const { getSanityImageUrl } = await load();
    const url = new URL(getSanityImageUrl(img, { width: 400, height: 300, quality: 80, format: 'webp' }));
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ w: '400', h: '300', q: '80', fm: 'webp' });
  });
});
