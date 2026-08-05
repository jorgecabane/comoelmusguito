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

/**
 * Estilos que los props de @sanity/ui no alcanzan: hover de fila, feedback de
 * presión y el triángulo del acordeón. Curva y duraciones cortas porque son
 * interacciones de todos los días; todo se desactiva con reduced-motion.
 */
const STYLES = `
.rp-row { transition: background-color 150ms ease; }
.rp-press { transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }
.rp-press:active { transform: scale(0.97); }

.rp-accordion > summary {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 4px 2px; border-radius: 4px; cursor: pointer;
  list-style: none; transition: background-color 150ms ease;
}
.rp-accordion > summary::-webkit-details-marker { display: none; }
.rp-accordion > summary::before {
  content: ''; flex-shrink: 0; margin-top: 7px; opacity: 0.45;
  border-left: 5px solid currentColor;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms ease;
}
.rp-accordion[open] > summary::before { transform: rotate(90deg); }
.rp-accordion > summary:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

@media (hover: hover) and (pointer: fine) {
  .rp-row:hover { background-color: rgba(128, 128, 128, 0.1); }
  .rp-accordion > summary:hover { background-color: rgba(128, 128, 128, 0.08); }
  .rp-accordion > summary:hover::before { opacity: 0.85; }
}

@media (prefers-reduced-motion: reduce) {
  .rp-row, .rp-press, .rp-accordion > summary, .rp-accordion > summary::before { transition: none; }
  .rp-press:active { transform: none; }
}
`;

export default function ReportsTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rangeIndex, setRangeIndex] = useState(0);
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

  const summary = useMemo(() => (data ? summarize(data, months, now) : null), [data, months, now]);

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
    // Misma estructura que el tool Vision: raíz fija que no crece con el
    // contenido, y un solo hijo con el scroll. Sin esto el panel se pasa de
    // largo y el Studio lo recorta sin dejar scrollear.
    <Flex direction="column" height="fill" sizing="border" overflow="hidden">
      <style>{STYLES}</style>

      {/* La barra queda fija: el rango y las pestañas siguen a mano al scrollear. */}
      <Card padding={3} borderBottom>
        <Flex align="center" gap={3} wrap="wrap">
          <Heading size={1}>Reportes</Heading>
          <Box flex={1}>
            <TabList space={1}>
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
          </Box>
          <Select
            fontSize={1}
            value={String(rangeIndex)}
            onChange={(event) => setRangeIndex(Number(event.currentTarget.value))}
            aria-label="Rango de fechas del reporte"
            style={{ width: 200 }}
          >
            {RANGES.map((range, i) => (
              <option key={range.label} value={i}>
                {range.label}
              </option>
            ))}
          </Select>
        </Flex>
      </Card>

      <Box flex={1} overflow="auto" padding={3}>
        <TabPanel id="ventas-panel" aria-labelledby="ventas-tab" hidden={tab !== 'ventas'}>
          <SalesPanel summary={summary} hasLegacyDates={hasLegacyDates} />
        </TabPanel>

        <TabPanel id="entregas-panel" aria-labelledby="entregas-tab" hidden={tab !== 'entregas'}>
          <FulfillmentPanel orders={data.orders} months={months} now={now} onChange={patchOrder} />
        </TabPanel>

        <TabPanel id="aprendizaje-panel" aria-labelledby="aprendizaje-tab" hidden={tab !== 'aprendizaje'}>
          <LearningPanel data={data} months={months} now={now} />
        </TabPanel>
      </Box>
    </Flex>
  );
}
