/**
 * Consulta y agregaciones del panel de reportes.
 *
 * GROQ no tiene GROUP BY (sólo count()), así que se trae una proyección delgada
 * y se agrega en JS. Funciones puras para poder verificarlas sin montar el Studio.
 */

export const PAID = 2;
export const PENDING = 1;

export interface ReportItem {
  id?: string;
  type?: 'terrarium' | 'course' | 'workshop' | 'supply';
  name?: string;
  quantity?: number;
  price?: number;
  selectedDate?: { date?: string };
}

export interface ReportOrder {
  _id: string;
  orderId?: string;
  createdAt?: string;
  paymentDate?: string;
  paymentStatus?: number;
  total?: number;
  currency?: 'CLP' | 'USD';
  customerEmail?: string;
  customerName?: string;
  requiresShipping?: boolean;
  fulfilledAt?: string;
  items?: ReportItem[];
  shippingAddress?: { region?: string; comuna?: string; address?: string; number?: string; phone?: string };
}

export interface WorkshopDate {
  date?: string;
  spotsTotal?: number;
  spotsAvailable?: number;
  status?: string;
}

export interface ReportData {
  orders: ReportOrder[];
  courseAccess: { course?: string; email?: string }[];
  workshops: { _id: string; name?: string; dates?: WorkshopDate[] }[];
}

// ponytail: trae todas las órdenes y agrega en memoria. Con ~200 docs es
// instantáneo; pasando de unos miles, filtrar por fecha en el GROQ.
export const REPORT_QUERY = `{
  "orders": *[_type == "order"] | order(createdAt desc) {
    _id, orderId, createdAt, paymentDate, paymentStatus, total, currency,
    customerEmail, customerName, requiresShipping, fulfilledAt,
    items[]{id, type, name, quantity, price, selectedDate},
    shippingAddress{region, comuna, address, number, phone}
  },
  "courseAccess": *[_type == "courseAccess"]{"course": course->name, "email": user->email},
  "workshops": *[_type == "workshop"]{_id, name, dates[]{date, spotsTotal, spotsAvailable, status}}
}`;

/** Fecha con la que se contabiliza una venta. Las órdenes de Flow anteriores al
 *  fix de paymentDate no la tienen, así que caen a createdAt. */
export function saleDate(order: ReportOrder): string | undefined {
  return order.paymentDate ?? order.createdAt;
}

const MONTH_FMT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
});

/** "2026-08" en hora de Chile: un pago del 31 a las 23:00 no se va al mes siguiente. */
export function monthKey(iso: string): string {
  return MONTH_FMT.format(new Date(iso)).slice(0, 7);
}

export function monthsBack(months: number, now: Date): string[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    keys.push(monthKey(d.toISOString()));
  }
  return keys;
}

export function inRange(order: ReportOrder, months: number | null, now: Date): boolean {
  if (months === null) return true;
  const date = saleDate(order);
  if (!date) return false;
  return monthsBack(months, now).includes(monthKey(date));
}

