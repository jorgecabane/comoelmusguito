import { beforeEach, describe, expect, it, vi } from 'vitest';
import { purgeStaleMetaAttribution } from '@/lib/sanity/orders';
import { GET } from './route';

vi.mock('@/lib/sanity/orders', () => ({ purgeStaleMetaAttribution: vi.fn() }));

const purge = purgeStaleMetaAttribution as unknown as ReturnType<typeof vi.fn>;
const req = (authorization?: string) =>
  new Request('https://musgo.test/api/cron/purge-meta-attribution', { headers: authorization ? { authorization } : {} });

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 'cron-secret');
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/cron/purge-meta-attribution', () => {
  it('500 si CRON_SECRET no está configurado (nunca queda abierto)', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(req('Bearer '))).status).toBe(500);
    expect(purge).not.toHaveBeenCalled();
  });

  it('401 sin la cabecera o con un secreto incorrecto', async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req('Bearer otro'))).status).toBe(401);
    expect(purge).not.toHaveBeenCalled();
  });

  it('purga y devuelve cuántos pedidos limpió', async () => {
    purge.mockResolvedValue(3);
    const res = await GET(req('Bearer cron-secret'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, purged: 3 });
  });

  it('500 si la purga falla, sin filtrar detalles', async () => {
    purge.mockRejectedValue(new Error('sanity caído: token abc'));
    const res = await GET(req('Bearer cron-secret'));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('abc');
  });
});
