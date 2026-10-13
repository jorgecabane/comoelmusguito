import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CartItem } from '@/types/cart';

const m = vi.hoisted(() => {
  const commit = vi.fn<(...a: any[]) => any>(async () => ({}));
  const set = vi.fn<(...a: any[]) => any>(() => ({ commit }));
  const patch = vi.fn<(...a: any[]) => any>(() => ({ set }));
  const fetch = vi.fn<(...a: any[]) => any>();
  const create = vi.fn<(...a: any[]) => any>(async (doc: any) => ({ _id: 'new-id', ...doc }));
  return { commit, set, patch, fetch, create };
});

vi.mock('@/sanity/lib/client', () => {
  const c = { fetch: m.fetch, create: m.create, patch: m.patch };
  return { client: c, writeClient: c };
});
vi.mock('@/lib/resend/client', () => ({ sendOrderConfirmationEmail: vi.fn(), sendGiftEmail: vi.fn() }));
vi.mock('@/lib/sanity/gifts', () => ({ markGiftAsRedeemed: vi.fn() }));
vi.mock('@/lib/sanity/inventory', () => ({
  decreaseTerrariumStock: vi.fn(),
  decreaseWorkshopSpots: vi.fn(),
  decreaseSupplyStock: vi.fn(),
}));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: vi.fn() }));

import {
  saveOrderToSanity,
  updateOrderPaymentStatus,
  markOrderEmailSent,
  getOrderByOrderId,
  getOrdersByEmail,
  linkOrdersToUser,
  getOrdersByUserId,
  getLastShippingAddressByUserId,
  createCourseAccess,
} from './orders';

const ACCESS_Q = '*[_type == "courseAccess" && user._ref == $userId && course._ref == $courseId][0]';

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const cartItem = (over: Partial<CartItem> = {}): CartItem => ({
  id: 'p1',
  type: 'terrarium',
  name: 'Terrario',
  slug: 'terrario',
  image: '/x.jpg',
  price: 1000,
  currency: 'CLP',
  quantity: 2,
  inStock: true,
  ...over,
});

describe('saveOrderToSanity', () => {
  it('builds a pending order with normalized email, user ref and items', async () => {
    const snapshot = { image: 'img', description: 'd' };
    const items = [
      cartItem({ shippingPreference: 'shipping', ...({ snapshot } as any) }),
      cartItem({
        id: 'w1',
        type: 'workshop',
        selectedDate: { date: '2026-01-01T15:00:00Z', spotsAvailable: 3, price: 10 },
      }),
    ];
    const created = await saveOrderToSanity({
      orderId: 'ORD-1',
      flowOrder: '999',
      customerEmail: 'Foo@Bar.CL',
      customerName: 'Foo',
      userId: 'user-1',
      items,
      total: 3000,
      currency: 'CLP',
      isGift: true,
      recipientEmail: 'r@x.cl',
      giftToken: 'tok',
      requiresShipping: true,
    });

    const doc = m.create.mock.calls[0][0];
    expect(doc).toMatchObject({
      _type: 'order',
      orderId: 'ORD-1',
      flowOrder: '999',
      customerEmail: 'foo@bar.cl',
      userId: { _type: 'reference', _ref: 'user-1' },
      total: 3000,
      paymentStatus: 1,
      paymentProvider: 'flow',
      isGift: true,
      giftToken: 'tok',
      requiresShipping: true,
    });
    expect(doc.items).toHaveLength(2);
    expect(doc.items[0]).toMatchObject({ id: 'p1', shippingPreference: 'shipping', snapshot, selectedDate: undefined });
    expect(doc.items[0]._key).toMatch(/^p1-0-\d+$/);
    // only the ISO date is persisted (spots/price are dropped)
    expect(doc.items[1].selectedDate).toEqual({ date: '2026-01-01T15:00:00Z' });
    expect(created._id).toBe('new-id');
  });

  it('applies defaults when optional fields are missing', async () => {
    await saveOrderToSanity({
      orderId: 'ORD-2',
      customerEmail: 'a@b.cl',
      items: [],
      total: 0,
      currency: 'USD',
      paymentProvider: 'paypal',
    });
    const doc = m.create.mock.calls[0][0];
    expect(doc.flowOrder).toBeUndefined();
    expect(doc.userId).toBeUndefined();
    expect(doc.isGift).toBe(false);
    expect(doc.requiresShipping).toBe(false);
    expect(doc.paymentProvider).toBe('paypal');
  });
});

