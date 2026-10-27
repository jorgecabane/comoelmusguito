import { describe, expect, it } from 'vitest';
import { getMetaAttribution } from './meta-attribution';

const req = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => ({
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  cookies: { get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined) },
});

describe('getMetaAttribution', () => {
  it('lee las cookies de Meta, la IP del primer proxy y el navegador', () => {
    expect(
      getMetaAttribution(
        req({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1', 'user-agent': 'UA/1.0' }, { _fbp: 'fb.1.1.2', _fbc: 'fb.1.1.AbC' })
      )
    ).toEqual({ fbp: 'fb.1.1.2', fbc: 'fb.1.1.AbC', clientIp: '200.1.2.3', userAgent: 'UA/1.0' });
  });

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    expect(getMetaAttribution(req({ 'x-real-ip': '9.9.9.9' }))?.clientIp).toBe('9.9.9.9');
  });

  it('devuelve undefined si no hay ningún dato', () => {
    expect(getMetaAttribution(req())).toBeUndefined();
  });

  it('descarta valores vacíos y acota los demasiado largos', () => {
    const a = getMetaAttribution(req({ 'user-agent': 'x'.repeat(2000) }, { _fbp: '   ' }));
    expect(a?.fbp).toBeUndefined();
    expect(a?.userAgent).toHaveLength(512);
  });
});
