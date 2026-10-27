import { describe, expect, it } from 'vitest';
import { getMetaAttribution } from './meta-attribution';

const ADS = { cem_consent: 'ads' };
const req = (headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => ({
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
  cookies: { get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined) },
});

describe('getMetaAttribution', () => {
  it('lee las cookies de Meta, la IP del primer proxy y el navegador', () => {
    expect(
      getMetaAttribution(
        req({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1', 'user-agent': 'UA/1.0' }, { ...ADS, _fbp: 'fb.1.1.2', _fbc: 'fb.1.1.AbC' })
      )
    ).toEqual({ consent: true, fbp: 'fb.1.1.2', fbc: 'fb.1.1.AbC', clientIp: '200.1.2.3', userAgent: 'UA/1.0' });
  });

  it('usa x-real-ip si no hay x-forwarded-for', () => {
    expect(getMetaAttribution(req({ 'x-real-ip': '9.9.9.9' }, ADS))?.clientIp).toBe('9.9.9.9');
  });

  it('sin consentimiento no guarda nada, aunque existan cookies de Meta', () => {
    const headers = { 'x-forwarded-for': '200.1.2.3', 'user-agent': 'UA/1.0' };
    expect(getMetaAttribution(req(headers, { _fbp: 'fb.1.1.2' }))).toBeUndefined();
    expect(getMetaAttribution(req(headers, { cem_consent: 'none', _fbp: 'fb.1.1.2' }))).toBeUndefined();
  });

  it('con consentimiento pero sin otros datos solo deja constancia del consentimiento', () => {
    expect(getMetaAttribution(req({}, ADS))).toEqual({ consent: true });
  });

  it('descarta valores vacíos y acota los demasiado largos', () => {
    const a = getMetaAttribution(req({ 'user-agent': 'x'.repeat(2000) }, { ...ADS, _fbp: '   ' }));
    expect(a?.fbp).toBeUndefined();
    expect(a?.userAgent).toHaveLength(512);
  });
});
