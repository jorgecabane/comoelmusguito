import type { Session } from 'next-auth';
import type { SanityOrder } from '@/lib/sanity/orders';

type OwnedOrder = Pick<SanityOrder, 'customerEmail' | 'userId'>;

/** La orden es de la sesión si está vinculada a su usuario o se compró con su email. */
export function isOrderOwner(order: OwnedOrder, session: Session | null): boolean {
  const user = session?.user as { id?: string; email?: string | null } | undefined;
  if (!user) return false;
  if (user.id && order.userId?._ref === user.id) return true;
  return !!user.email && order.customerEmail?.toLowerCase() === user.email.toLowerCase();
}
