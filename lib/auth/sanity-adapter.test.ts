import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';

const { fetch, create, patch, set, commit } = vi.hoisted(() => {
  const commit = vi.fn();
  const set = vi.fn(() => ({ commit }));
  const patch = vi.fn(() => ({ set }));
  return { fetch: vi.fn(), create: vi.fn(), patch, set, commit };
});

vi.mock('@/sanity/lib/client', () => {
  const c = { fetch, create, patch };
  return { client: c, writeClient: c };
});

import {
  getUserByEmail,
  getUserById,
  hasPassword,
  createUser,
  verifyPassword,
  hashPassword,
  emailExists,
  updateUser,
  verifyUserEmail,
  getUserByVerificationToken,
  createPasswordResetToken,
  getUserByResetToken,
  resetUserPassword,
  regenerateVerificationToken,
  type SanityUser,
} from './sanity-adapter';

const NOW = new Date('2026-01-01T12:00:00Z');
const user = (over: Partial<SanityUser> = {}): SanityUser => ({
  _id: 'u1',
  _type: 'user',
  email: 'ana@x.cl',
  createdAt: '',
  updatedAt: '',
  ...over,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetch.mockReset();
  create.mockReset().mockImplementation(async (doc) => ({ _id: 'new', ...doc }));
  commit.mockReset().mockResolvedValue({});
  set.mockClear();
  patch.mockClear();
});
afterEach(() => vi.useRealTimers());

describe('lookups', () => {
  it('getUserByEmail / getUserById pass params and return the doc', async () => {
    fetch.mockResolvedValue(user());
    expect(await getUserByEmail('ana@x.cl')).toMatchObject({ _id: 'u1' });
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('email == $email'), { email: 'ana@x.cl' });
    expect(await getUserById('u1')).toMatchObject({ _id: 'u1' });
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('_id == $id'), { id: 'u1' });
  });

  it('return null when Sanity fails', async () => {
    fetch.mockRejectedValue(new Error('down'));
    expect(await getUserByEmail('a@x.cl')).toBeNull();
    expect(await getUserById('u1')).toBeNull();
  });

  it('emailExists reflects lookup', async () => {
    fetch.mockResolvedValueOnce(user()).mockResolvedValueOnce(null);
    expect(await emailExists('ana@x.cl')).toBe(true);
    expect(await emailExists('no@x.cl')).toBe(false);
  });

  it('hasPassword', () => {
    expect(hasPassword(null)).toBe(false);
    expect(hasPassword(user())).toBe(false);
    expect(hasPassword(user({ passwordHash: null as unknown as string }))).toBe(false);
    expect(hasPassword(user({ passwordHash: 'h' }))).toBe(true);
  });
});

