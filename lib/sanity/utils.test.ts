import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSanityImageUrl } from '@/sanity/lib/image';
import type { SanityImage } from '@/types/sanity';

vi.mock('@/sanity/lib/image', () => ({ getSanityImageUrl: vi.fn(() => 'https://cdn/img.webp') }));

import {
  getImageUrl,
  getFirstImage,
  formatCurrency,
  formatPrice,
  formatPriceWithSale,
  getCoursePrice,
  formatDate,
  formatDateShort,
  formatDateLong,
  formatTime,
  formatWorkshopDateTime,
  formatWorkshopDateFull,
  getSlugString,
  extractPlainText,
} from './utils';

const img = { _type: 'image', asset: { _ref: 'image-abc-10x10-jpg', _type: 'reference' } } as unknown as SanityImage;
const PLACEHOLDER = '/images/placeholder.jpg';

beforeEach(() => vi.clearAllMocks());

describe('images', () => {
  it('returns the placeholder without an asset', () => {
    expect(getImageUrl(undefined)).toBe(PLACEHOLDER);
    expect(getImageUrl({} as SanityImage)).toBe(PLACEHOLDER);
    expect(getSanityImageUrl).not.toHaveBeenCalled();
  });

  it('applies default width/quality/webp', () => {
    expect(getImageUrl(img)).toBe('https://cdn/img.webp');
    expect(getSanityImageUrl).toHaveBeenCalledWith(img, { width: 800, quality: 90, format: 'webp' });
  });

  it('lets options override defaults', () => {
    getImageUrl(img, { width: 200, height: 100, quality: 50 });
    expect(getSanityImageUrl).toHaveBeenCalledWith(img, { width: 200, height: 100, quality: 50, format: 'webp' });
  });

  it('getFirstImage uses the first image or the placeholder', () => {
    expect(getFirstImage(undefined)).toBe(PLACEHOLDER);
    expect(getFirstImage([])).toBe(PLACEHOLDER);
    getFirstImage([img, {} as SanityImage], { width: 10 });
    expect(getSanityImageUrl).toHaveBeenCalledWith(img, expect.objectContaining({ width: 10 }));
  });
});

describe('prices', () => {
  it('formats CLP and USD', () => {
    expect(formatPrice(1234567)).toBe('$1.234.567 CLP');
    expect(formatPrice(1234.5, 'USD')).toBe('$1,234.50 USD');
    expect(formatCurrency(15000, 'CLP')).toBe('$15.000 CLP');
    expect(formatCurrency(9.9, 'USD')).toBe('$9.90 USD');
  });

  it('formatPriceWithSale shows the discount only when lower', () => {
    expect(formatPriceWithSale(10000, 8000)).toEqual({ current: '$8.000 CLP', original: '$10.000 CLP', hasDiscount: true });
    expect(formatPriceWithSale(10000, 12000)).toEqual({ current: '$10.000 CLP', original: undefined, hasDiscount: false });
    expect(formatPriceWithSale(10, undefined, 'USD')).toEqual({ current: '$10.00 USD', original: undefined, hasDiscount: false });
    expect(formatPriceWithSale(10000, 0).hasDiscount).toBe(false);
  });
});

describe('getCoursePrice', () => {
  const full = { priceCLP: 20000, salePriceCLP: 15000, priceUSD: 25, salePriceUSD: 20 };

  it('prefers the user currency', () => {
    expect(getCoursePrice(full, 'CLP')).toEqual({ price: 20000, salePrice: 15000, currency: 'CLP' });
    expect(getCoursePrice(full, 'USD')).toEqual({ price: 25, salePrice: 20, currency: 'USD' });
  });

  it('falls back to the legacy price field', () => {
    expect(getCoursePrice({ price: 100, salePrice: 90 }, 'CLP')).toEqual({ price: 100, salePrice: 90, currency: 'CLP' });
    expect(getCoursePrice({ price: 100, currency: 'USD' }, 'CLP')).toMatchObject({ currency: 'USD' });
    expect(getCoursePrice({ price: 100 }, 'USD')).toEqual({ price: 100, salePrice: undefined, currency: 'CLP' });
    expect(getCoursePrice({ price: 100, currency: 'USD' }, 'USD')).toMatchObject({ currency: 'USD' });
  });

  it('uses the other currency without conversion', () => {
    expect(getCoursePrice({ priceUSD: 25, salePriceUSD: 20 }, 'CLP')).toEqual({ price: 25, salePrice: 20, currency: 'USD' });
    expect(getCoursePrice({ priceCLP: 20000 }, 'USD')).toEqual({ price: 20000, salePrice: undefined, currency: 'CLP' });
  });

  it('returns 0 when no price exists', () => {
    expect(getCoursePrice({}, 'CLP')).toEqual({ price: 0, salePrice: undefined, currency: 'CLP' });
    expect(getCoursePrice({ currency: 'USD', salePrice: 5 }, 'USD')).toEqual({ price: 0, salePrice: 5, currency: 'USD' });
  });
});

describe('dates (always America/Santiago)', () => {
  it('trata una fecha sin hora como día de calendario (no el día anterior en Chile)', () => {
    expect(formatDateLong('2025-06-01')).toBe('1 de junio de 2025');
    expect(formatDateShort('2025-06-01')).toBe('1 jun 2025');
  });

  const D = '2025-05-15T19:30:00Z'; // 15:30 en Chile (UTC-4)

  it('formats each variant', () => {
    expect(formatDate(D)).toMatch(/^jueves, 15 de mayo de 2025, 03:30\sp\.\sm\.$/);
    expect(formatDateShort(D)).toBe('15 may 2025');
    expect(formatDateLong(D)).toBe('15 de mayo de 2025');
    expect(formatTime(D)).toBe('3:30 p. m.');
    expect(formatWorkshopDateTime(D)).toEqual({ date: '15 may', time: '3:30 p. m.' });
    expect(formatWorkshopDateFull(D)).toBe('15 de mayo de 2025 a las 3:30 p. m.');
  });

  it('uses Chile time even near midnight UTC', () => {
    expect(formatDateShort('2025-05-16T02:00:00Z')).toBe('15 may 2025');
  });

  it.each(['', 'not-a-date', undefined as unknown as string])('returns empty values for %j', (bad) => {
    expect(formatDate(bad)).toBe('');
    expect(formatDateShort(bad)).toBe('');
    expect(formatDateLong(bad)).toBe('');
    expect(formatTime(bad)).toBe('');
    expect(formatWorkshopDateTime(bad)).toEqual({ date: '', time: '' });
    expect(formatWorkshopDateFull(bad)).toBe('');
  });
});

describe('getSlugString', () => {
  it('handles strings, slug objects and empty values', () => {
    expect(getSlugString(undefined)).toBe('');
    expect(getSlugString('abc')).toBe('abc');
    expect(getSlugString({ _type: 'slug', current: 'xyz' } as any)).toBe('xyz');
  });
});

describe('extractPlainText', () => {
  it('joins spans of block nodes only', () => {
    const blocks = [
      { _type: 'block', children: [{ _type: 'span', text: 'Hola ' }, { _type: 'span', text: 'mundo' }, { _type: 'link', text: 'x' }] },
      { _type: 'image' },
      { _type: 'block' },
      { _type: 'block', children: [{ _type: 'span', text: 'fin' }] },
    ];
    expect(extractPlainText(blocks)).toBe('Hola mundo  fin');
  });

  it('returns empty for missing or non-array input', () => {
    expect(extractPlainText(undefined)).toBe('');
    expect(extractPlainText('x' as any)).toBe('');
  });
});
