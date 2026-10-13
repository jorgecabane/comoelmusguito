import { describe, it, expect, vi, beforeEach } from 'vitest';

const ctorArgs: unknown[] = [];

vi.mock('@upstash/redis', () => ({
  Redis: class {
    constructor(public opts: unknown) {}
  },
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow = vi.fn((n: number, w: string) => ({ n, w }));
    limit = vi.fn();
    constructor(opts: unknown) {
      ctorArgs.push(opts);
    }
  },
}));

async function load(withEnv: boolean) {
  vi.resetModules();
  ctorArgs.length = 0;
  vi.stubEnv('UPSTASH_REDIS_REST_URL', withEnv ? 'https://redis.example' : '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', withEnv ? 'tok' : '');
  return import('./upstash');
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getClientIP', () => {
  it('uses the first x-forwarded-for entry', async () => {
    const { getClientIP } = await load(false);
    const req = new Request('http://x', { headers: { 'x-forwarded-for': ' 1.1.1.1 , 2.2.2.2' } });
    expect(getClientIP(req)).toBe('1.1.1.1');
  });

  it('falls back to x-real-ip, then unknown', async () => {
    const { getClientIP } = await load(false);
    expect(getClientIP(new Request('http://x', { headers: { 'x-real-ip': '3.3.3.3' } }))).toBe('3.3.3.3');
    expect(getClientIP(new Request('http://x'))).toBe('unknown');
  });
});

describe('limiters', () => {
  it('are null when Upstash env vars are missing', async () => {
    const mod = await load(false);
    expect(mod.loginRateLimit).toBeNull();
    expect(mod.registerRateLimit).toBeNull();
    expect(mod.apiRateLimit).toBeNull();
    expect(mod.contactRateLimit).toBeNull();
    expect(ctorArgs).toHaveLength(0);
  });

  it('are built with distinct prefixes when env vars are present', async () => {
    const mod = await load(true);
    expect(mod.registerRateLimit).not.toBeNull();
    const prefixes = ctorArgs.map((o) => (o as { prefix: string }).prefix);
    expect(prefixes).toEqual([
      '@upstash/ratelimit/login',
      '@upstash/ratelimit/register',
      '@upstash/ratelimit/forgot-password',
      '@upstash/ratelimit/checkout',
      '@upstash/ratelimit/check-email',
      '@upstash/ratelimit/resend-verification',
      '@upstash/ratelimit/redeem-gift',
      '@upstash/ratelimit/contact',
      '@upstash/ratelimit/api',
    ]);
    expect(ctorArgs[1]).toMatchObject({ limiter: { n: 3, w: '1 h' } });
  });
});

describe('applyRateLimit', () => {
  it('allows the request when no limiter is configured', async () => {
    const { applyRateLimit } = await load(false);
    const res = await applyRateLimit(null, 'ip');
    expect(res).toMatchObject({ success: true, limit: Infinity, remaining: Infinity });
    expect(console.warn).toHaveBeenCalled();
  });

  it('returns the limiter verdict (allowed and blocked)', async () => {
    const { applyRateLimit, loginRateLimit } = await load(true);
    const limit = vi.mocked(loginRateLimit!.limit);
    limit.mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: 1 } as never);
    expect(await applyRateLimit(loginRateLimit, 'ip')).toMatchObject({ success: true, remaining: 4 });
    limit.mockResolvedValueOnce({ success: false, limit: 5, remaining: 0, reset: 1 } as never);
    expect(await applyRateLimit(loginRateLimit, 'ip')).toMatchObject({ success: false });
    expect(limit).toHaveBeenCalledWith('ip');
  });

  it('fails open when Upstash throws (Error and non-Error)', async () => {
    const { applyRateLimit, loginRateLimit } = await load(true);
    const limit = vi.mocked(loginRateLimit!.limit);
    limit.mockRejectedValueOnce(new Error('ENOTFOUND'));
    expect(await applyRateLimit(loginRateLimit, 'ip')).toMatchObject({ success: true });
    limit.mockRejectedValueOnce('boom');
    expect(await applyRateLimit(loginRateLimit, 'ip')).toMatchObject({ success: true });
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});
