import { useEffect } from 'react';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  hydrated: true,
  items: [] as unknown[],
  syncPrices: (() => false) as (items: unknown[]) => boolean,
}));
vi.mock('./useCartHydrated', () => ({ useCartHydrated: () => h.hydrated }));
vi.mock('./useCartStore', () => ({
  useCartStore: { getState: () => ({ items: h.items, syncPrices: h.syncPrices }) },
}));

import { useCartPriceSync } from './useCartPriceSync';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function render() {
  const resultRef = { current: undefined as boolean | undefined };
  function Probe() {
    const value = useCartPriceSync();
    useEffect(() => {
      resultRef.current = value;
    });
    return null;
  }
  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(<Probe />));
  return { resultRef, unmount: () => act(() => root.unmount()) };
}

const respond = (ok: boolean, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) }));

beforeEach(() => {
  vi.unstubAllGlobals();
  h.hydrated = true;
  h.items = [{ id: 't1', type: 'terrarium', price: 1, currency: 'CLP', quantity: 1 }];
  h.syncPrices = vi.fn(() => true);
});

describe('useCartPriceSync', () => {
  it('does nothing before hydration or with an empty cart', async () => {
    respond(true, { items: [] });
    h.hydrated = false;
    await render();
    h.hydrated = true;
    h.items = [];
    await render();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts cart items with gateway flow and reports synced prices', async () => {
    const serverItems = [{ id: 't1', type: 'terrarium', price: 2, currency: 'CLP' }];
    respond(true, { items: serverItems });
    const { resultRef } = await render();
    expect(fetch).toHaveBeenCalledWith('/api/checkout/quote', expect.objectContaining({ method: 'POST' }));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(body).toEqual({ items: h.items, gateway: 'flow' });
    expect(h.syncPrices).toHaveBeenCalledWith(serverItems);
    expect(resultRef.current).toBe(true);
  });

  it.each([
    ['non-ok response', () => respond(false, {})],
    ['response without items', () => respond(true, {})],
    ['network error', () => vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))],
  ])('keeps local prices on %s', async (_, setup) => {
    setup();
    const { resultRef } = await render();
    expect(h.syncPrices).not.toHaveBeenCalled();
    expect(resultRef.current).toBe(false);
  });

  it('aborts the request on unmount', async () => {
    respond(true, { items: [] });
    const { unmount } = await render();
    const { signal } = vi.mocked(fetch).mock.calls[0][1]!;
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
