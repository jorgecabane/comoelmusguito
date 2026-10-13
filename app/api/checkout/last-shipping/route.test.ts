import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLastShippingAddressByUserId } from '@/lib/sanity/orders';
import { GET } from './route';

vi.mock('@/lib/sanity/orders', () => ({ getLastShippingAddressByUserId: vi.fn() }));

const getLast = getLastShippingAddressByUserId as unknown as ReturnType<typeof vi.fn>;
const get = (qs: string) => GET(new NextRequest(`http://localhost/api/checkout/last-shipping${qs}`));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /api/checkout/last-shipping', () => {
  it('400 sin userId', async () => {
    const res = await get('');
    expect(res.status).toBe(400);
    expect(getLast).not.toHaveBeenCalled();
  });

  it('devuelve la última dirección del usuario', async () => {
    getLast.mockResolvedValue({ region: 'RM', comuna: 'Ñuñoa' });
    const res = await get('?userId=u1');
    expect(await res.json()).toEqual({ shippingAddress: { region: 'RM', comuna: 'Ñuñoa' } });
    expect(getLast).toHaveBeenCalledWith('u1');
  });

  it('shippingAddress null si no hay pedidos con despacho', async () => {
    getLast.mockResolvedValue(null);
    expect(await (await get('?userId=u1')).json()).toEqual({ shippingAddress: null });
  });

  it('500 si Sanity falla', async () => {
    getLast.mockRejectedValue(new Error('down'));
    expect((await get('?userId=u1')).status).toBe(500);
  });

  // BUG (seguridad): app/api/checkout/last-shipping/route.ts:13 no verifica sesión; cualquiera
  // que conozca un userId obtiene dirección, teléfono y RUT de ese usuario.
  it.todo('BUG: debería exigir que la sesión corresponda al userId solicitado');
});
