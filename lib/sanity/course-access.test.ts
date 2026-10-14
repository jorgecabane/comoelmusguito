import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => {
  const commit = vi.fn<(...a: any[]) => any>(async () => ({}));
  const set = vi.fn<(...a: any[]) => any>(() => ({ commit }));
  const patch = vi.fn<(...a: any[]) => any>(() => ({ set }));
  return { commit, set, patch, fetch: vi.fn<(...a: any[]) => any>() };
});

vi.mock('@/sanity/lib/client', () => {
  const c = { fetch: m.fetch, patch: m.patch };
  return { client: c, writeClient: c };
});

import {
  hasCourseAccess,
  getUserCourseAccesses,
  getCourseAccessWithDetails,
  calculateCourseProgress,
  getUserCoursesWithProgress,
  updateCourseProgress,
} from './course-access';

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const modules = [{ lessons: [{ order: 1 }, { order: 2 }] }, { lessons: [{ order: 1 }] }, {}];

describe('calculateCourseProgress', () => {
  it('returns a rounded percentage over all lessons', () => {
    expect(calculateCourseProgress({ modules }, ['0-0'])).toBe(33);
    expect(calculateCourseProgress({ modules }, ['0-0', '0-1', '1-0'])).toBe(100);
  });

  it('returns 0 without modules or lessons', () => {
    expect(calculateCourseProgress({})).toBe(0);
    expect(calculateCourseProgress({ modules: [] }, ['a'])).toBe(0);
    expect(calculateCourseProgress({ modules: [{}] }, ['a'])).toBe(0);
    expect(calculateCourseProgress({ modules })).toBe(0);
  });

  it('ignores lessons that no longer exist and duplicates, never exceeding 100%', () => {
    expect(calculateCourseProgress({ modules }, ['0-0', '0-1', '1-0', '3-0', '0-0'])).toBe(100);
    expect(calculateCourseProgress({ modules }, ['0-2', 'old'])).toBe(0);
  });
});

describe('hasCourseAccess', () => {
  it('is true when an access doc exists', async () => {
    m.fetch.mockResolvedValue({ _id: 'acc' });
    await expect(hasCourseAccess('u1', 'c1')).resolves.toBe(true);
    expect(m.fetch.mock.calls[0][1]).toEqual({ userId: 'u1', courseId: 'c1' });
  });

  it('is false when missing or on error (fail closed)', async () => {
    m.fetch.mockResolvedValueOnce(null);
    await expect(hasCourseAccess('u1', 'c1')).resolves.toBe(false);
    m.fetch.mockRejectedValueOnce(new Error('x'));
    await expect(hasCourseAccess('u1', 'c1')).resolves.toBe(false);
  });
});

describe('getUserCourseAccesses', () => {
  it('maps accesses with progress', async () => {
    m.fetch.mockResolvedValue([
      {
        course: { _id: 'c1', slug: 'curso', name: 'Curso', modules },
        accessGrantedAt: 'T',
        progress: { completedLessons: ['0-0', '0-1'], lastWatched: 'b', totalWatchTime: 30 },
      },
      { course: { _id: 'c2', slug: 's2', modules: [] }, accessGrantedAt: 'T2' },
    ]);
    const res = (await getUserCourseAccesses('u1')) as any[];
    expect(m.fetch.mock.calls[0][1]).toEqual({ userId: 'u1' });
    expect(res[0]).toMatchObject({
      courseId: 'c1',
      courseSlug: 'curso',
      courseName: 'Curso',
      progress: { percentage: 67, completedLessons: ['0-0', '0-1'], lastWatched: 'b', totalWatchTime: 30 },
    });
    expect(res[1].progress).toEqual({ percentage: 0, completedLessons: [], lastWatched: undefined, totalWatchTime: 0 });
  });

  it('returns the projected slug string', async () => {
    m.fetch.mockResolvedValue([{ course: { _id: 'c1', slug: 'curso', modules: [] } }]);
    const res = await getUserCourseAccesses('u1');
    expect(res[0].courseSlug).toBe('curso');
  });

  it('returns [] on error', async () => {
    m.fetch.mockRejectedValue(new Error('x'));
    await expect(getUserCourseAccesses('u1')).resolves.toEqual([]);
  });
});

