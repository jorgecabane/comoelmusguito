import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartItem } from '@/types/cart';
import { getCourseById, getSupplyById, getTerrariumById, getWorkshopById } from '@/lib/sanity/fetch';
import { checkSupplyStock, checkTerrariumStock, checkWorkshopSpots } from '@/lib/sanity/inventory';
import { getCoursePrice } from '@/lib/sanity/utils';
import { calculateOrderTotals, CheckoutValidationError } from './calculateOrderTotals';

vi.mock('@/lib/sanity/fetch', () => ({
  getTerrariumById: vi.fn(),
  getCourseById: vi.fn(),
  getWorkshopById: vi.fn(),
  getSupplyById: vi.fn(),
}));
vi.mock('@/lib/sanity/inventory', () => ({
  checkTerrariumStock: vi.fn(),
  checkWorkshopSpots: vi.fn(),
  checkSupplyStock: vi.fn(),
}));
vi.mock('@/lib/sanity/utils', () => ({ getCoursePrice: vi.fn() }));
// Tasa fija 1 USD = 1000 CLP, con el mismo redondeo que la implementación real.
vi.mock('@/lib/utils/currency', () => ({
  convertCLPToUSD: vi.fn(async (clp: number) => Math.round((clp / 1000) * 100) / 100),
  convertUSDToCLP: vi.fn(async (usd: number) => Math.round(usd * 1000)),
}));

type Mocked<T> = ReturnType<typeof vi.fn> & T;
const m = <T>(fn: T) => fn as unknown as Mocked<T>;

const FUTURE = '2099-06-01T15:00:00.000Z';
const PAST = '2000-06-01T15:00:00.000Z';

const item = (over: Partial<CartItem>): CartItem => ({
  id: 'id-1',
  type: 'terrarium',
  name: 'Item',
  slug: 'item',
  image: '',
  price: 10000,
  currency: 'CLP',
  quantity: 1,
  inStock: true,
  ...over,
});

const run = (items: CartItem[], over: Partial<Parameters<typeof calculateOrderTotals>[0]> = {}) =>
  calculateOrderTotals({ items, gateway: 'flow', isGift: false, userCurrency: 'CLP', ...over });

async function expectValidationError(p: Promise<unknown>, match: Partial<CheckoutValidationError>) {
  const err = await p.then(() => null, (e: unknown) => e);
  expect(err).toBeInstanceOf(CheckoutValidationError);
  expect(err).toMatchObject({ status: 400, ...match });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m(getTerrariumById).mockResolvedValue({ price: 10000, currency: 'CLP', inStock: true });
  m(getSupplyById).mockResolvedValue({ price: 3000, currency: 'CLP', inStock: true });
  m(getWorkshopById).mockResolvedValue({
    price: 20000,
    currency: 'CLP',
    published: true,
    dates: [{ date: FUTURE, status: 'available' }],
  });
  m(getCourseById).mockResolvedValue({ published: true });
  m(getCoursePrice).mockReturnValue({ price: 15000, currency: 'CLP' });
  m(checkTerrariumStock).mockResolvedValue({ available: true, currentStock: 5 });
  m(checkSupplyStock).mockResolvedValue({ available: true, currentStock: 5 });
  m(checkWorkshopSpots).mockResolvedValue({ available: true, currentSpots: 5 });
});

describe('CheckoutValidationError', () => {
  it('outOfStock implica availabilityIssue', () => {
    expect(new CheckoutValidationError(400, 'x', { outOfStock: true }).availabilityIssue).toBe(true);
    expect(new CheckoutValidationError(400, 'x').availabilityIssue).toBeUndefined();
  });
});

