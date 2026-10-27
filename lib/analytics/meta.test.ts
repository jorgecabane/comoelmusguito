import { afterEach, describe, expect, it, vi } from 'vitest';
import { paramsFromCartItem, trackMeta } from './meta';
import type { CartItem } from '@/types/cart';

const item: CartItem = {
  id: 'p1', type: 'terrarium', name: 'Terrario', slug: 't', image: '', price: 15990, currency: 'CLP', quantity: 2, inStock: true,
};

afterEach(() => vi.unstubAllGlobals());

describe('trackMeta', () => {
  it('no hace nada ni lanza si el Pixel no está cargado (sin window o sin fbq)', () => {
    expect(() => trackMeta('AddToCart', {})).not.toThrow();
    vi.stubGlobal('window', {});
    expect(() => trackMeta('AddToCart', {})).not.toThrow();
  });

  it('llama a fbq con el evento y los parámetros', () => {
    const fbq = vi.fn();
    vi.stubGlobal('window', { fbq });
    trackMeta('ViewContent', { value: 1, currency: 'CLP' });
    expect(fbq).toHaveBeenCalledWith('track', 'ViewContent', { value: 1, currency: 'CLP' });
  });

  it('pasa el eventID cuando se entrega (deduplicación con la API de servidor)', () => {
    const fbq = vi.fn();
    vi.stubGlobal('window', { fbq });
    trackMeta('Purchase', { value: 5 }, 'ORD-1');
    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', { value: 5 }, { eventID: 'ORD-1' });
  });
});

describe('trackMeta antes de que cargue el Pixel', () => {
  const load = async (pixelId: string) => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', pixelId);
    return import('./meta');
  };

  it('con el Pixel habilitado guarda el evento para que MetaPixel lo envíe al cargar', async () => {
    const win: Window = {} as Window;
    vi.stubGlobal('window', win);
    const { trackMeta: track } = await load('123');
    track('ViewContent', { value: 1 });
    track('Purchase', { value: 2 }, 'ORD-1');
    expect(win.__metaPending).toEqual([
      ['track', 'ViewContent', { value: 1 }],
      ['track', 'Purchase', { value: 2 }, { eventID: 'ORD-1' }],
    ]);
  });

  it('sin Pixel habilitado (dev, vistas previas, CI) no guarda nada', async () => {
    const win: Window = {} as Window;
    vi.stubGlobal('window', win);
    const { trackMeta: track } = await load('');
    track('ViewContent', { value: 1 });
    expect(win.__metaPending).toBeUndefined();
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
