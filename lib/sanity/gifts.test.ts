import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => {
  const commit = vi.fn<(...a: any[]) => any>(async () => ({}));
  const set = vi.fn<(...a: any[]) => any>(() => ({ commit }));
  const patch = vi.fn<(...a: any[]) => any>(() => ({ set }));
  return { commit, set, patch, fetch: vi.fn<(...a: any[]) => any>() };
});

vi.mock('@/sanity/lib/client', () => {
  const c = { fetch: m.fetch, patch: m.patch };
  return { client: c, writeClient: c };
});

import {
  getGiftsSentByUser,
  getGiftsReceivedByEmail,
  getGiftsRedeemedByUser,
  isCourseReceivedAsGift,
  getOrderByGiftToken,
  markGiftAsRedeemed,
} from './gifts';

beforeEach(() => vi.resetAllMocks());

describe('gift listings', () => {
  it('getGiftsSentByUser only returns paid gifts of the buyer', async () => {
    m.fetch.mockResolvedValue([{ _id: 'o1' }]);
    await expect(getGiftsSentByUser('u1')).resolves.toEqual([{ _id: 'o1' }]);
    const [q, p] = m.fetch.mock.calls[0];
    expect(q).toContain('userId._ref == $userId');
    expect(q).toContain('isGift == true && paymentStatus == 2');
    expect(p).toEqual({ userId: 'u1' });
  });

  it('getGiftsReceivedByEmail lowercases the email', async () => {
    m.fetch.mockResolvedValue([]);
    await getGiftsReceivedByEmail('Ana@X.CL');
    expect(m.fetch.mock.calls[0][0]).toContain('recipientEmail == $email');
    expect(m.fetch.mock.calls[0][1]).toEqual({ email: 'ana@x.cl' });
  });

  it('getGiftsRedeemedByUser filters by giftRedeemedBy', async () => {
    m.fetch.mockResolvedValue([]);
    await getGiftsRedeemedByUser('u1');
    expect(m.fetch.mock.calls[0][0]).toContain('giftRedeemedBy._ref == $userId');
    expect(m.fetch.mock.calls[0][1]).toEqual({ userId: 'u1' });
  });
});

describe('isCourseReceivedAsGift', () => {
  it('returns the sender when the access came from a gift order', async () => {
    m.fetch.mockResolvedValue({ order: { isGift: true, customerName: 'Ana', customerEmail: 'a@x.cl' } });
    await expect(isCourseReceivedAsGift('u1', 'c1')).resolves.toEqual({
      isGift: true,
      senderName: 'Ana',
      senderEmail: 'a@x.cl',
    });
    expect(m.fetch.mock.calls[0][1]).toEqual({ userId: 'u1', courseId: 'c1' });
  });

  it.each([null, {}, { order: null }, { order: { isGift: false } }])('is not a gift for %j', async (access) => {
    m.fetch.mockResolvedValue(access);
    await expect(isCourseReceivedAsGift('u1', 'c1')).resolves.toEqual({ isGift: false });
  });
});

describe('getOrderByGiftToken', () => {
  it('only matches paid orders by token', async () => {
    m.fetch.mockResolvedValue({ _id: 'o1', orderId: 'A' });
    await expect(getOrderByGiftToken('tok')).resolves.toEqual({ _id: 'o1', orderId: 'A' });
    const [q, p] = m.fetch.mock.calls[0];
    expect(q).toContain('giftToken == $giftToken && paymentStatus == 2');
    expect(p).toEqual({ giftToken: 'tok' });
  });

  it('returns null when not found', async () => {
    m.fetch.mockResolvedValue(null);
    await expect(getOrderByGiftToken('nope')).resolves.toBeNull();
  });
});

describe('markGiftAsRedeemed', () => {
  it('sets redemption date and user reference', async () => {
    m.fetch.mockResolvedValue('doc-1');
    await markGiftAsRedeemed('ORD-1', 'u1');
    expect(m.fetch.mock.calls[0][1]).toEqual({ orderId: 'ORD-1' });
    expect(m.patch).toHaveBeenCalledWith('doc-1');
    expect(m.set.mock.calls[0][0]).toMatchObject({
      giftRedeemedAt: expect.any(String),
      giftRedeemedBy: { _type: 'reference', _ref: 'u1' },
    });
    expect(m.commit).toHaveBeenCalled();
  });

  it('throws when the order does not exist', async () => {
    m.fetch.mockResolvedValue(null);
    await expect(markGiftAsRedeemed('ORD-1', 'u1')).rejects.toThrow('Orden ORD-1 no encontrada');
    expect(m.patch).not.toHaveBeenCalled();
  });
});
