import { describe, it, expect, vi } from 'vitest';

const getServerSession = vi.hoisted(() => vi.fn());
vi.mock('next-auth', () => ({ getServerSession }));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: { marker: true } }));

import { getSession, authOptions } from './get-session';

describe('getSession', () => {
  it('delegates to getServerSession with the app authOptions', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'a@x.cl' } });
    expect(await getSession()).toEqual({ user: { email: 'a@x.cl' } });
    expect(getServerSession).toHaveBeenCalledWith(authOptions);
    expect(authOptions).toEqual({ marker: true });
  });
});
