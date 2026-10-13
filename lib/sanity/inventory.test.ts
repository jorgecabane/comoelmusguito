import { describe, it, expect, vi, beforeEach } from 'vitest';

// Builder encadenable de patches de Sanity: cada operación queda registrada.
const m = vi.hoisted(() => {
  const fn = vi.fn<(...a: any[]) => any>;
  const b = { set: fn(() => b), setIfMissing: fn(() => b), dec: fn(() => b), inc: fn(() => b), commit: fn(async () => ({})) };
  return { ...b, patch: fn(() => b), fetch: fn() };
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
    it('decrements atomically with dec, without reading first', async () => {
      m.commit.mockResolvedValueOnce({ stock: 3 });
      await decrease('id1', 2);
      expect(m.fetch).not.toHaveBeenCalled();
      expect(m.patch).toHaveBeenCalledWith('id1');
      expect(m.setIfMissing).toHaveBeenCalledWith({ stock: 0 });
      expect(m.dec).toHaveBeenCalledWith({ stock: 2 });
      expect(m.commit).toHaveBeenCalledTimes(1);
      expect(m.inc).not.toHaveBeenCalled();
    });

    it('marks out of stock when reaching zero', async () => {
      m.commit.mockResolvedValueOnce({ stock: 0 });
      await decrease('id1', 2);
      expect(m.inc).toHaveBeenCalledWith({ stock: -0 });
      expect(m.set).toHaveBeenLastCalledWith({ inStock: false });
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('never stays negative: returns the excess atomically', async () => {
      m.commit.mockResolvedValueOnce({ stock: -2 });
      await decrease('id1', 3);
      expect(m.inc).toHaveBeenCalledWith({ stock: 2 });
      expect(m.set).toHaveBeenLastCalledWith({ inStock: false });
      expect(console.warn).toHaveBeenCalled();
    });

    it('two concurrent decrements both apply (no lost update)', async () => {
      let stock = 5;
      m.dec.mockImplementation(({ stock: q }: { stock: number }) => {
        stock -= q;
        return m.patch();
      });
      m.commit.mockImplementation(async () => ({ stock }));
      await Promise.all([decrease('id1', 1), decrease('id1', 1)]);
      expect(stock).toBe(3);
    });

    it(`propagates errors (e.g. ${label} missing)`, async () => {
      m.commit.mockRejectedValueOnce(new Error('not found'));
      await expect(decrease('id1', 1)).rejects.toThrow('not found');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining(type === 'terrarium' ? 'terrario' : 'insumo'), expect.any(Error));
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
  const workshop = () => ({
    dates: [
      { _key: 'a', date: D1, spotsAvailable: 5, status: 'available' },
      { _key: 'b', date: D2, spotsAvailable: 9, status: 'available' },
    ],
  });
  const after = (spots: number) => ({ dates: [{ _key: 'a', spotsAvailable: spots }, { _key: 'b', spotsAvailable: 9 }] });
  const SPOTS = 'dates[_key=="a"].spotsAvailable';

  it('decrements only the matching date atomically by _key', async () => {
    m.fetch.mockResolvedValue(workshop());
    m.commit.mockResolvedValueOnce(after(3));
    await decreaseWorkshopSpots('w1', '2026-03-01T12:00:00-03:00', 2);
    expect(m.patch).toHaveBeenCalledWith('w1');
    expect(m.setIfMissing).toHaveBeenCalledWith({ [SPOTS]: 0 });
    expect(m.dec).toHaveBeenCalledWith({ [SPOTS]: 2 });
    expect(m.commit).toHaveBeenCalledTimes(1);
  });

  it('marks the date sold out at zero', async () => {
    m.fetch.mockResolvedValue(workshop());
    m.commit.mockResolvedValueOnce(after(0));
    await decreaseWorkshopSpots('w1', D1, 5);
    expect(m.set).toHaveBeenLastCalledWith({ 'dates[_key=="a"].status': 'sold_out' });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('clamps to zero when overbooked', async () => {
    m.fetch.mockResolvedValue(workshop());
    m.commit.mockResolvedValueOnce(after(-2));
    await decreaseWorkshopSpots('w1', D1, 7);
    expect(m.inc).toHaveBeenCalledWith({ [SPOTS]: 2 });
    expect(console.warn).toHaveBeenCalled();
  });

  it('treats a date missing from the result as zero spots', async () => {
    m.fetch.mockResolvedValue(workshop());
    m.commit.mockResolvedValueOnce({ dates: [] });
    await decreaseWorkshopSpots('w1', D1, 1);
    expect(m.inc).toHaveBeenCalledWith({ [SPOTS]: -0 });
  });

  it('uses the schema value sold_out when spots run out', async () => {
    m.fetch.mockResolvedValue(workshop());
    m.commit.mockResolvedValueOnce(after(0));
    await decreaseWorkshopSpots('w1', D1, 5);
    expect(m.set).toHaveBeenLastCalledWith({ 'dates[_key=="a"].status': 'sold_out' });
  });

  it('throws for a missing workshop or date', async () => {
    m.fetch.mockResolvedValueOnce(null);
    await expect(decreaseWorkshopSpots('w1', D1, 1)).rejects.toThrow('Taller w1 no encontrado');
    m.fetch.mockResolvedValueOnce({});
    await expect(decreaseWorkshopSpots('w1', D1, 1)).rejects.toThrow(`Fecha ${D1} no encontrada`);
    expect(m.patch).not.toHaveBeenCalled();
  });

  it('propagates commit failures', async () => {
    m.fetch.mockResolvedValue(workshop());
    m.commit.mockRejectedValueOnce(new Error('conflict'));
    await expect(decreaseWorkshopSpots('w1', D1, 1)).rejects.toThrow('conflict');
  });
});
