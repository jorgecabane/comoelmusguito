/**
 * Panel de ventas: KPIs, ingreso por mes, top productos y mix por tipo.
 */

import { Flex, Stack, Text } from '@sanity/ui';
import { BarList, formatCLP, Kpi, Section } from './components';
import type { SalesSummary } from './data';

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1] ?? month} ${year}`;
}

export function SalesPanel({ summary, hasLegacyDates }: { summary: SalesSummary; hasLegacyDates: boolean }) {
  const clp = summary.revenue.CLP ?? 0;
  const usd = summary.revenue.USD ?? 0;

  return (
    <Stack space={4}>
      <Flex gap={3} wrap="wrap">
        <Kpi label="Ingreso CLP" value={formatCLP(clp)} hint={usd > 0 ? `+ US$${usd.toLocaleString('en-US')}` : undefined} />
        <Kpi label="Órdenes pagadas" value={String(summary.paidCount)} hint={`${summary.createdCount} creadas`} />
        <Kpi label="Ticket promedio" value={formatCLP(summary.avgTicket.CLP ?? 0)} hint="sólo órdenes en CLP" />
        <Kpi
          label="Conversión de checkout"
          value={`${Math.round(summary.conversion * 100)}%`}
          hint={`${summary.createdCount - summary.paidCount} sin completar el pago`}
        />
      </Flex>

      <Section
        title="Ingreso por mes"
        subtitle={
          'Sólo órdenes en CLP (las de PayPal en USD van aparte, arriba).' +
          (hasLegacyDates
            ? ' Las órdenes antiguas de Flow no tienen fecha de pago; se contabilizan por fecha de creación.'
            : '')
        }
      >
        <BarList
          rows={summary.byMonth.map((m) => ({
            label: `${monthLabel(m.key)} · ${m.orders} ${m.orders === 1 ? 'orden' : 'órdenes'}`,
            value: m.revenue,
            display: formatCLP(m.revenue),
          }))}
        />
      </Section>

      <Section title="Top productos" subtitle="Unidades vendidas en órdenes pagadas.">
        <BarList
          rows={summary.topProducts.slice(0, 12).map((p) => ({
            label: p.name,
            value: p.units,
            display: `${p.units} u · ${formatCLP(p.revenue)}`,
          }))}
        />
        {summary.topProducts.length > 12 && (
          <Text size={1} muted>
            Mostrando 12 de {summary.topProducts.length} productos vendidos.
          </Text>
        )}
      </Section>

      <Section title="Mix por tipo de producto" subtitle="Dónde está realmente el volumen.">
        <BarList
          rows={summary.byType.map((t) => ({
            label: t.type,
            value: t.units,
            display: `${t.units} u · ${formatCLP(t.revenue)}`,
          }))}
        />
      </Section>
    </Stack>
  );
}
