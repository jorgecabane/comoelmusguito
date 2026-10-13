import { useEffect } from 'react';
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({ persist: undefined as unknown }));
vi.mock('./useCartStore', () => ({ useCartStore: store }));

import { useCartHydrated } from './useCartHydrated';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function render() {
  const resultRef = { current: undefined as boolean | undefined };
  function Probe() {
    const value = useCartHydrated();
    useEffect(() => {
      resultRef.current = value;
    });
    return null;
  }
  const root = createRoot(document.createElement('div'));
  act(() => root.render(<Probe />));
  return { resultRef, unmount: () => act(() => root.unmount()) };
}

beforeEach(() => {
  store.persist = undefined;
});

describe('useCartHydrated', () => {
  it('is true immediately when persist is unavailable (no storage)', () => {
    expect(render().resultRef.current).toBe(true);
  });

  it('is true when the store already hydrated', () => {
    store.persist = { hasHydrated: () => true, onFinishHydration: vi.fn() };
    expect(render().resultRef.current).toBe(true);
  });

  it('waits for onFinishHydration and unsubscribes on unmount', () => {
    let finish = () => {};
    const unsubscribe = vi.fn();
    store.persist = {
      hasHydrated: () => false,
      onFinishHydration: (cb: () => void) => ((finish = cb), unsubscribe),
    };
    const { resultRef, unmount } = render();
    expect(resultRef.current).toBe(false);
    act(() => finish());
    expect(resultRef.current).toBe(true);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
