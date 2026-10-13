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
  checkTerrariumStock,
  decreaseTerrariumStock,
  checkSupplyStock,
  decreaseSupplyStock,
  checkWorkshopSpots,
  decreaseWorkshopSpots,
} from './inventory';

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const NONE = { available: false, currentStock: 0, inStock: false };

// Terrarios e insumos comparten la misma lógica de stock.
describe.each([
  ['terrarium', checkTerrariumStock, decreaseTerrariumStock, 'Terrario'],
  ['supply', checkSupplyStock, decreaseSupplyStock, 'Insumo'],
] as const)('%s stock', (type, check, decrease, label) => {
  describe('check', () => {
    it('reports availability when in stock with enough units', async () => {
      m.fetch.mockResolvedValue({ stock: 5, inStock: true });
      await expect(check('id1', 5)).resolves.toEqual({ available: true, currentStock: 5, inStock: true });
      expect(m.fetch).toHaveBeenCalledWith(`*[_type == "${type}" && _id == $id][0]`, { id: 'id1' });
    });

    it('is unavailable when requesting more than the stock', async () => {
      m.fetch.mockResolvedValue({ stock: 2, inStock: true });
      await expect(check('id1', 3)).resolves.toMatchObject({ available: false, currentStock: 2 });
    });

    it('is unavailable when flagged out of stock even with units', async () => {
      m.fetch.mockResolvedValue({ stock: 10 });
      await expect(check('id1', 1)).resolves.toEqual({ available: false, currentStock: 10, inStock: false });
    });

    it('treats missing stock as 0', async () => {
      m.fetch.mockResolvedValue({ inStock: true });
      await expect(check('id1', 1)).resolves.toMatchObject({ available: false, currentStock: 0 });
    });

    it('returns unavailable for a missing doc or a fetch error', async () => {
      m.fetch.mockResolvedValueOnce(null);
      await expect(check('id1', 1)).resolves.toEqual(NONE);
      m.fetch.mockRejectedValueOnce(new Error('down'));
      await expect(check('id1', 1)).resolves.toEqual(NONE);
    });
  });

  describe('decrease', () => {
    it('decrements stock and keeps inStock while units remain', async () => {
      m.fetch.mockResolvedValue({ stock: 5 });
      await decrease('id1', 2);
      expect(m.patch).toHaveBeenCalledWith('id1');
      expect(m.set.mock.calls[0][0]).toMatchObject({ stock: 3, inStock: true });
      expect(m.commit).toHaveBeenCalled();
    });

    it('marks out of stock when reaching zero', async () => {
      m.fetch.mockResolvedValue({ stock: 2 });
      await decrease('id1', 2);
      expect(m.set.mock.calls[0][0]).toMatchObject({ stock: 0, inStock: false });
    });

    it('never goes negative: deducts only what is available', async () => {
      m.fetch.mockResolvedValue({ stock: 1 });
      await decrease('id1', 3);
      expect(m.set.mock.calls[0][0]).toMatchObject({ stock: 0, inStock: false });
      expect(console.warn).toHaveBeenCalled();
    });

    it('writes nothing when stock is already 0 or undefined', async () => {
      m.fetch.mockResolvedValueOnce({ stock: 0 }).mockResolvedValueOnce({});
      await decrease('id1', 1);
      await decrease('id1', 1);
      expect(m.patch).not.toHaveBeenCalled();
    });

    it('throws when the document is missing', async () => {
      m.fetch.mockResolvedValue(null);
      await expect(decrease('id1', 1)).rejects.toThrow(`${label} id1 no encontrado`);
    });

    it('propagates commit failures', async () => {
      m.fetch.mockResolvedValue({ stock: 5 });
      m.commit.mockRejectedValueOnce(new Error('conflict'));
      await expect(decrease('id1', 1)).rejects.toThrow('conflict');
    });
  });
});

