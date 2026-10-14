import { describe, expect, it } from 'vitest';
import type { SanityDocument } from '@sanity/client';
import { planMigration } from './migrate-private-ids';

const doc = (d: Partial<SanityDocument> & { _id: string; _type: string }) =>
  ({ _rev: 'r', _createdAt: '2025-01-01T00:00:00Z', _updatedAt: 'x', ...d }) as SanityDocument;

describe('planMigration', () => {
  const user = doc({ _id: 'u1', _type: 'user', email: 'a@x.cl', passwordHash: 'h', passwordResetToken: 't', emailVerificationToken: 'v' });
  const userDraft = doc({ _id: 'drafts.u1', _type: 'user', email: 'a@x.cl' });
  const order = doc({ _id: 'o1', _type: 'order', userId: { _type: 'reference', _ref: 'u1' } });
  const access = doc({
    _id: 'a1',
    _type: 'courseAccess',
    user: { _type: 'reference', _ref: 'u1' },
    order: { _type: 'reference', _ref: 'o1' },
    course: { _type: 'reference', _ref: 'c1' },
  });

  const plan = planMigration([order, user, userDraft], [order, access]);

  it('crea copias privadas (borradores incluidos) con referencias repuntadas, usuarios primero', () => {
    expect(plan.creates.map((d) => d._id)).toEqual(['private.u1', 'drafts.private.u1', 'private.o1']);
    expect(plan.creates[2]).toMatchObject({ userId: { _ref: 'private.u1' }, _createdAt: '2025-01-01T00:00:00Z' });
    expect(plan.creates[0]).not.toHaveProperty('_rev');
  });

  it('borra los tokens expuestos pero conserva el hash', () => {
    expect(plan.creates[0]).toMatchObject({ passwordHash: 'h' });
    expect(plan.creates[0]).not.toHaveProperty('passwordResetToken');
    expect(plan.creates[0]).not.toHaveProperty('emailVerificationToken');
  });

  it('repunta referencias de docs no migrados y borra originales (pedidos antes que usuarios)', () => {
    expect(plan.updates).toEqual([
      expect.objectContaining({ _id: 'a1', user: { _type: 'reference', _ref: 'private.u1' }, order: { _type: 'reference', _ref: 'private.o1' }, course: { _type: 'reference', _ref: 'c1' } }),
    ]);
    expect(plan.deletes).toEqual(['o1', 'drafts.u1', 'u1']);
  });
});
