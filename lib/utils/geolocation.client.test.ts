// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserCountryClient } from './geolocation.client';

// Node 25 expone un `localStorage` global (sin archivo lanza) que tapa al de jsdom.
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null });
  return () => vi.unstubAllGlobals();
});

const setTimezone = (timeZone: string) =>
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone } as never);


describe('getUserCountryClient', () => {
  it('prefers the stored country', () => {
    store.set('user-country', 'MX');
    expect(getUserCountryClient()).toBe('MX');
  });

  it('detects Chile by timezone', () => {
    setTimezone('America/Santiago');
    expect(getUserCountryClient()).toBe('CL');
  });

  it('detects Chile by navigator.language', () => {
    setTimezone('Europe/Madrid');
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-CL');
    expect(getUserCountryClient()).toBe('CL');
  });

  it('falls back to navigator.languages when language is unset', () => {
    setTimezone('Europe/Madrid');
    vi.spyOn(navigator, 'language', 'get').mockReturnValue(undefined as never);
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
    // Sin señal de Chile igual retorna CL (default de negocio).
    expect(getUserCountryClient()).toBe('CL');
  });

  it('returns CL on the server (no window)', () => {
    vi.stubGlobal('window', undefined);
    expect(getUserCountryClient()).toBe('CL');
  });
});
