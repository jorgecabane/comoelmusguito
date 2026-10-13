import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession } from '@/lib/auth/get-session';
import { getOrderByOrderId } from '@/lib/sanity/orders';
import { GET } from './route';

vi.mock('@/lib/sanity/orders', () => ({ getOrderByOrderId: vi.fn() }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: vi.fn() }));

const getOrder = getOrderByOrderId as unknown as ReturnType<typeof vi.fn>;
const session = getSession as unknown as ReturnType<typeof vi.fn>;
const get = (qs = '') => GET(new NextRequest(`http://localhost/api/checkout/order-details${qs}`));

const fullOrder = {
  customerEmail: 'a@b.cl',
  customerName: 'Ana',
  items: [{ id: 'i', name: 'Curso', type: 'course', quantity: 1, price: 100, currency: 'CLP', slug: 'curso', snapshot: { x: 1 } }],
  isGift: true,
  recipientEmail: 'r@x.cl',
  recipientName: 'Rosa',
  giftMessage: 'hola',
  requiresShipping: true,
  shippingAddress: { region: 'RM', phone: '+569', rut: '1-9' },
};
const publicFields = {
  success: true,
  items: [{ name: 'Curso', type: 'course', quantity: 1, price: 100, currency: 'CLP', slug: 'curso' }],
  isGift: true,
  requiresShipping: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  session.mockResolvedValue(null);
});

describe('GET /api/checkout/order-details', () => {
  it('400 sin orderId', async () => {
    expect((await get()).status).toBe(400);
  });

  it('404 si no existe', async () => {
    getOrder.mockResolvedValue(null);
    expect((await get('?orderId=X')).status).toBe(404);
  });

  it('sin sesión (invitado) devuelve solo items y flags, sin datos personales', async () => {
    getOrder.mockResolvedValue(fullOrder);
    const body = await (await get('?orderId=ORD-1')).json();
    expect(getOrder).toHaveBeenCalledWith('ORD-1');
    expect(body).toEqual(publicFields);
  });

  it('con sesión de otro usuario tampoco expone datos personales', async () => {
    session.mockResolvedValue({ user: { id: 'u2', email: 'otro@x.cl' } });
    getOrder.mockResolvedValue({ ...fullOrder, userId: { _ref: 'u1' } });
    expect(await (await get('?orderId=ORD-1')).json()).toEqual(publicFields);
  });

  it('el dueño ve los datos completos', async () => {
    session.mockResolvedValue({ user: { email: 'a@b.cl' } });
    getOrder.mockResolvedValue(fullOrder);
    expect(await (await get('?orderId=ORD-1')).json()).toEqual({
      ...publicFields,
      customerEmail: 'a@b.cl',
      customerName: 'Ana',
      recipientEmail: 'r@x.cl',
      recipientName: 'Rosa',
      giftMessage: 'hola',
      shippingAddress: { region: 'RM', phone: '+569', rut: '1-9' },
    });
  });

  it('defaults de regalo/despacho en false', async () => {
    getOrder.mockResolvedValue({ customerEmail: 'a@b.cl', items: [] });
    expect(await (await get('?orderId=O')).json()).toEqual({ success: true, items: [], isGift: false, requiresShipping: false });
  });

  it('500 genérico sin exponer el error interno', async () => {
    getOrder.mockRejectedValue(new Error('secret db detail'));
    const res = await get('?orderId=O');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Error al obtener detalles de la orden' });
  });
});
