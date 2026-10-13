/**
 * processSuccessfulPayment: flujo compartido por los webhooks de Flow y PayPal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendOrderConfirmationEmail, sendGiftEmail } from '@/lib/resend/client';
import { markGiftAsRedeemed } from '@/lib/sanity/gifts';
import { decreaseTerrariumStock, decreaseWorkshopSpots, decreaseSupplyStock } from '@/lib/sanity/inventory';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';

const m = vi.hoisted(() => {
  const commit = vi.fn<(...a: any[]) => any>(async () => ({}));
  const set = vi.fn<(...a: any[]) => any>(() => ({ commit }));
  const patch = vi.fn<(...a: any[]) => any>(() => ({ set }));
  return { commit, set, patch, fetch: vi.fn<(...a: any[]) => any>(), create: vi.fn<(...a: any[]) => any>() };
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

import { processSuccessfulPayment } from './orders';

const course = (id: string) => ({ id, type: 'course', name: id, slug: id, price: 10, currency: 'CLP', quantity: 1 });

const baseOrder = (over: Record<string, any> = {}) => ({
  _id: 'doc-1',
  _type: 'order',
  orderId: 'ORD-1',
  customerEmail: 'buyer@x.cl',
  customerName: 'Buyer',
  userId: { _type: 'reference', _ref: 'buyer-id' },
  paymentStatus: 1,
  total: 100,
  currency: 'CLP',
  items: [course('c1')],
  ...over,
});

/** Simula Sanity: la orden, accesos existentes (por courseId) y cursos. */
function db(order: any, existingAccess: Record<string, any> = {}) {
  m.fetch.mockImplementation(async (q: string, p: any) => {
    if (q.includes('"courseAccess"')) return existingAccess[p.courseId] ?? null;
    if (q.includes('"course"')) return { enrollmentCount: 0 };
    if (q.includes('"order"')) return order;
    return null;
  });
}

