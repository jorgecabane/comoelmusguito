import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({ getUserByVerificationToken: vi.fn(), verifyUserEmail: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => m);

import { GET } from './route';

const location = async (qs = '') => {
  const res = await GET(new NextRequest(`http://localhost/api/auth/verify-email${qs}`));
  expect(res.status).toBe(307);
  const url = new URL(res.headers.get('location')!);
  return url.pathname + url.search;
};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m.getUserByVerificationToken.mockReset();
  m.verifyUserEmail.mockReset();
});

describe('GET /api/auth/verify-email', () => {
  it('redirects to error without token', async () => {
    expect(await location()).toBe('/auth/error?error=VerificationTokenMissing');
  });

  it('redirects to error for used or expired token', async () => {
    m.getUserByVerificationToken.mockResolvedValue(null);
    expect(await location('?token=t')).toBe('/auth/error?error=TokenUsedOrExpired');
    expect(m.getUserByVerificationToken).toHaveBeenCalledWith('t');
  });

  it('redirects already verified users to login without re-verifying', async () => {
    m.getUserByVerificationToken.mockResolvedValue({ _id: 'u1', emailVerified: true });
    expect(await location('?token=t')).toBe('/auth/login?alreadyVerified=true');
    expect(m.verifyUserEmail).not.toHaveBeenCalled();
  });

  it('verifies and redirects to login', async () => {
    m.getUserByVerificationToken.mockResolvedValue({ _id: 'u1', emailVerified: false });
    m.verifyUserEmail.mockResolvedValue(true);
    expect(await location('?token=t')).toBe('/auth/login?verified=true');
    expect(m.verifyUserEmail).toHaveBeenCalledWith('u1');
  });

  it('redirects to error when the write fails', async () => {
    m.getUserByVerificationToken.mockResolvedValue({ _id: 'u1' });
    m.verifyUserEmail.mockResolvedValue(false);
    expect(await location('?token=t')).toBe('/auth/error?error=VerificationFailed');
  });

  it('redirects to error on unexpected exceptions', async () => {
    m.getUserByVerificationToken.mockRejectedValue(new Error('db'));
    expect(await location('?token=t')).toBe('/auth/error?error=VerificationError');
  });
});
