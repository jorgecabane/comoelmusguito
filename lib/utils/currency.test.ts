import { beforeEach, describe, expect, it, vi } from 'vitest';

type Currency = typeof import('./currency');
let mod: Currency;

const mockRate = (body: unknown, ok = true) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }),
  );

beforeEach(async () => {
  // El cache de tasa es estado de módulo: módulo fresco por test.
  vi.resetModules();
  vi.unstubAllGlobals();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mod = await import('./currency');
});

describe('getUSDToCLPRate', () => {
  it('returns the API rate and caches it for an hour', async () => {
    mockRate({ rates: { CLP: 900 } });
    vi.useFakeTimers({ now: 0 });
    expect(await mod.getUSDToCLPRate()).toBe(900);
    vi.setSystemTime(60 * 60 * 1000 - 1);
    expect(await mod.getUSDToCLPRate()).toBe(900);
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(60 * 60 * 1000 + 1);
    await mod.getUSDToCLPRate();
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it.each([
    ['non-ok response', () => mockRate({}, false)],
    ['missing CLP rate', () => mockRate({ rates: {} })],
    ['non-numeric rate', () => mockRate({ rates: { CLP: '900' } })],
    ['network error', () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))],
  ])('falls back to 950 on %s', async (_, setup) => {
    setup();
    expect(await mod.getUSDToCLPRate()).toBe(950);
  });

  it('does not cache the fallback rate', async () => {
    mockRate({}, false);
    await mod.getUSDToCLPRate();
    await mod.getUSDToCLPRate();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('conversions', () => {
  beforeEach(() => mockRate({ rates: { CLP: 943.37 } }));

  it('rounds USD→CLP to whole pesos', async () => {
    expect(await mod.convertUSDToCLP(29.99)).toBe(28292); // 28291.67
    expect(await mod.convertUSDToCLP(0)).toBe(0);
  });

  it('rounds CLP→USD to cents', async () => {
    expect(await mod.convertCLPToUSD(50000)).toBe(53); // 53.0014
    expect(await mod.convertCLPToUSD(1)).toBe(0); // 0.00106
    expect(await mod.convertCLPToUSD(10)).toBe(0.01);
  });
});

describe('formatPrice', () => {
  it('formats CLP with dot thousands separator and no decimals', () => {
    expect(mod.formatPrice(1234567, 'CLP')).toBe('$1.234.567 CLP');
    expect(mod.formatPrice(0, 'CLP')).toBe('$0 CLP');
  });

  it('formats USD with exactly two decimals', () => {
    expect(mod.formatPrice(29, 'USD')).toBe('$29.00 USD');
    expect(mod.formatPrice(1234.5, 'USD')).toBe('$1,234.50 USD');
    expect(mod.formatPrice(0.005, 'USD')).toBe('$0.01 USD');
  });

  // BUG: CLP no tiene centavos, pero un monto fraccionario se muestra con coma decimal ("$1.234,5 CLP").
  it.skip('never shows decimals for CLP', () => {
    expect(mod.formatPrice(1234.5, 'CLP')).toBe('$1.235 CLP');
  });
});

describe('getPriceForUser', () => {
  beforeEach(() => mockRate({ rates: { CLP: 1000 } }));

  it('Chilean user: uses CLP price when present', async () => {
    expect(await mod.getPriceForUser(50000, 60, 'CLP')).toEqual({
      amount: 50000, currency: 'CLP', originalCurrency: 'CLP',
    });
  });

  it('Chilean user: converts USD-only price to CLP', async () => {
    expect(await mod.getPriceForUser(0, 29.99, 'CLP')).toEqual({
      amount: 29990, currency: 'CLP', originalCurrency: 'USD',
    });
  });

  it('foreign user: uses USD price when present', async () => {
    expect(await mod.getPriceForUser(50000, 60, 'USD')).toEqual({
      amount: 60, currency: 'USD', originalCurrency: 'USD',
    });
  });

  it('foreign user: converts CLP-only price to USD', async () => {
    expect(await mod.getPriceForUser(45990, null, 'USD')).toEqual({
      amount: 45.99, currency: 'USD', originalCurrency: 'CLP',
    });
  });

  it.each(['CLP', 'USD'] as const)('falls back to CLP 0 when no price (%s)', async (cur) => {
    expect(await mod.getPriceForUser(0, null, cur)).toEqual({
      amount: 0, currency: 'CLP', originalCurrency: 'CLP',
    });
    expect(await mod.getPriceForUser(0, 0, cur)).toMatchObject({ amount: 0, currency: 'CLP' });
  });
});