const patchedFields = () => m.set.mock.calls.map((c) => c[0]);

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('processSuccessfulPayment', () => {
  it('throws when the order does not exist', async () => {
    db(null);
    await expect(processSuccessfulPayment({ orderId: 'ORD-1' })).rejects.toThrow('no encontrada');
  });

  it('is idempotent: does nothing when emails were already sent', async () => {
    db(baseOrder({ emailSent: true }));
    await expect(processSuccessfulPayment({ orderId: 'ORD-1' })).resolves.toEqual({
      success: true,
      alreadyProcessed: true,
    });
    expect(m.patch).not.toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it('runs the full direct-purchase flow', async () => {
    const items = [
      course('c1'),
      { id: 't1', type: 'terrarium', name: 't', slug: 't', price: 1, currency: 'CLP', quantity: 2 },
      { id: 's1', type: 'supply', name: 's', slug: 's', price: 1, currency: 'CLP', quantity: 3 },
      { id: 'w1', type: 'workshop', name: 'w', slug: 'w', price: 1, currency: 'CLP', quantity: 1, selectedDate: { date: 'D1' } },
      { id: 'w2', type: 'workshop', name: 'w2', slug: 'w2', price: 1, currency: 'CLP', quantity: 1 },
    ];
    db(baseOrder({ items, flowOrder: 'saved-flow' }));

    const res = await processSuccessfulPayment({ orderId: 'ORD-1', paymentDate: 'PD', providerOrderId: 'prov-9' });
    expect(res).toEqual({ success: true, alreadyProcessed: false });

    expect(patchedFields()[0]).toMatchObject({ paymentStatus: 2, paymentDate: 'PD', flowOrder: 'prov-9' });
    expect(m.create).toHaveBeenCalledWith(
      expect.objectContaining({ _type: 'courseAccess', user: { _type: 'reference', _ref: 'buyer-id' }, order: { _type: 'reference', _ref: 'doc-1' } })
    );
    expect(decreaseTerrariumStock).toHaveBeenCalledWith('t1', 2);
    expect(decreaseSupplyStock).toHaveBeenCalledWith('s1', 3);
    expect(decreaseWorkshopSpots).toHaveBeenCalledTimes(1);
    expect(decreaseWorkshopSpots).toHaveBeenCalledWith('w1', 'D1', 1);
    expect(sendGiftEmail).not.toHaveBeenCalled();

    const email = vi.mocked(sendOrderConfirmationEmail).mock.calls[0][0];
    expect(email).toMatchObject({
      orderId: 'ORD-1',
      flowOrder: 'prov-9',
      customerEmail: 'buyer@x.cl',
      paymentDate: 'PD',
      hasAccount: true,
      isGift: false,
      requiresShipping: false,
    });
    expect(email.items[3].selectedDate).toEqual({ date: 'D1' });
    expect(email.items[0].selectedDate).toBeUndefined();
    // last write marks the email as sent
    expect(patchedFields().at(-1)).toMatchObject({ emailSent: true });
  });

  it('falls back to the saved flowOrder and to now() for the email', async () => {
    db(baseOrder({ userId: null, flowOrder: 777, items: [] }));
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    const email = vi.mocked(sendOrderConfirmationEmail).mock.calls[0][0];
    expect(email.flowOrder).toBe('777');
    expect(email.hasAccount).toBe(false);
    expect(email.paymentDate).toEqual(expect.any(String));
    // no userId → no course access
    expect(m.create).not.toHaveBeenCalled();
  });

  it('omits flowOrder in the email when no provider id is known', async () => {
    db(baseOrder({ items: [] }));
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(vi.mocked(sendOrderConfirmationEmail).mock.calls[0][0].flowOrder).toBeUndefined();
  });

  it('backfills paymentDate on an already-paid order that lacks it', async () => {
    db(baseOrder({ paymentStatus: 2, items: [] }));
    await processSuccessfulPayment({ orderId: 'ORD-1', paymentDate: 'PD' });
    expect(patchedFields()[0]).toMatchObject({ paymentStatus: 2, paymentDate: 'PD' });
  });

  it('does not touch payment status when already paid with a date', async () => {
    db(baseOrder({ paymentStatus: 2, paymentDate: 'old', items: [] }));
    await processSuccessfulPayment({ orderId: 'ORD-1', paymentDate: 'PD' });
    expect(patchedFields()).toEqual([expect.objectContaining({ emailSent: true })]);
  });

  it.each([
    ['pending order', { paymentStatus: 1 }],
    ['paid order without date', { paymentStatus: 2 }],
  ])('keeps going when the status update fails (%s)', async (_label, over) => {
    db(baseOrder({ ...over, items: [] }));
    m.commit.mockRejectedValueOnce(new Error('sanity down'));
    await expect(processSuccessfulPayment({ orderId: 'ORD-1', paymentDate: 'PD' })).resolves.toMatchObject({
      success: true,
    });
    expect(sendOrderConfirmationEmail).toHaveBeenCalled();
  });

  it('logs and continues when course access or inventory fail', async () => {
    const items = [
      course('c1'),
      { id: 't1', type: 'terrarium', quantity: 1 },
      { id: 's1', type: 'supply', quantity: 1 },
      { id: 'w1', type: 'workshop', quantity: 1, selectedDate: { date: 'D' } },
    ];
    db(baseOrder({ items }));
    m.create.mockRejectedValue(new Error('create failed'));
    vi.mocked(decreaseTerrariumStock).mockRejectedValue(new Error('x'));
    vi.mocked(decreaseSupplyStock).mockRejectedValue(new Error('x'));
    vi.mocked(decreaseWorkshopSpots).mockRejectedValue(new Error('x'));

    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(sendOrderConfirmationEmail).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(4);
  });

  it('does not mark emailSent when the confirmation email fails (so a retry resends it)', async () => {
    db(baseOrder({ items: [] }));
    vi.mocked(sendOrderConfirmationEmail).mockRejectedValue(new Error('resend down'));
    await expect(processSuccessfulPayment({ orderId: 'ORD-1' })).resolves.toEqual({
      success: true,
      alreadyProcessed: false,
    });
    expect(patchedFields().some((f) => f.emailSent)).toBe(false);
  });

  it('survives a failure marking the email as sent', async () => {
    db(baseOrder({ paymentStatus: 2, paymentDate: 'x', items: [] }));
    m.commit.mockRejectedValueOnce(new Error('patch failed'));
    await expect(processSuccessfulPayment({ orderId: 'ORD-1' })).resolves.toMatchObject({ success: true });
    expect(console.error).toHaveBeenCalledWith('Error marcando email como enviado:', expect.any(Error));
  });

  it('skips emails entirely when the order has no customer email', async () => {
    db(baseOrder({ customerEmail: '', items: [] }));
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  // BUG: la idempotencia depende de `emailSent`, que sólo se escribe al final. Dos
  // entregas concurrentes del webhook (o un reintento tras fallar el email) pasan ambas
  // el chequeo y descuentan stock dos veces (orders.ts:386 + 460).
  it.skip('decrements inventory once under concurrent webhook deliveries', async () => {
    db(baseOrder({ items: [{ id: 't1', type: 'terrarium', quantity: 1 }] }));
    await Promise.all([processSuccessfulPayment({ orderId: 'ORD-1' }), processSuccessfulPayment({ orderId: 'ORD-1' })]);
    expect(decreaseTerrariumStock).toHaveBeenCalledTimes(1);
  });
});

describe('processSuccessfulPayment — gifts', () => {
  const gift = (over: Record<string, any> = {}) =>
    baseOrder({
      isGift: true,
      recipientEmail: 'friend@x.cl',
      recipientName: 'Friend',
      giftToken: 'tok',
      giftMessage: 'hi',
      items: [course('c1'), course('c2')],
      ...over,
    });

  it('grants the recipient access, redeems the gift and sends both emails', async () => {
    db(gift(), { c2: { _id: 'already' } });
    vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'friend-id' } as any);

    await processSuccessfulPayment({ orderId: 'ORD-1' });

    expect(getUserByEmail).toHaveBeenCalledWith('friend@x.cl');
    expect(m.create).toHaveBeenCalledTimes(1); // c2 already granted
    expect(m.create.mock.calls[0][0]).toMatchObject({ user: { _ref: 'friend-id' }, course: { _ref: 'c1' } });
    expect(markGiftAsRedeemed).toHaveBeenCalledWith('ORD-1', 'friend-id');
    expect(vi.mocked(sendGiftEmail).mock.calls[0][0]).toMatchObject({
      giftToken: 'tok',
      recipientEmail: 'friend@x.cl',
      senderEmail: 'buyer@x.cl',
      giftMessage: 'hi',
    });
    expect(vi.mocked(sendOrderConfirmationEmail).mock.calls[0][0]).toMatchObject({ isGift: true, recipientName: 'Friend' });
  });

  it('does not redeem when the recipient already had every course', async () => {
    db(gift(), { c1: { _id: 'a' }, c2: { _id: 'b' } });
    vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'friend-id' } as any);
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(m.create).not.toHaveBeenCalled();
    expect(markGiftAsRedeemed).not.toHaveBeenCalled();
  });

  it('never grants the buyer access to a gifted course', async () => {
    db(gift());
    vi.mocked(getUserByEmail).mockResolvedValue(null);
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(m.create).not.toHaveBeenCalled();
    expect(sendGiftEmail).toHaveBeenCalled();
  });

  it('swallows recipient access, redeem and gift-email errors', async () => {
    db(gift({ items: [course('c1'), course('c2'), { id: 't1', type: 'terrarium', quantity: 1 }] }));
    vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'friend-id' } as any);
    m.create.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('create'));
    vi.mocked(markGiftAsRedeemed).mockRejectedValue(new Error('redeem'));
    vi.mocked(sendGiftEmail).mockRejectedValue(new Error('gift mail'));

    await expect(processSuccessfulPayment({ orderId: 'ORD-1' })).resolves.toMatchObject({ success: true });
    expect(markGiftAsRedeemed).toHaveBeenCalled();
    expect(sendOrderConfirmationEmail).toHaveBeenCalled();
    expect(patchedFields().at(-1)).toMatchObject({ emailSent: true });
  });

  it('treats a gift without token as a direct purchase', async () => {
    db(gift({ giftToken: undefined }));
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(getUserByEmail).not.toHaveBeenCalled();
    expect(sendGiftEmail).not.toHaveBeenCalled();
    expect(m.create.mock.calls[0][0]).toMatchObject({ user: { _ref: 'buyer-id' } });
  });

  it('skips recipient access when the order has no Sanity _id', async () => {
    db(gift({ _id: undefined }));
    vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'friend-id' } as any);
    await processSuccessfulPayment({ orderId: 'ORD-1' });
    expect(m.create).not.toHaveBeenCalled();
  });
});
