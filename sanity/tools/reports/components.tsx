/**
 * Primitivas visuales del panel de reportes.
 *
 * Barras horizontales en una sola tinta: la identidad la lleva la etiqueta de
 * cada fila, no el color, así que no hace falta paleta categórica ni leyenda.
 * El relleno usa `currentColor` — el token de texto del tema del Studio — para
 * que el contraste sea correcto en modo claro y oscuro sin hardcodear colores.
 */

import { Box, Card, Flex, Stack, Text } from '@sanity/ui';

export function formatCLP(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card padding={4} radius={3} border style={{ flex: '1 1 180px' }}>
      <Stack space={3}>
        <Text size={1} muted>
          {label}
        </Text>
        <Text size={4} weight="bold">
          {value}
        </Text>
        {hint && (
          <Text size={1} muted>
            {hint}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export interface BarRow {
  label: string;
  value: number;
  /** Texto a la derecha; si falta se muestra el valor. */
  display?: string;
}

export function BarList({ rows, emptyLabel = 'Sin datos en este período' }: { rows: BarRow[]; emptyLabel?: string }) {
  if (rows.length === 0) {
    return (
      <Text size={1} muted>
        {emptyLabel}
      </Text>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Stack space={3}>
      {rows.map((row) => (
        <Stack key={row.label} space={2}>
          <Flex justify="space-between" gap={3}>
            <Text size={1} textOverflow="ellipsis">
              {row.label}
            </Text>
            <Text size={1} weight="medium" style={{ whiteSpace: 'nowrap' }}>
              {row.display ?? row.value.toLocaleString('es-CL')}
            </Text>
          </Flex>
          <Box style={{ height: 8, borderRadius: 4, background: 'var(--card-border-color, currentColor)', opacity: 0.15 }}>
            <Box
              style={{
                width: `${Math.max((row.value / max) * 100, row.value > 0 ? 1.5 : 0)}%`,
                height: 8,
                borderRadius: 4,
                background: 'currentColor',
                opacity: 0.75,
              }}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card padding={4} radius={3} border>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={2} weight="semibold">
            {title}
          </Text>
          {subtitle && (
            <Text size={1} muted>
              {subtitle}
            </Text>
          )}
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}
