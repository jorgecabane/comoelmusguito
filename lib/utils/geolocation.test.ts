import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: vi.fn() }));
import { headers } from 'next/headers';
import { getUserCountry, getUserCurrency, isUserInChile } from './geolocation';

const withCountry = (country: string | null) =>
  vi.mocked(headers).mockResolvedValue(new Headers(country ? { 'x-vercel-ip-country': country } : {}) as never);

describe('geolocation (server)', () => {
  it('reads the Vercel country header', async () => {
    withCountry('AR');
    expect(await getUserCountry()).toBe('AR');
    expect(await isUserInChile()).toBe(false);
    expect(await getUserCurrency()).toBe('USD');
  });

  it('defaults to CL when the header is missing', async () => {
    withCountry(null);
    expect(await getUserCountry()).toBe('CL');
    expect(await isUserInChile()).toBe(true);
    expect(await getUserCurrency()).toBe('CLP');
  });

  it('defaults to CL when headers() throws (outside a request)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(headers).mockImplementation(() => { throw new Error('no request scope'); });
    expect(await getUserCountry()).toBe('CL');
  });
});
