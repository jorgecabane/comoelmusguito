import { describe, it, expect, vi, beforeEach } from 'vitest';

const createClient = vi.hoisted(() => vi.fn((config: Record<string, unknown>) => ({ config })));
vi.mock('next-sanity', () => ({ createClient }));

async function load() {
  vi.resetModules();
  return import('./client');
}

beforeEach(() => {
  createClient.mockClear();
  vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'proj');
  vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'prod');
  vi.stubEnv('SANITY_API_TOKEN', 'secret');
});

describe('sanity client', () => {
  it('builds a published, uncached client with the server token', async () => {
    const { client } = await load();
    expect((client as any).config).toMatchObject({
      projectId: 'proj',
      dataset: 'prod',
      useCdn: false,
      token: 'secret',
      perspective: 'published',
      stega: { enabled: false },
    });
  });

  it('builds a drafts preview client', async () => {
    const { previewClient } = await load();
    expect((previewClient as any).config).toMatchObject({ perspective: 'previewDrafts', token: 'secret', useCdn: false });
  });

  it('getClient picks preview only when asked; writeClient aliases client', async () => {
    const { client, previewClient, getClient, writeClient } = await load();
    expect(getClient()).toBe(client);
    expect(getClient(false)).toBe(client);
    expect(getClient(true)).toBe(previewClient);
    expect(writeClient).toBe(client);
  });
});
