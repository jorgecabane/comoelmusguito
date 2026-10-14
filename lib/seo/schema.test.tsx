import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SITE_CONFIG } from './metadata';
import {
  ArticleSchema,
  BreadcrumbSchema,
  CourseSchema,
  EventSchema,
  FAQSchema,
  OrganizationSchema,
  ProductSchema,
  VideoSchema,
} from './schema';

const SITE = SITE_CONFIG.url;

/** Render a schema component and parse every JSON-LD script it emits. */
function jsonLd(el: ReactElement): Record<string, any>[] {
  const html = renderToStaticMarkup(el);
  const matches = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
  expect(matches.length).toBeGreaterThan(0);
  return matches.map((m) => JSON.parse(m[1]));
}

describe('JSON-LD schemas', () => {
  it('OrganizationSchema describes the brand', () => {
    const [org] = jsonLd(<OrganizationSchema />);
    expect(org).toMatchObject({ '@type': 'Organization', name: 'comoelmusguito', url: SITE, logo: `${SITE}/favicon.png` });
    expect(org.sameAs).toEqual([SITE_CONFIG.social.instagram, SITE_CONFIG.social.youtube]);
  });

  it('ProductSchema includes offer and aggregate rating from reviews', () => {
    const [product] = jsonLd(
      <ProductSchema
        name="Bosque"
        description="d"
        images={['a.jpg']}
        price={15990}
        slug="bosque"
        reviews={[
          { rating: 5, author: 'a', date: 'd', text: 't' },
          { rating: 4, author: 'b', date: 'd', text: 't' },
        ]}
      />
    );
    expect(product.offers).toMatchObject({
      url: `${SITE}/terrarios/bosque`,
      priceCurrency: 'CLP',
      price: '15990',
      availability: 'https://schema.org/InStock',
    });
    expect(product.aggregateRating).toEqual({ '@type': 'AggregateRating', ratingValue: '4.5', reviewCount: 2 });
  });

  it('ProductSchema without reviews omits rating and marks out of stock', () => {
    const [product] = jsonLd(
      <ProductSchema name="B" description="d" images={[]} price={1} currency="USD" slug="b" inStock={false} />
    );
    expect(product).not.toHaveProperty('aggregateRating');
    expect(product.offers).toMatchObject({ priceCurrency: 'USD', availability: 'https://schema.org/OutOfStock' });
  });

  it('CourseSchema emits Course and Product with matching offers', () => {
    const [course, product] = jsonLd(
      <CourseSchema name="Musgos" description="d" thumbnail="t.jpg" price={30000} duration={3} url={`${SITE}/cursos/musgos`} />
    );
    expect(course).toMatchObject({
      '@type': 'Course',
      educationalLevel: 'Beginner',
      hasCourseInstance: { courseWorkload: 'PT3H' },
      offers: { price: '30000', url: `${SITE}/cursos/musgos`, availability: 'https://schema.org/InStock' },
    });
    expect(product['@type']).toBe('Product');
    expect(product.offers.priceValidUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(product.offers.priceValidUntil).getTime()).toBeGreaterThan(Date.now());
  });

  it('CourseSchema defaults url to the site and handles out of stock', () => {
    const [course, product] = jsonLd(
      <CourseSchema name="C" description="d" thumbnail="t" price={1} duration={1} level="Advanced" inStock={false} />
    );
    expect(course.offers).toMatchObject({ url: SITE, availability: 'https://schema.org/OutOfStock' });
    expect(course.educationalLevel).toBe('Advanced');
    expect(product.offers.availability).toBe('https://schema.org/OutOfStock');
  });

  it('BreadcrumbSchema numbers items from 1', () => {
    const [crumbs] = jsonLd(
      <BreadcrumbSchema items={[{ name: 'Inicio', url: SITE }, { name: 'Terrarios', url: `${SITE}/terrarios` }]} />
    );
    expect(crumbs.itemListElement.map((i: any) => [i.position, i.name])).toEqual([[1, 'Inicio'], [2, 'Terrarios']]);
  });

  it('ArticleSchema falls back dateModified to publishedAt', () => {
    const [article] = jsonLd(<ArticleSchema title="T" excerpt="E" coverImage="c" slug="post" publishedAt="2025-01-01" />);
    expect(article).toMatchObject({
      headline: 'T',
      dateModified: '2025-01-01',
      author: { name: 'Tomás Barrera' },
      mainEntityOfPage: { '@id': `${SITE}/blog/post` },
    });
    const [edited] = jsonLd(
      <ArticleSchema title="T" excerpt="E" coverImage="c" slug="p" publishedAt="a" modifiedAt="b" authorName="Otro" />
    );
    expect(edited).toMatchObject({ dateModified: 'b', author: { name: 'Otro' } });
  });

  it('VideoSchema formats duration as ISO 8601', () => {
    const [video] = jsonLd(
      <VideoSchema title="V" description="d" thumbnail="t" url="u" embedUrl="e" uploadDate="2025-01-01" duration={90} />
    );
    expect(video).toMatchObject({ '@type': 'VideoObject', duration: 'PT90S', contentUrl: 'u', embedUrl: 'e' });
  });

  it('FAQSchema maps questions to answers', () => {
    const [faq] = jsonLd(<FAQSchema questions={[{ question: '¿Riego?', answer: 'Poco' }]} />);
    expect(faq.mainEntity).toEqual([
      { '@type': 'Question', name: '¿Riego?', acceptedAnswer: { '@type': 'Answer', text: 'Poco' } },
    ]);
  });

  it('EventSchema describes an in-person workshop', () => {
    const location = { name: 'Estudio', address: 'Santa Isabel 676', city: 'Santiago' };
    const [event] = jsonLd(
      <EventSchema name="Taller" description="d" image="i" startDate="s" endDate="e" location={location} price={25000} />
    );
    expect(event).toMatchObject({
      '@type': 'Event',
      location: { name: 'Estudio', address: { streetAddress: 'Santa Isabel 676', addressLocality: 'Santiago', addressCountry: 'CL' } },
      offers: { price: '25000', priceCurrency: 'CLP', availability: 'https://schema.org/InStock' },
    });
    const [soldOut] = jsonLd(
      <EventSchema name="T" description="d" image="i" startDate="s" endDate="e" location={location} price={1} availability="SoldOut" />
    );
    expect(soldOut.offers.availability).toBe('https://schema.org/SoldOut');
  });
});
