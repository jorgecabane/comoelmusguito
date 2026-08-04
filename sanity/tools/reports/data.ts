/**
 * Consulta y agregaciones del panel de reportes.
 *
 * GROQ no tiene GROUP BY (sólo count()), así que se trae una proyección delgada
 * y se agrega en JS. Funciones puras para poder verificarlas sin montar el Studio.
 */

export const PAID = 2;
export const PENDING = 1;

export type ItemType = 'terrarium' | 'course' | 'workshop' | 'supply';

export interface ReportItem {
  id?: string;
  type?: ItemType;
  name?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  shippingPreference?: string;
  selectedDate?: { date?: string; time?: string };
}

export interface ReportOrder {
  _id: string;
  orderId?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentDate?: string;
  paymentStatus?: number;
  paymentProvider?: string;
  providerTransactionId?: string;
  total?: number;
  currency?: 'CLP' | 'USD';
  customerEmail?: string;
  customerName?: string;
  requiresShipping?: boolean;
  fulfilledAt?: string;
  emailSent?: boolean;
  isGift?: boolean;
  recipientEmail?: string;
  recipientName?: string;
  giftMessage?: string;
  refundedAt?: string;
  items?: ReportItem[];
  shippingAddress?: {
    region?: string;
    comuna?: string;
    address?: string;
    number?: string;
    details?: string;
    contactEmail?: string;
    phone?: string;
    rut?: string;
  };
}

export interface CourseModule {
  title?: string;
  lessons?: { title?: string }[];
}

export interface ReportAccess {
  _id: string;
  email?: string;
  userName?: string;
  accessGrantedAt?: string;
  courseName?: string;
  modules?: CourseModule[];
  progress?: {
    completedLessons?: string[];
    lastWatched?: string;
    lastWatchedAt?: string;
  };
}

export interface WorkshopDate {
  date?: string;
  spotsTotal?: number;
  spotsAvailable?: number;
  status?: string;
}

export interface CatalogProduct {
  _id: string;
  name?: string;
  type: ItemType;
}

export interface ReportData {
  orders: ReportOrder[];
  courseAccess: ReportAccess[];
  workshops: { _id: string; name?: string; dates?: WorkshopDate[] }[];
  catalog: CatalogProduct[];
}

