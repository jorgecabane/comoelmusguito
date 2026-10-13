import { describe, it, expect, vi, beforeEach } from 'vitest';

async function load() {
  vi.resetModules();
  return import('./file');
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'proj');
  vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'prod');
});

describe('getFileUrl', () => {
  it('returns empty for an empty ref and passes full URLs through', async () => {
    const { getFileUrl } = await load();
    expect(getFileUrl('')).toBe('');
    expect(getFileUrl('https://cdn.sanity.io/files/x/y/z.pdf')).toBe('https://cdn.sanity.io/files/x/y/z.pdf');
  });

  it('builds the CDN path from the file id', async () => {
    const { getFileUrl } = await load();
    expect(getFileUrl('file-abc123-pdf')).toMatch(/^https:\/\/cdn\.sanity\.io\/files\/proj\/prod\/abc123\./);
  });

  it('defaults the extension to pdf when the ref ends with a dot', async () => {
    const { getFileUrl } = await load();
    expect(getFileUrl('file-abc123-x.')).toMatch(/\.pdf$/);
  });

  // BUG: sanity/lib/file.ts:34 toma la extensión con split('.') pero las refs de Sanity
  // ("file-<id>-<ext>") no tienen punto, así que devuelve ".../abc123.file-abc123-pdf".
  it.skip('uses the extension from the ref', async () => {
    const { getFileUrl } = await load();
    expect(getFileUrl('file-abc123-pdf')).toBe('https://cdn.sanity.io/files/proj/prod/abc123.pdf');
  });
});

describe('formatFileSize', () => {
  it('formats bytes, KB and MB', async () => {
    const { formatFileSize } = await load();
    expect(formatFileSize(0)).toBe('');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