describe('updateOrderPaymentStatus', () => {
  it('throws when the order does not exist', async () => {
    m.fetch.mockResolvedValue(null);
    await expect(updateOrderPaymentStatus('X', 2)).rejects.toThrow('Orden X no encontrada');
    m.fetch.mockResolvedValue({ orderId: 'X' }); // no _id
    await expect(updateOrderPaymentStatus('X', 2)).rejects.toThrow();
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('sets the given paymentDate and stringifies numeric flowOrder', async () => {
    m.fetch.mockResolvedValue({ _id: 'doc1' });
    await updateOrderPaymentStatus('O1', 2, '2026-01-01', 12345);
    expect(m.fetch).toHaveBeenCalledWith(expect.stringContaining('orderId == $orderId'), { orderId: 'O1' });
    expect(m.patch).toHaveBeenCalledWith('doc1');
    expect(m.set.mock.calls[0][0]).toMatchObject({ paymentStatus: 2, paymentDate: '2026-01-01', flowOrder: '12345' });
    expect(m.commit).toHaveBeenCalled();
  });

  it('keeps a string flowOrder as-is', async () => {
    m.fetch.mockResolvedValue({ _id: 'doc1' });
    await updateOrderPaymentStatus('O1', 3, undefined, 'abc');
    const updates = m.set.mock.calls[0][0];
    expect(updates.flowOrder).toBe('abc');
    expect(updates).not.toHaveProperty('paymentDate'); // not paid → no fallback date
  });

  it('falls back to now as paymentDate when paid without a date', async () => {
    vi.useFakeTimers({ now: new Date('2026-05-05T10:00:00Z') });
    m.fetch.mockResolvedValue({ _id: 'doc1' });
    await updateOrderPaymentStatus('O1', 2);
    expect(m.set.mock.calls[0][0].paymentDate).toBe('2026-05-05T10:00:00.000Z');
    vi.useRealTimers();
  });

  it('does not overwrite an existing paymentDate when paid without a date', async () => {
    m.fetch.mockResolvedValue({ _id: 'doc1', paymentDate: 'old' });
    await updateOrderPaymentStatus('O1', 2);
    expect(m.set.mock.calls[0][0]).not.toHaveProperty('paymentDate');
    expect(m.set.mock.calls[0][0]).not.toHaveProperty('flowOrder');
  });
});

describe('markOrderEmailSent', () => {
  it('patches emailSent=true', async () => {
    m.fetch.mockResolvedValue({ _id: 'doc1' });
    await markOrderEmailSent('O1');
    expect(m.patch).toHaveBeenCalledWith('doc1');
    expect(m.set.mock.calls[0][0]).toMatchObject({ emailSent: true });
  });

  it('throws for a missing order', async () => {
    m.fetch.mockResolvedValue(null);
    await expect(markOrderEmailSent('O1')).rejects.toThrow('no encontrada');
  });
});

describe('simple order queries', () => {
  it('getOrderByOrderId returns the fetched doc', async () => {
    m.fetch.mockResolvedValue({ _id: 'a' });
    await expect(getOrderByOrderId('O1')).resolves.toEqual({ _id: 'a' });
  });

  it('getOrdersByEmail lowercases and excludes linked orders by default', async () => {
    m.fetch.mockResolvedValue([]);
    await getOrdersByEmail('A@B.CL');
    const [q, params] = m.fetch.mock.calls[0];
    expect(q).toContain('!defined(userId)');
    expect(q).toContain('order(createdAt desc)');
    expect(params).toEqual({ email: 'a@b.cl' });
  });

  it('getOrdersByEmail can include linked orders', async () => {
    m.fetch.mockResolvedValue([]);
    await getOrdersByEmail('a@b.cl', true);
    expect(m.fetch.mock.calls[0][0]).not.toContain('defined(userId)');
  });

  it('getOrdersByUserId queries by user ref', async () => {
    m.fetch.mockResolvedValue([{ _id: 'x' }]);
    await expect(getOrdersByUserId('u1')).resolves.toHaveLength(1);
    expect(m.fetch.mock.calls[0][1]).toEqual({ userId: 'u1' });
  });

  it('getLastShippingAddressByUserId returns the address or null', async () => {
    const addr = { region: 'RM' };
    m.fetch.mockResolvedValueOnce({ shippingAddress: addr });
    await expect(getLastShippingAddressByUserId('u1')).resolves.toBe(addr);
    m.fetch.mockResolvedValueOnce(null);
    await expect(getLastShippingAddressByUserId('u1')).resolves.toBeNull();
    m.fetch.mockResolvedValueOnce({});
    await expect(getLastShippingAddressByUserId('u1')).resolves.toBeNull();
  });
});

describe('createCourseAccess', () => {
  it('is idempotent: skips creation when access exists', async () => {
    m.fetch.mockResolvedValueOnce({ _id: 'acc' });
    await createCourseAccess('u1', 'c1', 'ord1');
    expect(m.fetch).toHaveBeenCalledWith(ACCESS_Q, { userId: 'u1', courseId: 'c1' });
    expect(m.create).not.toHaveBeenCalled();
  });

  it('creates the access and increments enrollmentCount', async () => {
    m.fetch.mockResolvedValueOnce(null).mockResolvedValueOnce({ enrollmentCount: 4 });
    await createCourseAccess('u1', 'c1', 'ord1');
    expect(m.create.mock.calls[0][0]).toMatchObject({
      _type: 'courseAccess',
      user: { _ref: 'u1' },
      course: { _ref: 'c1' },
      order: { _ref: 'ord1' },
      progress: { completedLessons: [], totalWatchTime: 0 },
    });
    expect(m.patch).toHaveBeenCalledWith('c1');
    expect(m.set.mock.calls[0][0]).toMatchObject({ enrollmentCount: 5 });
  });

  it('starts enrollmentCount at 1 when undefined', async () => {
    m.fetch.mockResolvedValueOnce(null).mockResolvedValueOnce({});
    await createCourseAccess('u1', 'c1', 'ord1');
    expect(m.set.mock.calls[0][0].enrollmentCount).toBe(1);
  });

  it('skips the counter when the course is missing', async () => {
    m.fetch.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    await createCourseAccess('u1', 'c1', 'ord1');
    expect(m.create).toHaveBeenCalled();
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('does not fail when incrementing the counter throws', async () => {
    m.fetch.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error('boom'));
    await expect(createCourseAccess('u1', 'c1', 'ord1')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it('propagates create failures', async () => {
    m.fetch.mockResolvedValueOnce(null);
    m.create.mockRejectedValueOnce(new Error('write failed'));
    await expect(createCourseAccess('u1', 'c1', 'ord1')).rejects.toThrow('write failed');
  });
});

describe('linkOrdersToUser', () => {
  it('returns 0 and writes nothing when there are no orphan orders', async () => {
    m.fetch.mockResolvedValue([]);
    await expect(linkOrdersToUser('a@b.cl', 'u1')).resolves.toBe(0);
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('links all orders and grants courses only for paid, non-gift orders', async () => {
    const orders = [
      { _id: 'o1', orderId: 'A', paymentStatus: 2, items: [{ id: 'c1', type: 'course' }, { id: 't1', type: 'terrarium' }] },
      { _id: 'o2', orderId: 'B', paymentStatus: 1, items: [{ id: 'c2', type: 'course' }] },
      { _id: 'o3', orderId: 'C', paymentStatus: 2, isGift: true, items: [{ id: 'c3', type: 'course' }] },
      { orderId: 'D', paymentStatus: 2, items: [{ id: 'c4', type: 'course' }] }, // no _id
    ];
    m.fetch.mockImplementation(async (q: string) => {
      if (q.includes('customerEmail')) return orders;
      return null; // no existing access, no course doc
    });

    await expect(linkOrdersToUser('A@B.cl', 'u1')).resolves.toBe(4);

    expect(m.patch.mock.calls.map((c) => c[0])).toEqual(['o1', 'o2', 'o3']);
    expect(m.set.mock.calls[0][0]).toMatchObject({ userId: { _type: 'reference', _ref: 'u1' } });
    expect(m.create).toHaveBeenCalledTimes(1);
    expect(m.create.mock.calls[0][0]).toMatchObject({ course: { _ref: 'c1' }, order: { _ref: 'o1' } });
  });

  it('skips existing accesses and swallows access errors', async () => {
    const orders = [
      { _id: 'o1', orderId: 'A', paymentStatus: 2, items: [{ id: 'c1', type: 'course' }, { id: 'c2', type: 'course' }] },
    ];
    m.fetch.mockImplementation(async (q: string, p: any) => {
      if (q.includes('customerEmail')) return orders;
      if (p.courseId === 'c1') return { _id: 'existing' };
      throw new Error('network');
    });
    await expect(linkOrdersToUser('a@b.cl', 'u1')).resolves.toBe(1);
    expect(m.create).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
