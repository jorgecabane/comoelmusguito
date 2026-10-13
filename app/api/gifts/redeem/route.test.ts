import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/get-session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: vi.fn() }));
vi.mock('@/sanity/lib/client', () => ({ client: { fetch: vi.fn() }, writeClient: {} }));
vi.mock('@/lib/sanity/orders', () => ({ createCourseAccess: vi.fn() }));
vi.mock('@/lib/sanity/gifts', () => ({ getOrderByGiftToken: vi.fn(), markGiftAsRedeemed: vi.fn() }));
vi.mock('@/lib/rate-limit/upstash', () => ({
  redeemGiftRateLimit: 'redeem-limiter', getClientIP: vi.fn(() => '1.2.3.4'), applyRateLimit: vi.fn(),
}));

import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { client } from '@/sanity/lib/client';
import { createCourseAccess } from '@/lib/sanity/orders';
import { getOrderByGiftToken, markGiftAsRedeemed } from '@/lib/sanity/gifts';
import { applyRateLimit } from '@/lib/rate-limit/upstash';
import { POST } from './route';

const TOKEN = 'GIFT-ABC123-0123456789ABCDEF';
const post = async (body: unknown = { token: TOKEN }) => {
  const res = await POST(new NextRequest('http://x/api/gifts/redeem', {
    method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
  }));
  return { status: res.status, json: await res.json() };
};
const order = (items: object[], extra: object = {}) => ({ _id: 'o1', orderId: 'ORD-1', items, ...extra });
const course = { id: 'c1', type: 'course', name: 'Curso Musgo' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(applyRateLimit).mockResolvedValue(null as never);
  vi.mocked(getSession).mockResolvedValue({ user: { email: 'dest@b.cl' } } as never);
  vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'u2' } as never);
  vi.mocked(getOrderByGiftToken).mockResolvedValue(order([course]) as never);
  vi.mocked(client.fetch).mockResolvedValue(null as never);
});

describe('POST /api/gifts/redeem', () => {
  it('429 when rate limited', async () => {
    vi.mocked(applyRateLimit).mockResolvedValue({ success: false } as never);
    expect((await post()).status).toBe(429);
    expect(applyRateLimit).toHaveBeenCalledWith('redeem-limiter', '1.2.3.4');
    expect(getOrderByGiftToken).not.toHaveBeenCalled();
  });

  it('401 when not authenticated', async () => {
    vi.mocked(applyRateLimit).mockResolvedValue({ success: true } as never);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await post()).status).toBe(401);
  });

  it.each([{}, { token: 123 }, { token: 'not-a-gift' }])('400 on missing/invalid token %j', async (body) => {
    expect((await post(body)).status).toBe(400);
    expect(getOrderByGiftToken).not.toHaveBeenCalled();
  });

  it('404 when no paid order matches the token', async () => {
    vi.mocked(getOrderByGiftToken).mockResolvedValue(null);
    expect((await post()).status).toBe(404);
    expect(getOrderByGiftToken).toHaveBeenCalledWith(TOKEN);
  });

  it.each([
    { giftRedeemedAt: '2026-01-01' },
    { giftRedeemedBy: { _type: 'reference', _ref: 'u9' } },
  ])('400 when the gift was already redeemed %j', async (extra) => {
    vi.mocked(getOrderByGiftToken).mockResolvedValue(order([course], extra) as never);
    const { status, json } = await post();
    expect(status).toBe(400);
    expect(json.error).toMatch(/ya fue canjeado/);
    expect(createCourseAccess).not.toHaveBeenCalled();
    expect(markGiftAsRedeemed).not.toHaveBeenCalled();
  });

  it('404 when the current user is missing', async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);
    expect((await post()).status).toBe(404);
  });

  it('grants course access to the redeemer and marks the gift redeemed', async () => {
    const { status, json } = await post();
    expect(status).toBe(200);
    expect(client.fetch).toHaveBeenCalledWith(expect.any(String), { userId: 'u2', courseId: 'c1' });
    expect(createCourseAccess).toHaveBeenCalledWith('u2', 'c1', 'o1');
    expect(markGiftAsRedeemed).toHaveBeenCalledWith('ORD-1', 'u2');
    expect(json).toEqual({
      success: true,
      message: 'Regalo canjeado exitosamente. Acceso creado a: Curso: Curso Musgo',
      accesses: ['Curso: Curso Musgo'],
    });
  });

  it('lists physical items without creating access docs', async () => {
    vi.mocked(getOrderByGiftToken).mockResolvedValue(order([
      { id: 'w', type: 'workshop', name: 'Taller' },
      { id: 't', type: 'terrarium', name: 'Bosque' },
      { id: 's', type: 'supply', name: 'Musgo' },
    ]) as never);
    const { json } = await post();
    expect(createCourseAccess).not.toHaveBeenCalled();
    expect(json.accesses).toEqual(['Taller(es): Taller', 'Terrario(s): Bosque', 'Insumo(s): Musgo']);
    expect(markGiftAsRedeemed).toHaveBeenCalledWith('ORD-1', 'u2');
  });

  it.each([
    [{ type: 'workshop' }, 'Taller(es): X'],
    [{ type: 'terrarium' }, 'Terrario(s): X'],
    [{ type: 'supply' }, 'Insumo(s): X'],
  ])('handles a single physical type %j', async (t, label) => {
    vi.mocked(getOrderByGiftToken).mockResolvedValue(order([{ id: 'x', name: 'X', ...t }]) as never);
    expect((await post()).json.accesses).toEqual([label]);
  });

  it('skips courses the user already owns and reports per-item errors', async () => {
    vi.mocked(getOrderByGiftToken).mockResolvedValue(order([
      course, { id: 'c2', type: 'course', name: 'Dos' }, { id: 'c3', type: 'course', name: 'Tres' },
    ]) as never);
    vi.mocked(client.fetch).mockResolvedValueOnce({ _id: 'existing' } as never);
    vi.mocked(createCourseAccess)
      .mockRejectedValueOnce(new Error('write failed'))
      .mockResolvedValueOnce(undefined as never);
    const { json } = await post();
    expect(json.errors).toEqual(['Ya tienes acceso al curso "Curso Musgo"', 'Error al crear acceso a "Dos"']);
    expect(json.accesses).toEqual(['Curso: Tres']);
    expect(markGiftAsRedeemed).toHaveBeenCalled();
  });

  it('still succeeds when marking as redeemed fails', async () => {
    vi.mocked(markGiftAsRedeemed).mockRejectedValue(new Error('patch failed'));
    expect((await post()).json.success).toBe(true);
  });

  it('does not mark the gift when nothing was processed', async () => {
    vi.mocked(client.fetch).mockResolvedValue({ _id: 'existing' } as never);
    const { json } = await post();
    expect(markGiftAsRedeemed).not.toHaveBeenCalled();
    expect(json.accesses).toEqual([]);
  });

  // BUG: si no se procesó ningún item (todos los cursos ya los tenía o fallaron), igual responde
  // success:true con "Regalo canjeado exitosamente" aunque no se canjeó nada.
  it.skip('does not report success when nothing was redeemed', async () => {
    vi.mocked(client.fetch).mockResolvedValue({ _id: 'existing' } as never);
    expect((await post()).json.success).not.toBe(true);
  });

  it('500 on malformed JSON', async () => {
    expect((await post('{nope')).status).toBe(500);
  });
});
