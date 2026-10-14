import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextAuthOptions, User, Account } from 'next-auth';

const adapter = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  verifyPassword: vi.fn(),
  updateUser: vi.fn(),
}));
const orders = vi.hoisted(() => ({ linkOrdersToUser: vi.fn() }));
const rl = vi.hoisted(() => ({ applyRateLimit: vi.fn() }));

vi.mock('@/lib/auth/sanity-adapter', () => adapter);
vi.mock('@/lib/sanity/orders', () => orders);
vi.mock('@/lib/rate-limit/upstash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/rate-limit/upstash')>()),
  loginRateLimit: 'login-limiter',
  applyRateLimit: rl.applyRateLimit,
}));
vi.mock('next-auth', () => ({ default: vi.fn(() => 'handler') }));
vi.mock('next-auth/providers/credentials', () => ({ default: (o: object) => ({ id: 'credentials', ...o }) }));
vi.mock('next-auth/providers/google', () => ({ default: (o: object) => ({ id: 'google', ...o }) }));

type Authorize = (c: Record<string, string> | undefined, req?: { headers?: Record<string, string> }) => Promise<unknown>;

async function load(google = false) {
  vi.resetModules();
  vi.stubEnv('GOOGLE_CLIENT_ID', google ? 'gid' : '');
  vi.stubEnv('GOOGLE_CLIENT_SECRET', google ? 'gsecret' : '');
  const mod = await import('./route');
  const opts = mod.authOptions as NextAuthOptions;
  const authorize = (opts.providers[0] as unknown as { authorize: Authorize }).authorize;
  return { mod, opts, authorize };
}

const dbUser = (over = {}) => ({ _id: 'u1', email: 'ana@x.cl', name: 'Ana', image: 'img', passwordHash: 'h', emailVerified: true, ...over });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  Object.values(adapter).forEach((f) => f.mockReset());
  orders.linkOrdersToUser.mockReset().mockResolvedValue(0);
  rl.applyRateLimit.mockReset().mockResolvedValue({ success: true });
});

describe('module wiring', () => {
  it('exports the NextAuth handler as GET and POST with jwt sessions', async () => {
    const { mod, opts } = await load();
    expect(mod.GET).toBe('handler');
    expect(mod.POST).toBe('handler');
    expect(opts.session).toEqual({ strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 });
    expect(opts.pages).toEqual({ signIn: '/auth/login', error: '/auth/error' });
  });

  it('registers Google only when both env vars are set', async () => {
    expect((await load(false)).opts.providers.map((p) => p.id)).toEqual(['credentials']);
    const { opts } = await load(true);
    expect(opts.providers.map((p) => p.id)).toEqual(['credentials', 'google']);
    expect(opts.providers[1]).toMatchObject({ clientId: 'gid', clientSecret: 'gsecret' });
  });
});

