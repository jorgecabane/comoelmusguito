import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({ getSession: vi.fn(), getUserByEmail: vi.fn() }));
vi.mock('@/lib/auth/get-session', () => ({ getSession: m.getSession }));
vi.mock('@/lib/auth/sanity-adapter', () => ({ getUserByEmail: m.getUserByEmail }));

import { GET } from './route';

const get = (qs = '') => GET(new NextRequest(`http://localhost/api/auth/user-id${qs}`));

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  m.getSession.mockReset().mockResolvedValue({ user: { email: 'a@x.cl' } });
  m.getUserByEmail.mockReset();
});

describe('GET /api/auth/user-id', () => {
  it.each([[null], [{}], [{ user: {} }]])('returns 401 without an authenticated session %#', async (session) => {
    m.getSession.mockResolvedValue(session);
    expect((await get('?email=a@x.cl')).status).toBe(401);
  });

  it('returns 400 without email', async () => {
    expect((await get()).status).toBe(400);
  });

  it('returns 403 when asking for another user', async () => {
    expect((await get('?email=other@x.cl')).status).toBe(403);
    expect(m.getUserByEmail).not.toHaveBeenCalled();
  });

  it('returns 404 when the user is missing', async () => {
    m.getUserByEmail.mockResolvedValue(null);
    expect((await get('?email=a@x.cl')).status).toBe(404);
  });

  it('returns the userId for the session owner', async () => {
    m.getUserByEmail.mockResolvedValue({ _id: 'u1', email: 'a@x.cl', passwordHash: 'h' });
    const res = await get('?email=a@x.cl');
    expect(await res.json()).toEqual({ userId: 'u1', email: 'a@x.cl' });
  });

  it('returns 500 on errors', async () => {
    m.getUserByEmail.mockRejectedValueOnce(new Error('db')).mockRejectedValueOnce('x');
    const res = await get('?email=a@x.cl');
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'db' });
    expect(await (await get('?email=a@x.cl')).json()).toEqual({ error: 'Error obteniendo userId' });
  });
});
