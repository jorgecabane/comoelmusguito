import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as q from '@/sanity/lib/queries';

const fetchMock = vi.hoisted(() => vi.fn<(...a: any[]) => any>());
vi.mock('@/sanity/lib/client', () => ({ client: { fetch: fetchMock } }));

import * as f from './fetch';

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('list fetchers', () => {
  it.each([
    ['getAllTerrariums', f.getAllTerrariums, q.terrariumsQuery],
    ['getAllCourses', f.getAllCourses, q.coursesQuery],
    ['getFeaturedCourses', f.getFeaturedCourses, q.featuredCoursesQuery],
    ['getAllWorkshops', f.getAllWorkshops, q.workshopsQuery],
    ['getFeaturedWorkshops', f.getFeaturedWorkshops, q.featuredWorkshopsQuery],
    ['getAllSupplies', f.getAllSupplies, q.suppliesQuery],
    ['getAllBlogPosts', f.getAllBlogPosts, q.blogPostsQuery],
  ] as const)('%s returns data and [] on error', async (_n, fn, query) => {
    fetchMock.mockResolvedValueOnce([{ _id: '1' }]);
    await expect(fn()).resolves.toEqual([{ _id: '1' }]);
    expect(fetchMock).toHaveBeenCalledWith(query);
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(fn()).resolves.toEqual([]);
  });

  it('getSuppliesByCategory passes the category', async () => {
    fetchMock.mockResolvedValueOnce([{ _id: 's' }]);
    await expect(f.getSuppliesByCategory('kit' as any)).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(q.suppliesByCategoryQuery, { category: 'kit' });
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(f.getSuppliesByCategory('kit' as any)).resolves.toEqual([]);
  });

  it('getFeaturedBlogPosts embeds the limit (default 3)', async () => {
    fetchMock.mockResolvedValue([]);
    await f.getFeaturedBlogPosts();
    expect(fetchMock.mock.calls[0][0]).toContain('[0...3]');
    await f.getFeaturedBlogPosts(6);
    expect(fetchMock.mock.calls[1][0]).toContain('[0...6]');
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(f.getFeaturedBlogPosts()).resolves.toEqual([]);
  });

  it('getAllFeaturedContent falls back to empty sections', async () => {
    fetchMock.mockResolvedValueOnce({ terrarios: [1], cursos: [2] });
    await expect(f.getAllFeaturedContent()).resolves.toEqual({ terrarios: [1], cursos: [2] });
    expect(fetchMock).toHaveBeenCalledWith(q.allFeaturedQuery);
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(f.getAllFeaturedContent()).resolves.toEqual({ terrarios: [], cursos: [] });
  });
});

describe.each([
  ['terrariums', f.getFeaturedTerrariums, q.featuredTerrariumsQuery, '"terrarium"'],
  ['supplies', f.getFeaturedSupplies, q.featuredSuppliesQuery, '"supply"'],
] as const)('featured %s with fallback', (_n, fn, featuredQuery, typeLiteral) => {
  it('returns featured items when there are any', async () => {
    fetchMock.mockResolvedValueOnce([{ _id: 'f' }]);
    await expect(fn()).resolves.toEqual([{ _id: 'f' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(featuredQuery);
  });

  it('falls back to in-stock items when none are featured', async () => {
    fetchMock.mockResolvedValueOnce([]).mockResolvedValueOnce([{ _id: 'x' }]);
    await expect(fn()).resolves.toEqual([{ _id: 'x' }]);
    const fallback = fetchMock.mock.calls[1][0] as string;
    expect(fallback).toContain(`_type == ${typeLiteral} && inStock == true`);
    expect(fallback).toContain('[0...6]');
  });

  it('returns [] when featured is null and fallback is null, or on error', async () => {
    fetchMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    await expect(fn()).resolves.toEqual([]);
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(fn()).resolves.toEqual([]);
  });
});

describe.each([
  ['getTerrariumBySlug', f.getTerrariumBySlug, q.terrariumBySlugQuery, 'slug'],
  ['getCourseBySlug', f.getCourseBySlug, q.courseBySlugQuery, 'slug'],
  ['getWorkshopBySlug', f.getWorkshopBySlug, q.workshopBySlugQuery, 'slug'],
  ['getSupplyBySlug', f.getSupplyBySlug, q.supplyBySlugQuery, 'slug'],
  ['getBlogPostBySlug', f.getBlogPostBySlug, q.blogPostBySlugQuery, 'slug'],
  ['getTerrariumById', f.getTerrariumById, q.terrariumByIdQuery, 'id'],
  ['getCourseById', f.getCourseById, q.courseByIdQuery, 'id'],
  ['getWorkshopById', f.getWorkshopById, q.workshopByIdQuery, 'id'],
  ['getSupplyById', f.getSupplyById, q.supplyByIdQuery, 'id'],
] as const)('%s', (_n, fn, query, param) => {
  it('fetches by param', async () => {
    fetchMock.mockResolvedValueOnce({ _id: 'doc' });
    await expect(fn('abc')).resolves.toEqual({ _id: 'doc' });
    expect(fetchMock).toHaveBeenCalledWith(query, { [param]: 'abc' });
  });

  it('returns null without hitting Sanity for an empty key', async () => {
    await expect(fn('')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns null on error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('down'));
    await expect(fn('abc')).resolves.toBeNull();
  });
});

it('exports a 60s revalidate window', () => {
  expect(f.revalidate).toBe(60);
});
