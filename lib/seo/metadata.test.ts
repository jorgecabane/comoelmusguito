import { describe, expect, it, vi } from 'vitest';
import {
  generateBlogMetadata,
  generateCourseMetadata,
  generateProductMetadata,
  generateSEOMetadata,
  SITE_CONFIG,
} from './metadata';

const SITE = SITE_CONFIG.url;

describe('generateSEOMetadata', () => {
  it('builds title, absolute image and indexable robots with defaults', () => {
    const meta = generateSEOMetadata({ title: 'Terrarios' });

    expect(meta.title).toBe('Terrarios | comoelmusguito');
    expect(meta.description).toBe(SITE_CONFIG.description);
    expect(meta.keywords).toEqual(['terrarios Chile', 'terrarios artesanales', 'comoelmusguito']);
    expect(meta.openGraph).toMatchObject({
      type: 'website',
      url: SITE,
      images: [{ url: `${SITE}/og/default.jpg`, width: 1200, height: 630, alt: 'Terrarios' }],
    });
    expect(meta.openGraph).not.toHaveProperty('publishedTime');
    expect(meta.twitter).toMatchObject({ images: [`${SITE}/og/default.jpg`] });
    expect(meta.alternates).toEqual({ canonical: SITE, languages: { 'es-CL': SITE } });
    expect(meta.robots).toMatchObject({ index: true, follow: true, googleBot: { index: true, follow: true } });
  });

  it('keeps titles that already include the brand and absolute image URLs', () => {
    const meta = generateSEOMetadata({ title: 'Inicio comoelmusguito', image: 'https://cdn.test/a.jpg' });
    expect(meta.title).toBe('Inicio comoelmusguito');
    expect(meta.twitter).toMatchObject({ images: ['https://cdn.test/a.jpg'] });
  });

  it('adds article dates and noindex when requested', () => {
    const meta = generateSEOMetadata({
      title: 'Post',
      type: 'article',
      publishedAt: '2025-01-01',
      modifiedAt: '2025-02-01',
      noIndex: true,
    });
    expect(meta.openGraph).toMatchObject({ type: 'article', publishedTime: '2025-01-01', modifiedTime: '2025-02-01' });
    expect(meta.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false, follow: false } });
  });

  it('falls back to the production domain when NEXT_PUBLIC_SITE_URL is unset', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const mod = await import('./metadata');
    expect(mod.SITE_CONFIG.url).toBe('https://comoelmusguito.cl');
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.test');
    expect((await import('./metadata')).SITE_CONFIG.url).toBe('https://staging.test');
  });
});

describe('page-specific metadata', () => {
  it('product metadata points to the terrarium page and filters empty category', () => {
    const meta = generateProductMetadata({ name: 'Bosque', description: 'd', images: ['/img/b.jpg'], price: 1, slug: 'bosque' });
    expect(meta.title).toBe('Bosque - Terrario Artesanal | comoelmusguito');
    expect(meta.alternates?.canonical).toBe(`${SITE}/terrarios/bosque`);
    expect(meta.keywords).not.toContain('');
    expect(meta.openGraph).toMatchObject({ images: [{ url: `${SITE}/img/b.jpg` }] });

    const withCategory = generateProductMetadata({ name: 'B', description: 'd', images: ['/x.jpg'], price: 1, slug: 'b', category: 'cerrado' });
    expect(withCategory.keywords).toContain('cerrado');
  });

  it('course metadata appends the learning copy and topics', () => {
    const meta = generateCourseMetadata({ name: 'Musgos', description: 'Curso.', thumbnail: '/t.jpg', slug: 'musgos', topics: ['musgo'] });
    expect(meta.title).toBe('Musgos - Curso Online | comoelmusguito');
    expect(meta.description).toBe('Curso. Aprende a crear terrarios a tu propio ritmo.');
    expect(meta.keywords).toContain('musgo');
    expect(meta.alternates?.canonical).toBe(`${SITE}/cursos/musgos`);
    expect(generateCourseMetadata({ name: 'X', description: '', thumbnail: '/t.jpg', slug: 'x' }).keywords).toContain('X');
  });

  it('blog metadata is an article with dates and tags', () => {
    const meta = generateBlogMetadata({
      title: 'Cuidar musgo',
      excerpt: 'Tips',
      coverImage: '/c.jpg',
      slug: 'cuidar-musgo',
      publishedAt: '2025-01-01',
      tags: ['riego'],
    });
    expect(meta.description).toBe('Tips');
    expect(meta.keywords).toEqual(expect.arrayContaining(['riego', 'blog terrarios']));
    expect(meta.openGraph).toMatchObject({ type: 'article', publishedTime: '2025-01-01', url: `${SITE}/blog/cuidar-musgo` });
    expect(generateBlogMetadata({ title: 't', excerpt: 'e', coverImage: '/c.jpg', slug: 's', publishedAt: 'p' }).keywords).toContain('terrarios');
  });
});