describe('credentials authorize', () => {
  it('rejects missing credentials without hitting the DB', async () => {
    const { authorize } = await load();
    expect(await authorize(undefined)).toBeNull();
    expect(await authorize({ email: 'a@x.cl', password: '' })).toBeNull();
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
  });

  it('rejects unknown users and OAuth-only users without password', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockResolvedValueOnce(null).mockResolvedValueOnce(dbUser({ passwordHash: undefined }));
    expect(await authorize({ email: 'a@x.cl', password: 'p' })).toBeNull();
    expect(await authorize({ email: 'a@x.cl', password: 'p' })).toBeNull();
    expect(adapter.verifyPassword).not.toHaveBeenCalled();
  });

  it('returns the public user on valid password', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockResolvedValue(dbUser());
    adapter.verifyPassword.mockResolvedValue(true);
    expect(await authorize({ email: 'ana@x.cl', password: 'secret' })).toEqual({
      id: 'u1', email: 'ana@x.cl', name: 'Ana', image: 'img',
    });
    expect(adapter.verifyPassword).toHaveBeenCalledWith('secret', 'h');
  });

  it('rejects wrong password', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockResolvedValue(dbUser());
    adapter.verifyPassword.mockResolvedValue(false);
    expect(await authorize({ email: 'ana@x.cl', password: 'bad' })).toBeNull();
  });

  it('blocks unverified emails by default (gate on) with EmailNotVerified, only after a valid password', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockResolvedValue(dbUser({ emailVerified: false }));
    adapter.verifyPassword.mockResolvedValue(true);
    await expect(authorize({ email: 'ana@x.cl', password: 'secret' })).rejects.toThrow('EmailNotVerified');
    adapter.verifyPassword.mockResolvedValue(false);
    expect(await authorize({ email: 'ana@x.cl', password: 'bad' })).toBeNull();
  });

  it('lets unverified emails in when REQUIRE_EMAIL_VERIFICATION=false', async () => {
    const { authorize } = await load();
    vi.stubEnv('REQUIRE_EMAIL_VERIFICATION', 'false');
    adapter.getUserByEmail.mockResolvedValue(dbUser({ emailVerified: false }));
    adapter.verifyPassword.mockResolvedValue(true);
    expect(await authorize({ email: 'ana@x.cl', password: 'secret' })).toMatchObject({ id: 'u1' });
  });

  it('returns null when the DB fails', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockRejectedValue(new Error('down'));
    expect(await authorize({ email: 'ana@x.cl', password: 'secret' })).toBeNull();
  });

  it('normalizes email case and whitespace before lookup', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockResolvedValue(null);
    await authorize({ email: ' Ana@X.cl ', password: 'p' });
    expect(adapter.getUserByEmail).toHaveBeenCalledWith('ana@x.cl');
  });
});

describe('login rate limit', () => {
  it('keys the limiter by client IP + normalized email and allows when under the limit', async () => {
    const { authorize } = await load();
    adapter.getUserByEmail.mockResolvedValue(dbUser());
    adapter.verifyPassword.mockResolvedValue(true);
    const req = { headers: { 'x-forwarded-for': '9.9.9.9, 1.1.1.1' } };
    expect(await authorize({ email: 'Ana@X.cl', password: 'secret' }, req)).toMatchObject({ id: 'u1' });
    expect(rl.applyRateLimit).toHaveBeenCalledWith('login-limiter', '9.9.9.9:ana@x.cl');
  });

  it('throws TooManyAttempts without touching the DB when blocked', async () => {
    const { authorize } = await load();
    rl.applyRateLimit.mockResolvedValue({ success: false });
    await expect(authorize({ email: 'ana@x.cl', password: 'secret' })).rejects.toThrow('TooManyAttempts');
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
  });

  it('lets the login through when Upstash is not configured (null limiter)', async () => {
    const { authorize } = await load();
    const { applyRateLimit } = await vi.importActual<typeof import('@/lib/rate-limit/upstash')>('@/lib/rate-limit/upstash');
    rl.applyRateLimit.mockImplementation(() => applyRateLimit(null, 'x'));
    adapter.getUserByEmail.mockResolvedValue(dbUser());
    adapter.verifyPassword.mockResolvedValue(true);
    expect(await authorize({ email: 'ana@x.cl', password: 'secret' })).toMatchObject({ id: 'u1' });
    expect(rl.applyRateLimit).toHaveBeenCalledWith('login-limiter', 'unknown:ana@x.cl');
  });
});

