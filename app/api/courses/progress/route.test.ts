import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/get-session', () => ({ getSession: vi.fn() }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: vi.fn() }));
vi.mock('@/lib/sanity/course-access', () => ({
  updateCourseProgress: vi.fn(), getCourseAccessWithDetails: vi.fn(),
}));

import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { getCourseAccessWithDetails, updateCourseProgress } from '@/lib/sanity/course-access';
import { POST } from './route';

const post = async (body: unknown) => {
  const res = await POST(new NextRequest('http://x/api/courses/progress', {
    method: 'POST', body: JSON.stringify(body),
  }));
  return { status: res.status, json: await res.json() };
};

const access = (progress?: object) => ({
  course: { modules: [{ lessons: [{ duration: 10 }, { duration: 7 }] }, {}] },
  progress,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: new Date('2026-10-13T12:00:00Z'), toFake: ['Date'] });
  vi.mocked(getSession).mockResolvedValue({ user: { email: 'a@b.cl' } } as never);
  vi.mocked(getUserByEmail).mockResolvedValue({ _id: 'u1' } as never);
  vi.mocked(getCourseAccessWithDetails).mockResolvedValue(
    access({ completedLessons: ['0-0'], totalWatchTime: 100 }) as never,
  );
  return () => vi.useRealTimers();
});

describe('POST /api/courses/progress', () => {
  it('401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await post({ courseId: 'c1', lessonId: '0-1' })).status).toBe(401);
    expect(updateCourseProgress).not.toHaveBeenCalled();
  });

  it('404 when user does not exist', async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);
    expect((await post({ courseId: 'c1', lessonId: '0-1' })).status).toBe(404);
  });

  it.each([{ courseId: 'c1' }, { lessonId: '0-1' }])('400 when ids missing: %j', async (body) => {
    expect((await post(body)).status).toBe(400);
  });

  it('403 when the user has no access to the course', async () => {
    vi.mocked(getCourseAccessWithDetails).mockResolvedValue(null);
    expect((await post({ courseId: 'c1', lessonId: '0-1' })).status).toBe(403);
    expect(getCourseAccessWithDetails).toHaveBeenCalledWith('u1', 'c1');
  });

  it.each(['01', '0-1-2'])('400 on malformed lessonId %j', async (lessonId) => {
    expect((await post({ courseId: 'c1', lessonId })).status).toBe(400);
  });

  it('marks a new lesson complete and adds its duration + watch time', async () => {
    const { status, json } = await post({ courseId: 'c1', lessonId: '0-1', totalWatchTime: 3 });
    expect(status).toBe(200);
    expect(json).toEqual({ success: true, progress: { completedLessons: ['0-0', '0-1'], lastWatched: '0-1' } });
    expect(updateCourseProgress).toHaveBeenCalledWith('u1', 'c1', {
      completedLessons: ['0-0', '0-1'],
      lastWatched: '0-1',
      lastWatchedAt: '2026-10-13T12:00:00.000Z',
      totalWatchTime: 100 + 3 + 7,
    });
  });

  it('does not double-count an already completed lesson and honors lastWatched', async () => {
    await post({ courseId: 'c1', lessonId: '0-0', lastWatched: '0-1' });
    expect(updateCourseProgress).toHaveBeenCalledWith('u1', 'c1', expect.objectContaining({
      completedLessons: ['0-0'], lastWatched: '0-1', totalWatchTime: 100,
    }));
  });

  it('handles first progress and lessons without duration', async () => {
    vi.mocked(getCourseAccessWithDetails).mockResolvedValue(access() as never);
    await post({ courseId: 'c1', lessonId: '1-0' });
    expect(updateCourseProgress).toHaveBeenCalledWith('u1', 'c1', expect.objectContaining({
      completedLessons: ['1-0'], totalWatchTime: 0,
    }));
    vi.mocked(getCourseAccessWithDetails).mockResolvedValue({ progress: null } as never);
    await post({ courseId: 'c1', lessonId: '9-9' });
    expect(vi.mocked(updateCourseProgress).mock.calls[1][2].totalWatchTime).toBe(0);
  });

  it('500 with the error message when the update fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(updateCourseProgress).mockRejectedValue(new Error('patch failed'));
    expect(await post({ courseId: 'c1', lessonId: '0-1' })).toEqual({
      status: 500, json: { error: 'patch failed' },
    });
    vi.mocked(updateCourseProgress).mockRejectedValue('weird');
    expect((await post({ courseId: 'c1', lessonId: '0-1' })).json.error).toBe('Error actualizando progreso');
  });
});
