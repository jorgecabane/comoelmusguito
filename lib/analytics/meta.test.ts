import { afterEach, describe, expect, it, vi } from 'vitest';
import { paramsFromCartItem, trackMeta } from './meta';
import type { CartItem } from '@/types/cart';

const item: CartItem = {
  id: 'p1', type: 'terrarium', name: 'Terrario', slug: 't', image: '', price: 15990, currency: 'CLP', quantity: 2, inStock: true,
};

const GRANTED = { cookie: 'a=1; cem_consent=ads' };
const win = (extra: Record<string, unknown> = {}) => {
  vi.stubGlobal('document', GRANTED);
  return { ...extra } as unknown as Window;
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('trackMeta', () => {
  it('no hace nada ni lanza si el Pixel no está cargado (sin window o sin fbq)', () => {
    expect(() => trackMeta('AddToCart', {})).not.toThrow();
    vi.stubGlobal('window', win());
    expect(() => trackMeta('AddToCart', {})).not.toThrow();
  });

  it('llama a fbq con el evento y los parámetros', () => {
    const fbq = vi.fn();
    vi.stubGlobal('window', win({ fbq }));
    trackMeta('ViewContent', { value: 1, currency: 'CLP' });
    expect(fbq).toHaveBeenCalledWith('track', 'ViewContent', { value: 1, currency: 'CLP' });
  });

  it('pasa el eventID cuando se entrega (deduplicación con la API de servidor)', () => {
    const fbq = vi.fn();
    vi.stubGlobal('window', win({ fbq }));
    trackMeta('Purchase', { value: 5 }, 'ORD-1');
    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', { value: 5 }, { eventID: 'ORD-1' });
  });
});

describe('trackMeta sin consentimiento', () => {
  it.each([['sin elección', ''], ['rechazó', 'cem_consent=none']])('%s: no llama a fbq ni encola', async (_n, cookie) => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '123');
    const fbq = vi.fn();
    const w = { fbq } as unknown as Window;
    vi.stubGlobal('window', w);
    vi.stubGlobal('document', { cookie });
    const { trackMeta: track } = await import('./meta');
    track('AddToCart', { value: 1 });
    expect(fbq).not.toHaveBeenCalled();
    expect(w.__metaPending).toBeUndefined();
  });
});

describe('trackMeta antes de que cargue el Pixel', () => {
  const load = async (pixelId: string) => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', pixelId);
    return import('./meta');
  };

  it('con el Pixel habilitado guarda el evento para que MetaPixel lo envíe al cargar', async () => {
    const w = win();
    vi.stubGlobal('window', w);
    const { trackMeta: track } = await load('123');
    track('ViewContent', { value: 1 });
    track('Purchase', { value: 2 }, 'ORD-1');
    expect(w.__metaPending).toEqual([
      ['track', 'ViewContent', { value: 1 }],
      ['track', 'Purchase', { value: 2 }, { eventID: 'ORD-1' }],
    ]);
  });

  it('sin Pixel habilitado (dev, vistas previas, CI) no guarda nada', async () => {
    const w = win();
    vi.stubGlobal('window', w);
    const { trackMeta: track } = await load('');
    track('ViewContent', { value: 1 });
    expect(w.__metaPending).toBeUndefined();
  });
});

describe('paramsFromCartItem', () => {
  it('arma los parámetros de un producto con su cantidad', () => {
    expect(paramsFromCartItem(item)).toEqual({
      content_ids: ['p1'],
      content_type: 'product',
      content_name: 'Terrario',
      contents: [{ id: 'p1', quantity: 2, item_price: 15990 }],
      num_items: 2,
      value: 31980,
      currency: 'CLP',
    });
    expect(paramsFromCartItem(item, 1).value).toBe(15990);
  });
});
