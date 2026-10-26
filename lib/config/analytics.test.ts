import { describe, expect, it } from 'vitest';
import { getMetaPixelId } from './analytics';

describe('getMetaPixelId', () => {
  it('devuelve el ID por defecto en el dominio de producción', () => {
    expect(getMetaPixelId('https://comoelmusguito.cl', undefined)).toBe('1790926392239173');
    expect(getMetaPixelId('https://www.comoelmusguito.cl/', undefined)).toBe('1790926392239173');
  });

  it('no carga el Pixel en desarrollo, vistas previas ni E2E', () => {
    expect(getMetaPixelId('https://dev.comoelmusguito.cl', undefined)).toBeNull();
    expect(getMetaPixelId('http://localhost:3002', undefined)).toBeNull();
    expect(getMetaPixelId('http://localhost:3100', undefined)).toBeNull();
    expect(getMetaPixelId('https://comoelmusguito-git-feat-x.vercel.app', undefined)).toBeNull();
  });

  it('no carga el Pixel si el dominio falta o es inválido', () => {
    expect(getMetaPixelId(undefined, undefined)).toBeNull();
    expect(getMetaPixelId('', undefined)).toBeNull();
    expect(getMetaPixelId('no es una url', undefined)).toBeNull();
  });

  it('permite cambiar el ID o desactivarlo con NEXT_PUBLIC_META_PIXEL_ID', () => {
    expect(getMetaPixelId('https://comoelmusguito.cl', ' 999 ')).toBe('999');
    expect(getMetaPixelId('https://comoelmusguito.cl', '')).toBeNull();
  });
});