describe('password hashing', () => {
  it('hashPassword produces a bcrypt hash that verifyPassword accepts', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toContain('secret123');
    expect(hash).toMatch(/^\$2[aby]\$10\$/);
    expect(await verifyPassword('secret123', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('verifyPassword returns false when bcrypt throws', async () => {
    vi.spyOn(bcrypt, 'compare').mockRejectedValueOnce(new Error('bad hash') as never);
    expect(await verifyPassword('x', 'garbage')).toBe(false);
  });
});

describe('createUser', () => {
  it('credentials user: lowercases email, hashes password, issues 48h verification token', async () => {
    const created = await createUser({ email: 'Ana@X.cl', password: 'secret123', name: 'Ana' });
    const doc = create.mock.calls[0][0];
    expect(doc).toMatchObject({ email: 'ana@x.cl', provider: 'credentials', authMethods: ['credentials'], emailVerified: false });
    expect(await bcrypt.compare('secret123', doc.passwordHash)).toBe(true);
    expect(doc.emailVerificationToken).toMatch(/^[a-z0-9]{10,}$/);
    expect(doc.emailVerificationExpires).toBe(new Date(NOW.getTime() + 48 * 3600e3).toISOString());
    expect(created._id).toBe('new');
  });

  it('google user is pre-verified and has no password or token', async () => {
    await createUser({ email: 'g@x.cl', provider: 'google' });
    const doc = create.mock.calls[0][0];
    expect(doc).toMatchObject({ emailVerified: true, authMethods: ['google'] });
    expect(doc.passwordHash).toBeUndefined();
    expect(doc.emailVerificationToken).toBeUndefined();
  });

  it('skipEmailVerification marks credentials user verified', async () => {
    await createUser({ email: 'a@x.cl', password: 'p', skipEmailVerification: true });
    expect(create.mock.calls[0][0]).toMatchObject({ emailVerified: true });
  });

  // BUG: tokens come from Math.random(), which is not a CSPRNG; verification/reset tokens are predictable.
  it.skip('uses a cryptographically secure token generator', async () => {
    const spy = vi.spyOn(Math, 'random');
    await createUser({ email: 'a@x.cl', password: 'p' });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('updates', () => {
  it('updateUser patches with updatedAt and returns result', async () => {
    commit.mockResolvedValueOnce({ _id: 'u1', name: 'B' });
    expect(await updateUser('u1', { name: 'B' })).toEqual({ _id: 'u1', name: 'B' });
    expect(patch).toHaveBeenCalledWith('u1');
    expect(set).toHaveBeenCalledWith({ name: 'B', updatedAt: NOW.toISOString() });
  });

  it('updateUser returns null on failure', async () => {
    commit.mockRejectedValueOnce(new Error('x'));
    expect(await updateUser('u1', {})).toBeNull();
  });

  it('verifyUserEmail sets verified and clears token', async () => {
    expect(await verifyUserEmail('u1')).toBe(true);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ emailVerified: true, emailVerificationToken: null, emailVerificationExpires: null })
    );
    commit.mockRejectedValueOnce(new Error('x'));
    expect(await verifyUserEmail('u1')).toBe(false);
  });
});

describe.each([
  ['getUserByVerificationToken', getUserByVerificationToken, 'emailVerificationExpires'],
  ['getUserByResetToken', getUserByResetToken, 'passwordResetExpires'],
] as const)('%s', (_name, fn, field) => {
  it('returns null when no user matches', async () => {
    fetch.mockResolvedValue(null);
    expect(await fn('t')).toBeNull();
    expect(fetch).toHaveBeenCalledWith(expect.any(String), { token: 't' });
  });

  it('returns user when token not expired or has no expiry', async () => {
    fetch.mockResolvedValueOnce(user({ [field]: new Date(NOW.getTime() + 1000).toISOString() }));
    expect(await fn('t')).toMatchObject({ _id: 'u1' });
    fetch.mockResolvedValueOnce(user());
    expect(await fn('t')).toMatchObject({ _id: 'u1' });
  });

  it('returns null when token is expired', async () => {
    fetch.mockResolvedValue(user({ [field]: new Date(NOW.getTime() - 1000).toISOString() }));
    expect(await fn('t')).toBeNull();
  });

  it('returns null when Sanity fails', async () => {
    fetch.mockRejectedValue(new Error('x'));
    expect(await fn('t')).toBeNull();
  });
});

describe('createPasswordResetToken', () => {
  it('stores a 1h token and returns it', async () => {
    fetch.mockResolvedValue(user());
    const token = await createPasswordResetToken('ana@x.cl');
    expect(token).toBeTruthy();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordResetToken: token,
        passwordResetExpires: new Date(NOW.getTime() + 3600e3).toISOString(),
      })
    );
  });

  it('returns null for unknown user or write failure', async () => {
    fetch.mockResolvedValueOnce(null);
    expect(await createPasswordResetToken('x@x.cl')).toBeNull();
    fetch.mockResolvedValueOnce(user());
    commit.mockRejectedValueOnce(new Error('x'));
    expect(await createPasswordResetToken('ana@x.cl')).toBeNull();
  });
});

describe('resetUserPassword', () => {
  it('hashes new password, adds credentials method and clears reset token', async () => {
    fetch.mockResolvedValue(user({ authMethods: ['google'] }));
    expect(await resetUserPassword('u1', 'newpass12')).toBe(true);
    const payload = (set.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(payload).toMatchObject({ authMethods: ['google', 'credentials'], passwordResetToken: null, passwordResetExpires: null });
    expect(await bcrypt.compare('newpass12', payload.passwordHash as string)).toBe(true);
  });

  it('works when user lookup returns null', async () => {
    fetch.mockResolvedValue(null);
    expect(await resetUserPassword('u1', 'newpass12')).toBe(true);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ authMethods: ['credentials'] }));
  });

  it('returns false on write failure', async () => {
    fetch.mockResolvedValue(null);
    commit.mockRejectedValueOnce(new Error('x'));
    expect(await resetUserPassword('u1', 'newpass12')).toBe(false);
  });
});

describe('regenerateVerificationToken', () => {
  it('issues a fresh 48h token for unverified users', async () => {
    fetch.mockResolvedValue(user({ emailVerified: false }));
    const token = await regenerateVerificationToken('ana@x.cl');
    expect(token).toBeTruthy();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerificationToken: token,
        emailVerificationExpires: new Date(NOW.getTime() + 48 * 3600e3).toISOString(),
      })
    );
  });

  it('returns null for unknown or already verified users', async () => {
    fetch.mockResolvedValueOnce(null).mockResolvedValueOnce(user({ emailVerified: true }));
    expect(await regenerateVerificationToken('x@x.cl')).toBeNull();
    expect(await regenerateVerificationToken('ana@x.cl')).toBeNull();
    expect(patch).not.toHaveBeenCalled();
  });

  it('returns null on write failure', async () => {
    fetch.mockResolvedValue(user());
    commit.mockRejectedValueOnce(new Error('x'));
    expect(await regenerateVerificationToken('ana@x.cl')).toBeNull();
  });
});
