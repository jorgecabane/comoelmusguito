import type { Session } from 'next-auth';
import { describe, expect, it } from 'vitest';
import { isOrderOwner } from './order-owner';

const session = (user: Record<string, unknown>) => ({ user, expires: '' }) as Session;
const order = { customerEmail: 'ana@x.cl', userId: { _type: 'reference' as const, _ref: 'u1' } };

describe('isOrderOwner', () => {
  it('false sin sesión', () => {
    expect(isOrderOwner(order, null)).toBe(false);
  });

  it('true si la orden está vinculada al usuario de la sesión', () => {
    expect(isOrderOwner(order, session({ id: 'u1', email: 'otro@x.cl' }))).toBe(true);
  });

  it('true si el email coincide (sin importar mayúsculas)', () => {
    expect(isOrderOwner({ customerEmail: 'ana@x.cl' }, session({ email: 'Ana@X.cl' }))).toBe(true);
  });

  it('false para otro usuario', () => {
    expect(isOrderOwner(order, session({ id: 'u2', email: 'otro@x.cl' }))).toBe(false);
  });

  it('false si la sesión no trae email ni id', () => {
    expect(isOrderOwner(order, session({}))).toBe(false);
  });
});
