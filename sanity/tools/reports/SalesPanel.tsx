/**
 * Panel de ventas: KPIs, ingreso por mes, top productos, mix, medio de pago,
 * regiones de despacho y catálogo sin ventas.
 */

import { Flex, Stack, Text } from '@sanity/ui';
import { BarList, Columns, formatCLP, Kpi, Section, Swatch, usePalette } from './components';
import { TYPE_LABEL, type SalesSummary } from './data';

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1] ?? month} ${year.slice(2)}`;
}

const PROVIDER_LABEL: Record<string, string> = { flow: 'Flow (Chile)', paypal: 'PayPal (internacional)' };

export function SalesPanel({ summary, hasLegacyDates }: { summary: SalesSummary; hasLegacyDates: boolean }) {
  const palette = usePalette();
  const clp = summary.revenue.CLP ?? 0;
  const usd = summary.revenue.USD ?? 0;
  const repeatPct = summary.buyers.unique ? Math.round((summary.buyers.repeat / summary.buyers.unique) * 100) : 0;

  return (
    <Stack space={3}>
      <Columns min={180}>
        <Kpi
          label="Ingreso CLP"
          value={formatCLP(clp)}
          hint={usd > 0 ? `+ US$${usd.toLocaleString('en-US')} por PayPal` : 'sin ventas en USD'}
          accent={palette.single}
        />
        <Kpi label="Órdenes pagadas" value={String(summary.paidCount)} hint={`de ${summary.createdCount} creadas`} />
        <Kpi label="Ticket promedio" value={formatCLP(summary.avgTicket.CLP ?? 0)} hint="sólo órdenes en CLP" />
        <Kpi
          label="Conversión de checkout"
          value={`${Math.round(summary.conversion * 100)}%`}
          hint={`${summary.abandoned.count} sin completar el pago`}
        />
        <Kpi
          label="Por cobrar (abandonos)"
          value={formatCLP(summary.abandoned.amount)}
          hint="órdenes pendientes en CLP"
          accent={palette.series[1]}
        />
        <Kpi
          label="Compradores únicos"
          value={String(summary.buyers.unique)}
          hint={`${summary.buyers.repeat} repiten (${repeatPct}%)${summary.gifts ? ` · ${summary.gifts} regalos` : ''}`}
        />
      </Columns>

      <Section
        title="Ingreso por mes"
        subtitle={
          'Sólo órdenes en CLP.' +
          (hasLegacyDates ? ' Las órdenes antiguas de Flow se contabilizan por fecha de creación.' : '')
        }
      >
        <BarList
          color={palette.single}
          rows={summary.byMonth.map((m) => ({
            label: `${monthLabel(m.key)} · ${m.orders} ${m.orders === 1 ? 'orden' : 'órdenes'}`,
            value: m.revenue,
            display: formatCLP(m.revenue),
          }))}
        />
      </Section>

      <Columns>
        <Section title="Top productos" subtitle="Unidades vendidas, coloreadas por tipo.">
          <BarList
            rows={summary.topProducts.slice(0, 10).map((p) => ({
              label: p.name,
              value: p.units,
              display: `${p.units} u · ${formatCLP(p.revenue)}`,
              color: palette.forType(p.type),
            }))}
          />
        </Section>

        <Section title="Mix por tipo" subtitle="Dónde está realmente el volumen.">
          <BarList
            rows={summary.byType.map((t) => ({
              label: t.label,
              value: t.units,
              display: `${t.units} u · ${formatCLP(t.revenue)}`,
              color: palette.forType(t.type),
            }))}
          />
        </Section>

        <Section title="Medio de pago" subtitle="Órdenes pagadas por pasarela.">
          <BarList
            color={palette.single}
            rows={summary.byProvider.map((p) => ({
              label: PROVIDER_LABEL[p.provider] ?? p.provider,
              value: p.orders,
              display: `${p.orders} ${p.orders === 1 ? 'orden' : 'órdenes'}`,
            }))}
          />
        </Section>

        <Section title="Despachos por región" subtitle="Sólo órdenes con dirección de despacho.">
          <BarList
            color={palette.series[2]}
            rows={summary.byRegion.slice(0, 8).map((r) => ({
              label: r.region,
              value: r.orders,
              display: `${r.orders}`,
            }))}
            emptyLabel="Sin despachos en este período."
          />
        </Section>
      </Columns>

      <Section
        title={`Catálogo sin ventas (${summary.unsold.length})`}
        subtitle="Productos disponibles que no vendieron ni una unidad en el período."
      >
        {summary.unsold.length === 0 ? (
          <Text size={1} muted>
            Todo el catálogo disponible vendió al menos una unidad.
          </Text>
        ) : (
          <Stack space={2}>
            {summary.unsold.map((p) => (
              <Flex key={p._id} gap={2} align="center">
                <Swatch color={palette.forType(p.type)} />
                <Text size={1}>
                  {p.name} <span style={{ opacity: 0.6 }}>· {TYPE_LABEL[p.type]}</span>
                </Text>
              </Flex>
            ))}
          </Stack>
        )}
      </Section>
    </Stack>
  );
}
