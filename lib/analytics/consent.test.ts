import { describe, expect, it } from 'vitest';
import { CONSENT_COOKIE, consentCookieString, consentFromValue, parseAdsConsent } from './consent';

describe('consentFromValue', () => {
  it('interpreta ads / none y trata todo lo demás como sin elección', () => {
    expect(consentFromValue('ads')).toBe('granted');
    expect(consentFromValue('none')).toBe('denied');
    expect(consentFromValue('otra')).toBe('unset');
    expect(consentFromValue(undefined)).toBe('unset');
    expect(consentFromValue(null)).toBe('unset');
  });
});

describe('parseAdsConsent', () => {
  it('lee la cookie entre otras', () => {
    expect(parseAdsConsent(`a=1; ${CONSENT_COOKIE}=ads; b=2`)).toBe('granted');
    expect(parseAdsConsent(`${CONSENT_COOKIE}=none`)).toBe('denied');
  });

  it('sin cookie o vacío es "unset"', () => {
    expect(parseAdsConsent('a=1; b=2')).toBe('unset');
    expect(parseAdsConsent('')).toBe('unset');
    expect(parseAdsConsent(undefined)).toBe('unset');
  });

  it('no confunde cookies con nombre parecido', () => {
    expect(parseAdsConsent('x_cem_consent=ads')).toBe('unset');
  });
});

describe('consentCookieString', () => {
  it('guarda 180 días, para todo el sitio, y Secure solo en https', () => {
    const ok = consentCookieString(true, true);
    expect(ok).toBe(`${CONSENT_COOKIE}=ads; Max-Age=15552000; Path=/; SameSite=Lax; Secure`);
    expect(consentCookieString(false, false)).toBe(`${CONSENT_COOKIE}=none; Max-Age=15552000; Path=/; SameSite=Lax`);
  });
});