describe('getCourseAccessWithDetails', () => {
  it('returns the access shape', async () => {
    m.fetch.mockResolvedValue({ _id: 'acc', course: { _id: 'c1' }, progress: { completedLessons: [] } });
    await expect(getCourseAccessWithDetails('u1', 'c1')).resolves.toEqual({
      accessId: 'acc',
      course: { _id: 'c1' },
      progress: { completedLessons: [] },
    });
  });

  it('returns null when missing or on error', async () => {
    m.fetch.mockResolvedValueOnce(null);
    await expect(getCourseAccessWithDetails('u1', 'c1')).resolves.toBeNull();
    m.fetch.mockRejectedValueOnce(new Error('x'));
    await expect(getCourseAccessWithDetails('u1', 'c1')).resolves.toBeNull();
  });
});

describe('getUserCoursesWithProgress', () => {
  it('maps courses with progress and gift info', async () => {
    m.fetch.mockResolvedValue([
      {
        course: { _id: 'c1', slug: 'curso', name: 'Curso', modules },
        order: { isGift: true, customerName: 'Ana', customerEmail: 'ana@x.cl' },
        accessGrantedAt: 'T',
        progress: { completedLessons: ['0-0', '0-1', '1-0'], totalWatchTime: 5 },
      },
      { course: { _id: 'c2', slug: 's2', modules: [] }, order: { isGift: false, customerName: 'Yo' } },
      { course: { _id: 'c3', slug: 's3' } },
    ]);
    const [gift, own, noOrder] = await getUserCoursesWithProgress('u1');
    expect(gift).toMatchObject({
      courseId: 'c1',
      courseSlug: 'curso',
      progress: { percentage: 100, totalWatchTime: 5 },
      isGift: true,
      giftSenderName: 'Ana',
      giftSenderEmail: 'ana@x.cl',
    });
    expect(own).toMatchObject({ isGift: false, giftSenderName: undefined, progress: { totalWatchTime: 0 } });
    expect(noOrder).toMatchObject({ isGift: false, giftSenderEmail: undefined });
  });

  it('returns [] on error', async () => {
    m.fetch.mockRejectedValue(new Error('x'));
    await expect(getUserCoursesWithProgress('u1')).resolves.toEqual([]);
  });
});

describe('updateCourseProgress', () => {
  it('merges with existing progress and stamps lastWatchedAt', async () => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
    m.fetch.mockResolvedValue({ _id: 'acc', progress: { completedLessons: ['a'], totalWatchTime: 10 } });
    await updateCourseProgress('u1', 'c1', { lastWatched: 'b', totalWatchTime: 20 });
    vi.useRealTimers();
    expect(m.patch).toHaveBeenCalledWith('acc');
    expect(m.set.mock.calls[0][0].progress).toEqual({
      completedLessons: ['a'],
      totalWatchTime: 20,
      lastWatched: 'b',
      lastWatchedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('keeps an explicit lastWatchedAt', async () => {
    m.fetch.mockResolvedValue({ _id: 'acc' });
    await updateCourseProgress('u1', 'c1', { lastWatched: 'b', lastWatchedAt: 'X' });
    expect(m.set.mock.calls[0][0].progress.lastWatchedAt).toBe('X');
  });

  it('does not stamp lastWatchedAt when only completing lessons', async () => {
    m.fetch.mockResolvedValue({ _id: 'acc' });
    await updateCourseProgress('u1', 'c1', { completedLessons: ['a'] });
    expect(m.set.mock.calls[0][0].progress).toEqual({ completedLessons: ['a'] });
  });

  it('throws when the access does not exist', async () => {
    m.fetch.mockResolvedValueOnce(null);
    await expect(updateCourseProgress('u1', 'c1', {})).rejects.toThrow('Acceso a curso no encontrado');
    m.fetch.mockResolvedValueOnce({});
    await expect(updateCourseProgress('u1', 'c1', {})).rejects.toThrow('Acceso a curso no encontrado');
    expect(m.patch).not.toHaveBeenCalled();
  });
});
