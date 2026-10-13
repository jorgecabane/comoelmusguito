import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getLastShippingAddressByUserId } from '@/lib/sanity/orders';
import { GET } from './route';

vi.mock('@/lib/sanity/orders', () => ({ getLastShippingAddressByUserId: vi.fn() }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: vi.fn() }));

const getLast = getLastShippingAddressByUserId as unknown as ReturnType<typeof vi.fn>;
const session = getSession as unknown as ReturnType<typeof vi.fn>;
const userByEmail = getUserByEmail as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  session.mockResolvedValue({ user: { email: 'ana@x.cl' } });
  userByEmail.mockResolvedValue({ _id: 'u1' });
});

describe('GET /api/checkout/last-shipping', () => {
  it('401 sin sesión y no consulta direcciones', async () => {
    session.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect(getLast).not.toHaveBeenCalled();
  });

  it('usa el usuario de la sesión, no un userId del cliente', async () => {
    getLast.mockResolvedValue({ region: 'RM', comuna: 'Ñuñoa' });
    const res = await GET();
    expect(await res.json()).toEqual({ shippingAddress: { region: 'RM', comuna: 'Ñuñoa' } });
    expect(userByEmail).toHaveBeenCalledWith('ana@x.cl');
    expect(getLast).toHaveBeenCalledWith('u1');
  });

  it('shippingAddress null si el usuario no existe en Sanity', async () => {
    userByEmail.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ shippingAddress: null });
    expect(getLast).not.toHaveBeenCalled();
  });

  it('shippingAddress null si no hay pedidos con despacho', async () => {
    getLast.mockResolvedValue(null);
    expect(await (await GET()).json()).toEqual({ shippingAddress: null });
  });

  it('500 si Sanity falla', async () => {
    getLast.mockRejectedValue(new Error('down'));
    expect((await GET()).status).toBe(500);
  });
});