// ponytail: trae todas las órdenes y agrega en memoria. Con ~200 docs es
// instantáneo; pasando de unos miles, filtrar por fecha en el GROQ.
export const REPORT_QUERY = `{
  "orders": *[_type == "order"] | order(createdAt desc) {
    _id, orderId, createdAt, updatedAt, paymentDate, paymentStatus, paymentProvider,
    providerTransactionId, total, currency, customerEmail, customerName,
    requiresShipping, fulfilledAt, emailSent, isGift, recipientEmail, recipientName,
    giftMessage, refundedAt,
    items[]{id, type, name, quantity, price, currency, shippingPreference, selectedDate},
    shippingAddress
  },
  "courseAccess": *[_type == "courseAccess"]{
    _id, accessGrantedAt, progress,
    "email": user->email, "userName": user->name,
    "courseName": course->name,
    "modules": course->modules[]{title, "lessons": lessons[]{title}}
  },
  "workshops": *[_type == "workshop"]{_id, name, dates[]{date, spotsTotal, spotsAvailable, status}},
  "catalog": [
    ...*[_type == "terrarium" && inStock == true]{_id, name, "type": "terrarium"},
    ...*[_type == "supply" && inStock == true]{_id, name, "type": "supply"},
    ...*[_type == "course" && published == true]{_id, name, "type": "course"},
    ...*[_type == "workshop" && published == true]{_id, name, "type": "workshop"}
  ]
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
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    keys.push(monthKey(d.toISOString()));
  }
  return keys;
}

/** Rango activo como conjunto de meses; null = todo el histórico. */
export function inMonths(iso: string | undefined, months: number | null, now: Date): boolean {
  if (months === null) return true;
  if (!iso) return false;
  return monthsBack(months, now).includes(monthKey(iso));
}

export function inRange(order: ReportOrder, months: number | null, now: Date): boolean {
  return inMonths(saleDate(order), months, now);
}

export interface SalesSummary {
  paidCount: number;
  createdCount: number;
  revenue: Record<string, number>;
  avgTicket: Record<string, number>;
  conversion: number;
  abandoned: { count: number; amount: number };
  buyers: { unique: number; repeat: number };
  gifts: number;
  byMonth: { key: string; revenue: number; orders: number }[];
  topProducts: { name: string; type: ItemType; units: number; revenue: number }[];
  byType: { type: ItemType; label: string; units: number; revenue: number }[];
  byProvider: { provider: string; orders: number; revenue: number }[];
  byRegion: { region: string; orders: number }[];
  unsold: CatalogProduct[];
}

export const TYPE_LABEL: Record<ItemType, string> = {
  terrarium: 'Terrarios',
  supply: 'Insumos',
  course: 'Cursos online',
  workshop: 'Talleres',
};

export function summarize(
  data: ReportData,
  months: number | null,
  now: Date,
): SalesSummary {
  const scoped = data.orders.filter((o) => inRange(o, months, now));
  const paid = scoped.filter((o) => o.paymentStatus === PAID);
  const pending = scoped.filter((o) => o.paymentStatus === PENDING);

  const revenue: Record<string, number> = {};
  const counts: Record<string, number> = {};
  const monthRevenue = new Map<string, { revenue: number; orders: number }>();
  const products = new Map<string, { type: ItemType; units: number; revenue: number }>();
  const types = new Map<ItemType, { units: number; revenue: number }>();
  const providers = new Map<string, { orders: number; revenue: number }>();
  const regions = new Map<string, number>();
  const buyerOrders = new Map<string, number>();
  const soldIds = new Set<string>();

  for (const order of paid) {
    const currency = order.currency ?? 'CLP';
    revenue[currency] = (revenue[currency] ?? 0) + (order.total ?? 0);
    counts[currency] = (counts[currency] ?? 0) + 1;

    const provider = order.paymentProvider ?? 'flow';
    const p = providers.get(provider) ?? { orders: 0, revenue: 0 };
    providers.set(provider, {
      orders: p.orders + 1,
      revenue: p.revenue + (currency === 'CLP' ? order.total ?? 0 : 0),
    });

    if (order.customerEmail) {
      buyerOrders.set(order.customerEmail, (buyerOrders.get(order.customerEmail) ?? 0) + 1);
    }

    const region = order.shippingAddress?.region;
    if (region) regions.set(region, (regions.get(region) ?? 0) + 1);

    const date = saleDate(order);
    if (date && currency === 'CLP') {
      const key = monthKey(date);
      const prev = monthRevenue.get(key) ?? { revenue: 0, orders: 0 };
      monthRevenue.set(key, { revenue: prev.revenue + (order.total ?? 0), orders: prev.orders + 1 });
    }

    for (const item of order.items ?? []) {
      const units = item.quantity ?? 0;
      const amount = (item.price ?? 0) * units;
      const type = (item.type ?? 'supply') as ItemType;

      if (item.id) soldIds.add(item.id);

      const name = item.name?.trim() || 'Sin nombre';
      const prod = products.get(name) ?? { type, units: 0, revenue: 0 };
      products.set(name, { type, units: prod.units + units, revenue: prod.revenue + amount });

      const t = types.get(type) ?? { units: 0, revenue: 0 };
      types.set(type, { units: t.units + units, revenue: t.revenue + amount });
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
    abandoned: {
      count: pending.length,
      amount: pending.reduce((n, o) => n + (o.currency === 'CLP' ? o.total ?? 0 : 0), 0),
    },
    buyers: {
      unique: buyerOrders.size,
      repeat: [...buyerOrders.values()].filter((n) => n > 1).length,
    },
    gifts: paid.filter((o) => o.isGift).length,
    byMonth: [...monthRevenue.entries()]
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    topProducts: [...products.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.units - a.units),
    byType: [...types.entries()]
      .map(([type, v]) => ({ type, label: TYPE_LABEL[type], ...v }))
      .sort((a, b) => b.units - a.units),
    byProvider: [...providers.entries()]
      .map(([provider, v]) => ({ provider, ...v }))
      .sort((a, b) => b.orders - a.orders),
    byRegion: [...regions.entries()]
      .map(([region, orders]) => ({ region, orders }))
      .sort((a, b) => b.orders - a.orders),
    unsold: data.catalog.filter((p) => !soldIds.has(p._id)),
  };
}

const PHYSICAL = new Set<ItemType>(['terrarium', 'supply']);

/** Órdenes pagadas con algo que entregar a mano. Cursos y talleres quedan fuera:
 *  el acceso es instantáneo y el taller se entrega presencialmente. */
export function needsFulfillment(order: ReportOrder): boolean {
  return (
    order.paymentStatus === PAID &&
    (order.items ?? []).some((i) => PHYSICAL.has((i.type ?? '') as ItemType))
  );
}

export function fulfillmentQueues(orders: ReportOrder[], months: number | null, now: Date) {
  const relevant = orders.filter(needsFulfillment);
  const scoped = relevant.filter((o) => inRange(o, months, now));
  const oldestFirst = (a: ReportOrder, b: ReportOrder) =>
    (saleDate(a) ?? '').localeCompare(saleDate(b) ?? '');

  return {
    despacho: scoped.filter((o) => o.requiresShipping).sort(oldestFirst),
    retiro: scoped.filter((o) => !o.requiresShipping).sort(oldestFirst),
    /** Pendientes que el rango deja fuera: avisar para no esconder trabajo real. */
    hiddenPending: relevant.filter((o) => !o.fulfilledAt && !inRange(o, months, now)).length,
  };
}

export interface CoursePerson {
  name: string;
  email: string;
  percent: number;
  completed: number;
  total: number;
  position?: string;
  lastWatchedAt?: string;
}

export interface CourseReport {
  name: string;
  people: CoursePerson[];
}

function lessonPosition(modules: CourseModule[] | undefined, lessonId: string | undefined): string | undefined {
  if (!lessonId || !modules) return undefined;
  const [m, l] = lessonId.split('-').map(Number);
  const mod = modules[m];
  const lesson = mod?.lessons?.[l];
  if (!mod || !lesson) return undefined;
  return `M${m + 1}: ${mod.title ?? 'Módulo'} · L${l + 1}: ${lesson.title ?? 'Lección'}`;
}

export function courseStats(data: ReportData, months: number | null, now: Date) {
  const scoped = data.courseAccess.filter((a) => inMonths(a.accessGrantedAt, months, now));
  const byCourse = new Map<string, CoursePerson[]>();

  for (const access of scoped) {
    const courseName = access.courseName?.trim() || 'Curso eliminado';
    const total = (access.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0);
    const completed = access.progress?.completedLessons?.length ?? 0;

    const people = byCourse.get(courseName) ?? [];
    people.push({
      name: access.userName ?? access.email ?? 'Sin nombre',
      email: access.email ?? '',
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      position: lessonPosition(access.modules, access.progress?.lastWatched),
      lastWatchedAt: access.progress?.lastWatchedAt,
    });
    byCourse.set(courseName, people);
  }

  const purchases = data.orders
    .filter((o) => o.paymentStatus === PAID && inRange(o, months, now))
    .reduce((n, o) => n + (o.items ?? []).filter((i) => i.type === 'course').length, 0);

  const courses: CourseReport[] = [...byCourse.entries()]
    .map(([name, people]) => ({ name, people: people.sort((a, b) => b.percent - a.percent) }))
    .sort((a, b) => b.people.length - a.people.length);

  return {
    courses,
    totalPeople: new Set(scoped.map((a) => a.email).filter(Boolean)).size,
    purchases,
    started: scoped.filter((a) => (a.progress?.completedLessons?.length ?? 0) > 0).length,
  };
}

export interface WorkshopSession {
  workshop: string;
  date: string;
  enrolled: number;
  spotsTotal?: number;
  attendees: { name: string; email: string; quantity: number }[];
}

export function workshopSessions(data: ReportData, now: Date): { upcoming: WorkshopSession[]; past: WorkshopSession[] } {
  const upcoming: WorkshopSession[] = [];
  const past: WorkshopSession[] = [];

  for (const workshop of data.workshops) {
    for (const date of workshop.dates ?? []) {
      if (!date.date || date.status === 'cancelled') continue;

      const target = new Date(date.date).getTime();
      const attendees: WorkshopSession['attendees'] = [];

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

      const session: WorkshopSession = {
        workshop: workshop.name ?? 'Taller',
        date: date.date,
        enrolled: attendees.reduce((n, a) => n + a.quantity, 0),
        spotsTotal: date.spotsTotal,
        attendees,
      };

      if (target >= now.getTime()) upcoming.push(session);
      else past.push(session);
    }
  }

  return {
    upcoming: upcoming.sort((a, b) => a.date.localeCompare(b.date)),
    past: past.sort((a, b) => b.date.localeCompare(a.date)),
  };
}
