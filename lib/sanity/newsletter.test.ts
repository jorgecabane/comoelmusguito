import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => {
  const commit = vi.fn<(...a: any[]) => any>(async () => ({}));
  const set = vi.fn<(...a: any[]) => any>(() => ({ commit }));
  const patch = vi.fn<(...a: any[]) => any>(() => ({ set }));
  const create = vi.fn<(...a: any[]) => any>(async () => ({ _id: 'new-sub' }));
  return { commit, set, patch, create, fetch: vi.fn<(...a: any[]) => any>() };
});

vi.mock('@/sanity/lib/client', () => {
  const c = { fetch: m.fetch, patch: m.patch, create: m.create };
  return { client: c, writeClient: c };
});

import {
  isEmailSubscribed,
  getSubscriberByEmail,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getActiveSubscribers,
  getNewsletterStats,
} from './newsletter';

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const sub = (over: Record<string, any> = {}) => ({
  _id: 's1',
  _type: 'newsletterSubscriber',
  email: 'a@x.cl',
  name: 'Ana',
  source: 'footer-general',
  active: true,
  ...over,
});

describe('isEmailSubscribed / getSubscriberByEmail', () => {
  it('lowercases the email and checks active subscribers', async () => {
    m.fetch.mockResolvedValue(sub());
    await expect(isEmailSubscribed('A@X.CL')).resolves.toBe(true);
    expect(m.fetch.mock.calls[0][0]).toContain('active == true');
    expect(m.fetch.mock.calls[0][1]).toEqual({ email: 'a@x.cl' });
  });

  it('isEmailSubscribed is false when missing or on error', async () => {
    m.fetch.mockResolvedValueOnce(null);
    await expect(isEmailSubscribed('a@x.cl')).resolves.toBe(false);
    m.fetch.mockRejectedValueOnce(new Error('x'));
    await expect(isEmailSubscribed('a@x.cl')).resolves.toBe(false);
  });

  it('getSubscriberByEmail returns the doc or null on error', async () => {
    m.fetch.mockResolvedValueOnce(sub());
    await expect(getSubscriberByEmail('A@x.cl')).resolves.toMatchObject({ _id: 's1' });
    m.fetch.mockRejectedValueOnce(new Error('x'));
    await expect(getSubscriberByEmail('a@x.cl')).resolves.toBeNull();
  });
});

describe('subscribeToNewsletter', () => {
  it('creates a new subscriber with defaults', async () => {
    m.fetch.mockResolvedValue(null);
    await expect(subscribeToNewsletter({ email: 'New@X.cl' })).resolves.toEqual({
      success: true,
      alreadySubscribed: false,
      subscriberId: 'new-sub',
    });
    expect(m.create.mock.calls[0][0]).toMatchObject({
      _type: 'newsletterSubscriber',
      email: 'new@x.cl',
      source: 'footer-home',
      active: true,
      subscribedAt: expect.any(String),
    });
  });

  it('honours the given source and name', async () => {
    m.fetch.mockResolvedValue(null);
    await subscribeToNewsletter({ email: 'a@x.cl', name: 'Ana', source: 'contact-page' });
    expect(m.create.mock.calls[0][0]).toMatchObject({ name: 'Ana', source: 'contact-page' });
  });

  it('reactivates an inactive subscriber keeping previous name/source', async () => {
    m.fetch.mockResolvedValue(sub({ active: false }));
    await expect(subscribeToNewsletter({ email: 'a@x.cl' })).resolves.toEqual({
      success: true,
      alreadySubscribed: false,
      subscriberId: 's1',
    });
    expect(m.patch).toHaveBeenCalledWith('s1');
    expect(m.set.mock.calls[0][0]).toMatchObject({ active: true, name: 'Ana', source: 'footer-general' });
    expect(m.create).not.toHaveBeenCalled();
  });

  it('reactivation prefers new name/source', async () => {
    m.fetch.mockResolvedValue(sub({ active: false }));
    await subscribeToNewsletter({ email: 'a@x.cl', name: 'Nuevo', source: 'other' });
    expect(m.set.mock.calls[0][0]).toMatchObject({ name: 'Nuevo', source: 'other' });
  });

  it('updates the name of an active subscriber when it changed', async () => {
    m.fetch.mockResolvedValue(sub());
    await expect(subscribeToNewsletter({ email: 'a@x.cl', name: 'Ana María' })).resolves.toMatchObject({
      alreadySubscribed: true,
    });
    expect(m.set.mock.calls[0][0]).toMatchObject({ name: 'Ana María' });
  });

  it.each([undefined, 'Ana'])('does not write for an active subscriber with name=%s', async (name) => {
    m.fetch.mockResolvedValue(sub());
    await expect(subscribeToNewsletter({ email: 'a@x.cl', name })).resolves.toMatchObject({
      alreadySubscribed: true,
      subscriberId: 's1',
    });
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('rethrows write errors', async () => {
    m.fetch.mockResolvedValue(null);
    m.create.mockRejectedValueOnce(new Error('write'));
    await expect(subscribeToNewsletter({ email: 'a@x.cl' })).rejects.toThrow('write');
  });
});

describe('unsubscribeFromNewsletter', () => {
  it('deactivates an active subscriber', async () => {
    m.fetch.mockResolvedValue(sub());
    await expect(unsubscribeFromNewsletter('A@X.cl')).resolves.toBe(true);
    expect(m.fetch.mock.calls[0][1]).toEqual({ email: 'a@x.cl' });
    expect(m.set.mock.calls[0][0]).toMatchObject({ active: false, unsubscribedAt: expect.any(String) });
  });

  it.each([null, sub({ active: false })])('returns false for %j', async (existing) => {
    m.fetch.mockResolvedValue(existing);
    await expect(unsubscribeFromNewsletter('a@x.cl')).resolves.toBe(false);
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('rethrows write errors', async () => {
    m.fetch.mockResolvedValue(sub());
    m.commit.mockRejectedValueOnce(new Error('write'));
    await expect(unsubscribeFromNewsletter('a@x.cl')).rejects.toThrow('write');
  });
});

describe('getActiveSubscribers / getNewsletterStats', () => {
  it('returns active subscribers or [] on error', async () => {
    m.fetch.mockResolvedValueOnce([sub()]);
    await expect(getActiveSubscribers()).resolves.toHaveLength(1);
    m.fetch.mockRejectedValueOnce(new Error('x'));
    await expect(getActiveSubscribers()).resolves.toEqual([]);
  });

  it('queries stats with a 30-day window', async () => {
    vi.useFakeTimers({ now: new Date('2026-02-15T12:00:00Z') });
    const stats = { total: 3, active: 2, inactive: 1, recentSubscriptions: 1 };
    m.fetch.mockResolvedValue(stats);
    await expect(getNewsletterStats()).resolves.toEqual(stats);
    vi.useRealTimers();
    expect(m.fetch.mock.calls[0][1]).toEqual({ date: '2026-01-16T12:00:00.000Z' });
  });

  it('returns zeros on error', async () => {
    m.fetch.mockRejectedValue(new Error('x'));
    await expect(getNewsletterStats()).resolves.toEqual({ total: 0, active: 0, inactive: 0, recentSubscriptions: 0 });
  });
});
