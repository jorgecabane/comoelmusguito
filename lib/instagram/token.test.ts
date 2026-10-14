import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isTokenExpiredError, refreshInstagramToken } from './token';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe('refreshInstagramToken', () => {
  it('calls the Graph refresh endpoint and returns the new token', async () => {
    fetchMock.mockResolvedValue(Response.json({ access_token: 'new', token_type: 'bearer', expires_in: 5184000 }));

    await expect(refreshInstagramToken('old')).resolves.toEqual({ token: 'new', expiresIn: 5184000 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=old',
      { method: 'GET' }
    );
  });

  it('returns null when Instagram rejects the token', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: { code: 190 } }, { status: 400 }));
    await expect(refreshInstagramToken('old')).resolves.toBeNull();
  });

  it('returns null when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('oops', { status: 500 }));
    await expect(refreshInstagramToken('old')).resolves.toBeNull();
  });

  it('returns null on network failure', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(refreshInstagramToken('old')).resolves.toBeNull();
  });
});

describe('isTokenExpiredError', () => {
  it.each([
    [{ error: { code: 190 } }],
    [{ error: { type: 'OAuthException' } }],
    [{ error: { message: 'Session has expired' } }],
    [{ error: { message: 'invalid signature' } }],
    [{ error: { message: 'Token missing' } }],
  ])('detects %j as expired', (err) => {
    expect(isTokenExpiredError(err)).toBe(true);
  });

  it.each([[null], ['string'], [{}], [{ error: { code: 4, message: 'rate limit' } }]])(
    'ignores %j',
    (err) => {
      expect(isTokenExpiredError(err)).toBe(false);
    }
  );
});
