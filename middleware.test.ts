import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('next-auth/middleware', () => ({
  withAuth: (handler: unknown, options: unknown) => ({ handler, options }),
}));

import middleware, { config } from './middleware';

type Wrapped = {
  handler: (req: NextRequest) => Response;
  options: { callbacks: { authorized: (a: { token: unknown }) => boolean } };
};
const { handler, options } = middleware as unknown as Wrapped;

describe('middleware', () => {
  it('protects only the account areas', () => {
    expect(config.matcher).toEqual(['/mi-cuenta/:path*']);
  });

  it('authorizes only when a JWT token is present', () => {
    expect(options.callbacks.authorized({ token: null })).toBe(false);
    expect(options.callbacks.authorized({ token: { sub: 'u1' } })).toBe(true);
  });

  it('lets authorized requests through', () => {
    const res = handler(new NextRequest('http://localhost/mi-cuenta'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