describe('totales Flow (CLP)', () => {
  it('suma precio del servidor × cantidad para todos los tipos', async () => {
    const res = await run([
      item({ type: 'terrarium', quantity: 2 }),
      item({ type: 'supply', price: 3000, quantity: 3 }),
      item({ type: 'course', price: 15000 }),
      item({ type: 'workshop', price: 20000, selectedDate: { date: FUTURE, spotsAvailable: 5, price: 20000 } }),
    ]);
    expect(res).toMatchObject({ total: 20000 + 9000 + 15000 + 20000, currency: 'CLP' });
    expect(checkTerrariumStock).toHaveBeenCalledWith('id-1', 2);
    expect(checkSupplyStock).toHaveBeenCalledWith('id-1', 3);
    expect(checkWorkshopSpots).toHaveBeenCalledWith('id-1', FUTURE, 1);
  });

  it('convierte items en USD a CLP antes de sumar', async () => {
    m(getCoursePrice).mockReturnValue({ price: 29.99, currency: 'USD' });
    const res = await run([item({ type: 'terrarium' }), item({ type: 'course', price: 29.99, currency: 'USD', quantity: 2 })]);
    expect(res).toMatchObject({ total: 10000 + 59980, currency: 'CLP' });
  });

  it('usa salePrice del curso cuando existe', async () => {
    m(getCoursePrice).mockReturnValue({ price: 15000, salePrice: 9990, currency: 'CLP' });
    const res = await run([item({ type: 'course', price: 9990 })]);
    expect(res.total).toBe(9990);
    expect(res.validatedItems[0]).toMatchObject({ price: 9990, currency: 'CLP' });
  });

  it('acepta diferencias de precio de hasta 1 y reemplaza por el precio del servidor', async () => {
    const res = await run([item({ price: 10001 })]);
    expect(res.validatedItems[0].price).toBe(10000);
  });

  it('rechaza manipulación de precio (> 1 de diferencia)', async () => {
    await expectValidationError(run([item({ price: 100 })]), { message: expect.stringContaining('Precio inválido') });
  });

  it('rechaza total 0', async () => {
    m(getTerrariumById).mockResolvedValue({ price: 0, currency: 'CLP', inStock: true });
    await expectValidationError(run([item({ price: 0 })]), { message: 'Monto inválido' });
  });

  // BUG: ni calculateOrderTotals ni POST /api/checkout validan que quantity sea un entero
  // positivo. Con quantity negativa un item resta del total (p.ej. 2×10000 + -1×9000 = 11000
  // cobrados por dos terrarios). Ver lib/checkout/calculateOrderTotals.ts:117.
  it.skip('BUG: debería rechazar cantidades negativas o no enteras', async () => {
    m(getSupplyById).mockResolvedValue({ price: 9000, currency: 'CLP', inStock: true });
    await expectValidationError(
      run([item({ quantity: 2 }), item({ type: 'supply', price: 9000, quantity: -1 })]),
      {},
    );
  });
});

describe('totales PayPal (USD)', () => {
  it('convierte cada item CLP a USD y totaliza en USD', async () => {
    const res = await run([item({ type: 'course', price: 15000, quantity: 2 })], { gateway: 'paypal' });
    expect(res).toMatchObject({ total: 30, currency: 'USD' });
    expect(res.validatedItems[0]).toMatchObject({ price: 15, currency: 'USD' });
  });

  it('mantiene items que ya están en USD', async () => {
    m(getCoursePrice).mockReturnValue({ price: 29.99, currency: 'USD' });
    const res = await run([item({ type: 'course', price: 29.99, currency: 'USD' })], { gateway: 'paypal', userCurrency: 'USD' });
    expect(res).toMatchObject({ total: 29.99, currency: 'USD' });
  });

  it('rechaza productos físicos si no es regalo', async () => {
    await expectValidationError(run([item({ type: 'terrarium' })], { gateway: 'paypal' }), {
      message: expect.stringContaining('PayPal solo está disponible para cursos'),
    });
  });

  it('permite productos físicos si es regalo', async () => {
    const res = await run([item({ type: 'terrarium' })], { gateway: 'paypal', isGift: true });
    expect(res).toMatchObject({ total: 10, currency: 'USD' });
  });
});

describe('disponibilidad por tipo', () => {
  const tagged = (type: string) => ({ availabilityIssue: true, itemId: 'id-1', itemType: type, itemName: 'Item' });

  it.each([
    ['terrarium', getTerrariumById, 'Producto "Item" no encontrado'],
    ['course', getCourseById, 'Curso "Item" no encontrado'],
    ['workshop', getWorkshopById, 'Taller "Item" no encontrado'],
    ['supply', getSupplyById, 'Insumo "Item" no encontrado'],
  ] as const)('%s inexistente', async (type, fetcher, message) => {
    m(fetcher).mockResolvedValue(null);
    await expectValidationError(run([item({ type })]), { message, ...tagged(type) });
  });

  it.each([
    ['terrarium', getTerrariumById, { inStock: false }, 'no está disponible'],
    ['supply', getSupplyById, { inStock: false }, 'no está disponible'],
    ['course', getCourseById, { published: false }, 'no está disponible'],
    ['workshop', getWorkshopById, { published: false }, 'no está disponible'],
  ] as const)('%s no publicado / sin stock', async (type, fetcher, flags, message) => {
    m(fetcher).mockResolvedValue({ price: 1, currency: 'CLP', ...flags });
    await expectValidationError(run([item({ type, selectedDate: { date: FUTURE, spotsAvailable: 1, price: 1 } })]), {
      message: expect.stringContaining(message),
      ...tagged(type),
    });
  });

  it.each([
    ['terrarium', checkTerrariumStock],
    ['supply', checkSupplyStock],
  ] as const)('%s sin stock suficiente marca outOfStock', async (type, check) => {
    m(check).mockResolvedValue({ available: false, currentStock: 1 });
    await expectValidationError(run([item({ type, quantity: 3 })]), {
      message: expect.stringContaining('Solo quedan 1 unidades'),
      outOfStock: true,
      ...tagged(type),
    });
  });

  it('tipo desconocido', async () => {
    await expectValidationError(run([item({ type: 'gift-card' as CartItem['type'] })]), {
      message: 'Tipo de producto inválido: gift-card',
      availabilityIssue: undefined,
    });
  });
});

