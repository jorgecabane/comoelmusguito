/**
 * Tool "📊 Reportes" del Studio: ventas, entregas, cursos y talleres.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Card, Container, Flex, Heading, Select, Spinner, Stack, Tab, TabList, TabPanel, Text } from '@sanity/ui';
import { useClient } from 'sanity';
import { FulfillmentPanel } from './FulfillmentPanel';
import { LearningPanel } from './LearningPanel';
import { SalesPanel } from './SalesPanel';
import { PAID, REPORT_QUERY, inRange, summarize, type ReportData, type ReportOrder } from './data';

const RANGES: { label: string; months: number | null }[] = [
  { label: 'Este mes', months: 1 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 12 meses', months: 12 },
  { label: 'Todo', months: null },
];

const TABS = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'entregas', label: 'Entregas' },
  { id: 'aprendizaje', label: 'Cursos y talleres' },
] as const;

export default function ReportsTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rangeIndex, setRangeIndex] = useState(2);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ventas');

  // Fijo al montar: evita que las agregaciones por mes cambien entre renders.
  const now = useMemo(() => new Date(), []);
  const months = RANGES[rangeIndex].months;

  useEffect(() => {
    let cancelled = false;
    client
      .fetch<ReportData>(REPORT_QUERY)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Error consultando Sanity'));
    return () => {
      cancelled = true;
    };
  }, [client]);

  // Las entregas se marcan una a una; refrescar todo sería tirar la lista completa.
  const patchOrder = useCallback((updated: ReportOrder) => {
    setData((prev) =>
      prev ? { ...prev, orders: prev.orders.map((o) => (o._id === updated._id ? updated : o)) } : prev,
    );
  }, []);

  const summary = useMemo(() => (data ? summarize(data.orders, months, now) : null), [data, months, now]);

  const hasLegacyDates = useMemo(
    () =>
      (data?.orders ?? []).some((o) => o.paymentStatus === PAID && !o.paymentDate && inRange(o, months, now)),
    [data, months, now],
  );

  if (error) {
    return (
      <Container width={4} padding={4}>
        <Card padding={4} radius={3} tone="critical">
          <Text size={1}>No se pudieron cargar los datos: {error}</Text>
        </Card>
      </Container>
    );
  }

  if (!data || !summary) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    );
  }

  return (
    <Container width={4}>
      <Box padding={4}>
        <Stack space={4}>
          <Flex align="center" justify="space-between" gap={3} wrap="wrap">
            <Heading size={2}>📊 Reportes</Heading>
            <Select
              fontSize={1}
              value={String(rangeIndex)}
              onChange={(event) => setRangeIndex(Number(event.currentTarget.value))}
              style={{ maxWidth: 220 }}
            >
              {RANGES.map((range, i) => (
                <option key={range.label} value={i}>
                  {range.label}
                </option>
              ))}
            </Select>
          </Flex>

          <TabList space={2}>
            {TABS.map((t) => (
              <Tab
                key={t.id}
                id={`${t.id}-tab`}
                aria-controls={`${t.id}-panel`}
                label={t.label}
                selected={tab === t.id}
                onClick={() => setTab(t.id)}
              />
            ))}
          </TabList>

          <TabPanel id="ventas-panel" aria-labelledby="ventas-tab" hidden={tab !== 'ventas'}>
            <SalesPanel summary={summary} hasLegacyDates={hasLegacyDates} />
          </TabPanel>

          <TabPanel id="entregas-panel" aria-labelledby="entregas-tab" hidden={tab !== 'entregas'}>
            {/* Las entregas pendientes no caducan: se listan todas, sin filtro de rango. */}
            <FulfillmentPanel orders={data.orders} onChange={patchOrder} />
          </TabPanel>

          <TabPanel id="aprendizaje-panel" aria-labelledby="aprendizaje-tab" hidden={tab !== 'aprendizaje'}>
            <LearningPanel data={data} now={now} />
          </TabPanel>
        </Stack>
      </Box>
    </Container>
  );
}