export interface SalesSummary {
  paidCount: number;
  createdCount: number;
  revenue: Record<string, number>;
  avgTicket: Record<string, number>;
  conversion: number;
  byMonth: { key: string; revenue: number; orders: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  byType: { type: string; units: number; revenue: number }[];
}

const TYPE_LABEL: Record<string, string> = {
  terrarium: 'Terrarios',
  supply: 'Insumos',
  course: 'Cursos online',
  workshop: 'Talleres',
};

export function summarize(orders: ReportOrder[], months: number | null, now: Date): SalesSummary {
  const scoped = orders.filter((o) => inRange(o, months, now));
  const paid = scoped.filter((o) => o.paymentStatus === PAID);

  const revenue: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const monthRevenue = new Map<string, { revenue: number; orders: number }>();
  const products = new Map<string, { units: number; revenue: number }>();
  const types = new Map<string, { units: number; revenue: number }>();

  for (const order of paid) {
    const currency = order.currency ?? 'CLP';
    revenue[currency] = (revenue[currency] ?? 0) + (order.total ?? 0);
    counts[currency] = (counts[currency] ?? 0) + 1;

    const date = saleDate(order);
    if (date && currency === 'CLP') {
      const key = monthKey(date);
      const prev = monthRevenue.get(key) ?? { revenue: 0, orders: 0 };
      monthRevenue.set(key, { revenue: prev.revenue + (order.total ?? 0), orders: prev.orders + 1 });
    }

    for (const item of order.items ?? []) {
      const units = item.quantity ?? 0;
      const amount = (item.price ?? 0) * units;

      const name = item.name?.trim() || 'Sin nombre';
      const p = products.get(name) ?? { units: 0, revenue: 0 };
      products.set(name, { units: p.units + units, revenue: p.revenue + amount });

      const label = TYPE_LABEL[item.type ?? ''] ?? 'Otro';
      const t = types.get(label) ?? { units: 0, revenue: 0 };
      types.set(label, { units: t.units + units, revenue: t.revenue + amount });
    }
  }

  const avgTicket: Record<string, number> = {};
  for (const [currency, total] of Object.entries(revenue)) {
    avgTicket[currency] = Math.round(total / (counts[currency] || 1));
  }

  return {
    paidCount: paid.length,
    createdCount: scoped.length,
    revenue,
    avgTicket,
    conversion: scoped.length ? paid.length / scoped.length : 0,
    byMonth: [...monthRevenue.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    topProducts: [...products.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.units - a.units),
    byType: [...types.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.units - a.units),
  };
}

const PHYSICAL = new Set(['terrarium', 'supply']);

/** Órdenes pagadas con algo que entregar a mano. Cursos y talleres quedan fuera:
 *  el acceso es instantáneo y el taller se entrega presencialmente. */
export function needsFulfillment(order: ReportOrder): boolean {
  return order.paymentStatus === PAID && (order.items ?? []).some((i) => PHYSICAL.has(i.type ?? ''));
}

export function fulfillmentQueues(orders: ReportOrder[]) {
  const pending = orders.filter(needsFulfillment);
  const oldestFirst = (a: ReportOrder, b: ReportOrder) =>
    (saleDate(a) ?? '').localeCompare(saleDate(b) ?? '');

  return {
    despacho: pending.filter((o) => o.requiresShipping).sort(oldestFirst),
    retiro: pending.filter((o) => !o.requiresShipping).sort(oldestFirst),
  };
}

export function courseStats(data: ReportData) {
  const byCourse = new Map<string, Set<string>>();
  for (const access of data.courseAccess) {
    const name = access.course?.trim() || 'Curso eliminado';
    const set = byCourse.get(name) ?? new Set<string>();
    set.add(access.email ?? `anon-${set.size}`);
    byCourse.set(name, set);
  }

  const people = new Set(data.courseAccess.map((a) => a.email).filter(Boolean) as string[]);

  // Compras de curso pagadas: si supera a los accesos, alguien pagó y no tiene acceso.
  const purchases = data.orders
    .filter((o) => o.paymentStatus === PAID)
    .reduce((n, o) => n + (o.items ?? []).filter((i) => i.type === 'course').length, 0);

  return {
    totalPeople: people.size,
    purchases,
    byCourse: [...byCourse.entries()]
      .map(([name, set]) => ({ name, people: set.size }))
      .sort((a, b) => b.people - a.people),
  };
}

export interface UpcomingWorkshop {
  workshop: string;
  date: string;
  enrolled: number;
  spotsTotal?: number;
  attendees: { name: string; email: string; quantity: number }[];
}

export function upcomingWorkshops(data: ReportData, now: Date): UpcomingWorkshop[] {
  const rows: UpcomingWorkshop[] = [];

  for (const workshop of data.workshops) {
    for (const date of workshop.dates ?? []) {
      if (!date.date || date.status === 'cancelled') continue;
      if (new Date(date.date).getTime() < now.getTime()) continue;

      const target = new Date(date.date).getTime();
      const attendees: UpcomingWorkshop['attendees'] = [];

      for (const order of data.orders) {
        if (order.paymentStatus !== PAID) continue;
        for (const item of order.items ?? []) {
          if (item.type !== 'workshop' || item.id !== workshop._id) continue;
          if (!item.selectedDate?.date) continue;
          if (new Date(item.selectedDate.date).getTime() !== target) continue;
          attendees.push({
            name: order.customerName ?? 'Sin nombre',
            email: order.customerEmail ?? '',
            quantity: item.quantity ?? 1,
          });
        }
      }

      rows.push({
        workshop: workshop.name ?? 'Taller',
        date: date.date,
        enrolled: attendees.reduce((n, a) => n + a.quantity, 0),
        spotsTotal: date.spotsTotal,
        attendees,
      });
    }
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