describe('talleres: fecha y cupos', () => {
  const workshop = (date?: string, quantity = 1) =>
    item({ type: 'workshop', price: 20000, quantity, selectedDate: date ? { date, spotsAvailable: 5, price: 20000 } : undefined });

  it('exige fecha seleccionada (incluso en quote)', async () => {
    await expectValidationError(run([workshop()], { skipAvailabilityChecks: true }), {
      message: expect.stringContaining('Debes seleccionar una fecha'),
    });
  });

  it('rechaza fecha que no pertenece al taller', async () => {
    await expectValidationError(run([workshop('2099-01-01T00:00:00.000Z')]), { message: expect.stringContaining('no es válida') });
  });

  it('acepta la misma fecha en otro formato ISO', async () => {
    await expect(run([workshop('2099-06-01T12:00:00-03:00')])).resolves.toMatchObject({ total: 20000 });
  });

  it('rechaza taller sin fechas', async () => {
    m(getWorkshopById).mockResolvedValue({ price: 20000, currency: 'CLP', published: true });
    await expectValidationError(run([workshop(FUTURE)]), { message: expect.stringContaining('no es válida') });
  });

  it('rechaza fecha cancelada', async () => {
    m(getWorkshopById).mockResolvedValue({ price: 20000, currency: 'CLP', published: true, dates: [{ date: FUTURE, status: 'cancelled' }] });
    await expectValidationError(run([workshop(FUTURE)]), { message: expect.stringContaining('está cancelada') });
  });

  it('rechaza fecha pasada', async () => {
    m(getWorkshopById).mockResolvedValue({ price: 20000, currency: 'CLP', published: true, dates: [{ date: PAST }] });
    await expectValidationError(run([workshop(PAST)]), { message: expect.stringContaining('ya pasó') });
  });

  it.each([
    [1, 'Solo queda 1 cupo.'],
    [0, 'Solo quedan 0 cupos.'],
    [2, 'Solo quedan 2 cupos.'],
  ])('sin cupos suficientes (quedan %i) usa singular/plural', async (currentSpots, suffix) => {
    m(checkWorkshopSpots).mockResolvedValue({ available: false, currentSpots });
    await expectValidationError(run([workshop(FUTURE, 3)]), { message: expect.stringContaining(suffix), outOfStock: true });
  });
});

describe('skipAvailabilityChecks (quote)', () => {
  it('ignora publicado/stock/cupos y la tolerancia de precio', async () => {
    m(getTerrariumById).mockResolvedValue({ price: 10000, currency: 'CLP', inStock: false });
    m(getCourseById).mockResolvedValue({ published: false });
    m(getWorkshopById).mockResolvedValue({ price: 20000, currency: 'CLP', published: false, dates: [] });
    m(getSupplyById).mockResolvedValue({ price: 3000, currency: 'CLP', inStock: false });

    const res = await run(
      [
        item({ type: 'terrarium', price: 1 }),
        item({ type: 'course', price: 1 }),
        item({ type: 'workshop', price: 1, selectedDate: { date: PAST, spotsAvailable: 0, price: 1 } }),
        item({ type: 'supply', price: 1 }),
      ],
      { skipAvailabilityChecks: true },
    );

    expect(res.total).toBe(10000 + 15000 + 20000 + 3000);
    expect(checkTerrariumStock).not.toHaveBeenCalled();
    expect(checkSupplyStock).not.toHaveBeenCalled();
    expect(checkWorkshopSpots).not.toHaveBeenCalled();
  });
});
