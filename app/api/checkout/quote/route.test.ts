import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateOrderTotals, CheckoutValidationError } from '@/lib/checkout/calculateOrderTotals';
import { POST } from './route';

vi.mock('@/lib/utils/geolocation', () => ({ getUserCurrency: vi.fn(async () => 'USD') }));
vi.mock('@/lib/sanity/fetch', () => ({}));
vi.mock('@/lib/sanity/inventory', () => ({}));
vi.mock('@/lib/sanity/utils', () => ({}));
vi.mock('@/lib/checkout/calculateOrderTotals', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/checkout/calculateOrderTotals')>()),
  calculateOrderTotals: vi.fn(),
}));

const calc = calculateOrderTotals as unknown as ReturnType<typeof vi.fn>;
const post = (body: unknown) =>
  POST(new Request('http://localhost/api/checkout/quote', { method: 'POST', body: JSON.stringify(body) }));
const items = [{ id: 'c1', type: 'course', price: 1, quantity: 1 }];

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/checkout/quote', () => {
  it('calcula sin chequear disponibilidad y devuelve total, moneda e items del servidor', async () => {
    calc.mockResolvedValue({ validatedItems: [{ id: 'c1', price: 29.99 }], total: 29.99, currency: 'USD' });
    const res = await post({ items, gateway: 'paypal' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ total: 29.99, currency: 'USD', items: [{ id: 'c1', price: 29.99 }] });
    expect(calc).toHaveBeenCalledWith({ items, gateway: 'paypal', isGift: false, userCurrency: 'USD', skipAvailabilityChecks: true });
  });

  it.each([[{ gateway: 'flow' }], [{ items: [], gateway: 'flow' }]])('400 con carrito vacío %#', async (body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(calc).not.toHaveBeenCalled();
  });

  it('propaga el status de CheckoutValidationError', async () => {
    calc.mockRejectedValue(new CheckoutValidationError(400, 'PayPal solo cursos'));
    const res = await post({ items, gateway: 'paypal', isGift: true });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'PayPal solo cursos' });
  });

  it('500 ante errores inesperados o JSON inválido', async () => {
    calc.mockRejectedValue(new Error('x'));
    expect((await post({ items, gateway: 'flow' })).status).toBe(500);
    const bad = await POST(new Request('http://localhost/q', { method: 'POST', body: '{' }));
    expect(bad.status).toBe(500);
    expect(await bad.json()).toEqual({ error: 'Error calculando total' });
  });
});
