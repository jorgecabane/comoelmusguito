import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/get-session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: vi.fn() }));
vi.mock('@/lib/sanity/fetch', () => ({ getCourseBySlug: vi.fn() }));
vi.mock('@/lib/sanity/course-access', () => ({
  hasCourseAccess: vi.fn(), getCourseAccessWithDetails: vi.fn(),
}));

import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getCourseBySlug } from '@/lib/sanity/fetch';
import { getCourseAccessWithDetails, hasCourseAccess } from '@/lib/sanity/course-access';
import { GET } from './route';

const get = async (qs = '?courseSlug=terrarios-101') => {
  const res = await GET(new NextRequest(`http://x/api/courses/check-access${qs}`));
  return { status: res.status, json: await res.json() };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue({ user: { email: 'a@b.cl' } } as never);
  vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'u1' } as never);
  vi.mocked(getCourseBySlug).mockResolvedValue({ _id: 'c1' } as never);
  vi.mocked(hasCourseAccess).mockResolvedValue(true);
  vi.mocked(getCourseAccessWithDetails).mockResolvedValue({ progress: { lastWatched: '0-2' } } as never);
});

describe('GET /api/courses/check-access', () => {
  it('400 without courseSlug', async () => {
    expect((await get('')).status).toBe(400);
  });

  it('grants access with lastWatched for an enrolled user', async () => {
    expect(await get()).toEqual({ status: 200, json: { hasAccess: true, lastWatched: '0-2' } });
    expect(getCourseBySlug).toHaveBeenCalledWith('terrarios-101');
    expect(hasCourseAccess).toHaveBeenCalledWith('u1', 'c1');
  });

  it('lastWatched is null when there is no progress yet', async () => {
    vi.mocked(getCourseAccessWithDetails).mockResolvedValue(null);
    expect((await get()).json).toEqual({ hasAccess: true, lastWatched: null });
  });

  it.each([
    ['anonymous', () => vi.mocked(getSession).mockResolvedValue(null)],
    ['session without email', () => vi.mocked(getSession).mockResolvedValue({ user: {} } as never)],
    ['unknown user', () => vi.mocked(getUserByEmail).mockResolvedValue(null)],
    ['unknown course', () => vi.mocked(getCourseBySlug).mockResolvedValue(null)],
    ['not enrolled', () => vi.mocked(hasCourseAccess).mockResolvedValue(false)],
  ])('hasAccess false when %s', async (_, setup) => {
    setup();
    expect(await get()).toEqual({ status: 200, json: { hasAccess: false } });
    expect(getCourseAccessWithDetails).not.toHaveBeenCalled();
  });

  it('500 when a helper throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(hasCourseAccess).mockRejectedValue(new Error('down'));
    expect((await get()).status).toBe(500);
  });
});