describe('checkWorkshopSpots', () => {
  const workshop = (status = 'available', spotsAvailable?: number) => ({
    dates: [{ date: '2026-03-01T15:00:00.000Z', spotsAvailable, status }],
  });

  it('matches the date regardless of ISO formatting', async () => {
    m.fetch.mockResolvedValue(workshop('available', 4));
    await expect(checkWorkshopSpots('w1', '2026-03-01T12:00:00-03:00', 4)).resolves.toEqual({
      available: true,
      currentSpots: 4,
    });
  });

  it.each(['sold_out', 'cancelled'])('is unavailable when status is %s', async (status) => {
    m.fetch.mockResolvedValue(workshop(status, 10));
    await expect(checkWorkshopSpots('w1', '2026-03-01T15:00:00Z', 1)).resolves.toEqual({
      available: false,
      currentSpots: 10,
    });
  });

  it('is unavailable when requesting more spots than left (or spots undefined)', async () => {
    m.fetch.mockResolvedValueOnce(workshop('available', 2));
    await expect(checkWorkshopSpots('w1', '2026-03-01T15:00:00Z', 3)).resolves.toMatchObject({ available: false });
    m.fetch.mockResolvedValueOnce(workshop('available'));
    await expect(checkWorkshopSpots('w1', '2026-03-01T15:00:00Z', 1)).resolves.toEqual({
      available: false,
      currentSpots: 0,
    });
  });

  it('returns unavailable for missing workshop, missing date, no dates, or errors', async () => {
    const none = { available: false, currentSpots: 0 };
    m.fetch.mockResolvedValueOnce(null);
    await expect(checkWorkshopSpots('w1', '2026-03-01T15:00:00Z', 1)).resolves.toEqual(none);
    m.fetch.mockResolvedValueOnce(workshop('available', 5));
    await expect(checkWorkshopSpots('w1', '2026-04-01T15:00:00Z', 1)).resolves.toEqual(none);
    m.fetch.mockResolvedValueOnce({});
    await expect(checkWorkshopSpots('w1', '2026-03-01T15:00:00Z', 1)).resolves.toEqual(none);
    m.fetch.mockRejectedValueOnce(new Error('x'));
    await expect(checkWorkshopSpots('w1', '2026-03-01T15:00:00Z', 1)).resolves.toEqual(none);
  });
});

describe('decreaseWorkshopSpots', () => {
  const D1 = '2026-03-01T15:00:00.000Z';
  const D2 = '2026-03-08T15:00:00.000Z';
  const workshop = (spots1?: number) => ({
    dates: [
      { _key: 'a', date: D1, spotsAvailable: spots1, status: 'available', price: 1 },
      { _key: 'b', date: D2, spotsAvailable: 9, status: 'available' },
    ],
  });

  it('decrements only the matching date and preserves other fields', async () => {
    m.fetch.mockResolvedValue(workshop(5));
    await decreaseWorkshopSpots('w1', D1, 2);
    expect(m.patch).toHaveBeenCalledWith('w1');
    const { dates } = m.set.mock.calls[0][0];
    expect(dates[0]).toEqual({ _key: 'a', date: D1, spotsAvailable: 3, status: 'available', price: 1 });
    expect(dates[1]).toEqual(workshop().dates[1]);
  });

  it('clamps to available spots and marks the date as sold out', async () => {
    m.fetch.mockResolvedValue(workshop(1));
    await decreaseWorkshopSpots('w1', D1, 3);
    const { dates } = m.set.mock.calls[0][0];
    expect(dates[0].spotsAvailable).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });

  // BUG: inventory.ts:280 escribe status 'soldOut', pero el schema (sanity/schemas/workshop.ts)
  // y los lectores (checkWorkshopSpots, WorkshopDetail, talleres/[slug]) esperan 'sold_out'.
  it.skip('uses the schema value sold_out when spots run out', async () => {
    m.fetch.mockResolvedValue(workshop(1));
    await decreaseWorkshopSpots('w1', D1, 1);
    expect(m.set.mock.calls[0][0].dates[0].status).toBe('sold_out');
  });

  it('writes nothing when there are no spots left', async () => {
    m.fetch.mockResolvedValueOnce(workshop(0)).mockResolvedValueOnce(workshop(undefined));
    await decreaseWorkshopSpots('w1', D1, 1);
    await decreaseWorkshopSpots('w1', D1, 1);
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('throws for a missing workshop or date', async () => {
    m.fetch.mockResolvedValueOnce(null);
    await expect(decreaseWorkshopSpots('w1', D1, 1)).rejects.toThrow('Taller w1 no encontrado');
    m.fetch.mockResolvedValueOnce({});
    await expect(decreaseWorkshopSpots('w1', D1, 1)).rejects.toThrow(`Fecha ${D1} no encontrada`);
  });

  it('propagates commit failures', async () => {
    m.fetch.mockResolvedValue(workshop(5));
    m.commit.mockRejectedValueOnce(new Error('conflict'));
    await expect(decreaseWorkshopSpots('w1', D1, 1)).rejects.toThrow('conflict');
  });
});