describe('signIn callback', () => {
  const signIn = async (user: Partial<User>, provider?: string) => {
    const { opts } = await load();
    return opts.callbacks!.signIn!({
      user: user as User,
      account: provider ? ({ provider } as Account) : null,
    } as never);
  };

  it('allows non-google sign-ins untouched', async () => {
    expect(await signIn({ email: 'a@x.cl' }, 'credentials')).toBe(true);
    expect(await signIn({ email: 'a@x.cl' })).toBe(true);
    expect(adapter.getUserByEmail).not.toHaveBeenCalled();
  });

  it('creates a pre-verified google user and links past orders', async () => {
    adapter.getUserByEmail.mockResolvedValue(null);
    adapter.createUser.mockResolvedValue({ _id: 'n1' });
    orders.linkOrdersToUser.mockResolvedValue(2);
    expect(await signIn({ email: 'g@x.cl', name: null, image: null }, 'google')).toBe(true);
    expect(adapter.createUser).toHaveBeenCalledWith({
      email: 'g@x.cl', name: undefined, image: undefined, provider: 'google', skipEmailVerification: true,
    });
    expect(orders.linkOrdersToUser).toHaveBeenCalledWith('g@x.cl', 'n1');
  });

  it('skips order linking if the created user has no id', async () => {
    adapter.getUserByEmail.mockResolvedValue(null);
    adapter.createUser.mockResolvedValue({});
    expect(await signIn({ email: 'g@x.cl', name: 'G', image: 'i' }, 'google')).toBe(true);
    expect(orders.linkOrdersToUser).not.toHaveBeenCalled();
  });

  it('links an existing account: fills gaps, verifies email, adds google method, reuses id', async () => {
    adapter.getUserByEmail.mockResolvedValue({ _id: 'u1', emailVerified: false, authMethods: ['credentials'] });
    orders.linkOrdersToUser.mockResolvedValue(1);
    const user: Partial<User> = { id: 'google-sub', email: 'ana@x.cl', name: 'Ana', image: 'img' };
    expect(await signIn(user, 'google')).toBe(true);
    expect(adapter.updateUser).toHaveBeenCalledWith('u1', {
      image: 'img', name: 'Ana', emailVerified: true, authMethods: ['credentials', 'google'],
    });
    expect(user.id).toBe('u1');
  });

  it('does not update an already complete linked account', async () => {
    adapter.getUserByEmail.mockResolvedValue({
      _id: 'u1', name: 'X', image: 'y', emailVerified: true, authMethods: ['google'],
    });
    expect(await signIn({ email: 'ana@x.cl', name: 'Ana', image: 'img' }, 'google')).toBe(true);
    expect(adapter.updateUser).not.toHaveBeenCalled();
    expect(orders.linkOrdersToUser).toHaveBeenCalledWith('ana@x.cl', 'u1');
  });

  it('handles legacy users without authMethods or _id', async () => {
    adapter.getUserByEmail.mockResolvedValue({ emailVerified: true, name: 'n', image: 'i' });
    expect(await signIn({ email: 'ana@x.cl' }, 'google')).toBe(true);
    expect(adapter.updateUser).toHaveBeenCalledWith(undefined, { authMethods: ['google'] });
    expect(orders.linkOrdersToUser).not.toHaveBeenCalled();
  });

  it('denies sign-in when the DB fails', async () => {
    adapter.getUserByEmail.mockRejectedValue(new Error('down'));
    expect(await signIn({ email: 'g@x.cl' }, 'google')).toBe(false);
  });
});

describe('jwt and session callbacks', () => {
  it('jwt copies user.id into sub only on sign-in', async () => {
    const { opts } = await load();
    const jwt = opts.callbacks!.jwt!;
    expect(await jwt({ token: {}, user: { id: 'u1' } } as never)).toEqual({ sub: 'u1' });
    expect(await jwt({ token: { sub: 'x' } } as never)).toEqual({ sub: 'x' });
  });

  it('session exposes token.sub as user.id', async () => {
    const { opts } = await load();
    const session = opts.callbacks!.session!;
    expect(await session({ session: { user: {} }, token: { sub: 'u1' } } as never)).toEqual({ user: { id: 'u1' } });
    expect(await session({ session: { user: {} }, token: {} } as never)).toEqual({ user: {} });
    expect(await session({ session: {}, token: { sub: 'u1' } } as never)).toEqual({});
  });
});
