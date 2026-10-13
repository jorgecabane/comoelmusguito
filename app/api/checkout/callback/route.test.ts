import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const URL_BASE = 'http://localhost/api/checkout/callback';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://comoelmusguito.cl');
});

describe('POST /api/checkout/callback', () => {
  it('lee form-urlencoded de Flow y redirige con token y order', async () => {
    const req = new NextRequest(URL_BASE, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'token=tk%201&commerceOrder=ORD-1',
    });
    const res = await POST(req);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://comoelmusguito.cl/checkout/callback?token=tk+1&order=ORD-1');
  });

  it('acepta JSON con "order" como alias', async () => {
    const res = await POST(new NextRequest(URL_BASE, { method: 'POST', body: JSON.stringify({ order: 'ORD-2' }) }));
    expect(res.headers.get('location')).toBe('https://comoelmusguito.cl/checkout/callback?order=ORD-2');
  });

  it('redirige sin parámetros si el body es inválido (usa localhost por defecto)', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const res = await POST(new NextRequest(URL_BASE, { method: 'POST', body: 'no-json' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('http://localhost:3000/checkout/callback');
  });

  it('sin token ni order redirige limpio', async () => {
    const res = await POST(new NextRequest(URL_BASE, { method: 'POST', body: '{}' }));
    expect(res.headers.get('location')).toBe('https://comoelmusguito.cl/checkout/callback');
  });
});

describe('GET /api/checkout/callback', () => {
  it('reenvía token y order a la página', async () => {
    const res = await GET(new NextRequest(`${URL_BASE}?token=tk&order=ORD-1&otro=x`));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://comoelmusguito.cl/checkout/callback?token=tk&order=ORD-1');
  });

  it('sin parámetros y con localhost por defecto', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const res = await GET(new NextRequest(URL_BASE));
    expect(res.headers.get('location')).toBe('http://localhost:3000/checkout/callback');
  });

  it.each(['https://comoelmusguito.cl', ''])('si falla leer la request redirige sin parámetros (base=%j)', async (site) => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', site);
    const broken = { get url(): string { throw new Error('bad url'); } } as unknown as NextRequest;
    const res = await GET(broken);
    expect(res.headers.get('location')).toBe(`${site || 'http://localhost:3000'}/checkout/callback`);
  });
});
