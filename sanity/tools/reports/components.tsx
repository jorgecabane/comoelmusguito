/**
 * Primitivas visuales del panel de reportes.
 *
 * La paleta categórica está validada con el validador del skill de dataviz
 * contra ambas superficies del Studio (oscura #13141b y clara #fcfcfb): banda
 * de luminosidad, piso de croma, separación CVD y contraste. En modo claro dos
 * tonos quedan bajo 3:1, cubierto por la regla de relieve — cada barra lleva su
 * etiqueta y su valor como texto, así que el color nunca es el único canal.
 *
 * El color sigue a la entidad (el tipo de producto), nunca al ranking: filtrar
 * o reordenar no repinta las series.
 */

import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import { useColorSchemeValue } from 'sanity';
import type { ItemType } from './data';

const SERIES = {
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500'],
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'],
} as const;

/** Orden fijo de slots por tipo de producto. */
const TYPE_SLOT: Record<ItemType, number> = { terrarium: 0, supply: 1, course: 2, workshop: 3 };

export function usePalette() {
  const scheme = useColorSchemeValue();
  const series = SERIES[scheme === 'dark' ? 'dark' : 'light'];

  return {
    series,
    /** Tinta única para magnitudes (mes, ingreso): slot 1 del tema. */
    single: series[0],
    forType: (type: ItemType | undefined) => series[TYPE_SLOT[type ?? 'supply'] ?? 0],
  };
}

export function formatCLP(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CL')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
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

/** Rejilla que colapsa sola: dos columnas donde entren, una cuando no. */
export function Columns({ children, min = 320 }: { children: React.ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

export function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <Card padding={3} radius={2} border style={{ borderLeft: `3px solid ${accent ?? 'transparent'}` }}>
      <Stack space={2}>
        <Text size={0} muted>
          {label}
        </Text>
        <Text size={3} weight="bold">
          {value}
        </Text>
        {hint && (
          <Text size={0} muted>
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
  display?: string;
  color?: string;
}

/**
 * Fila compacta: el relleno va detrás del texto, así cada dato ocupa una línea
 * en vez de tres. El ancho codifica magnitud; la etiqueta, identidad.
 */
export function BarList({
  rows,
  color,
  emptyLabel = 'Sin datos en este período',
}: {
  rows: BarRow[];
  color?: string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <Text size={1} muted>
        {emptyLabel}
      </Text>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <Stack space={1}>
      {rows.map((row) => (
        <Box key={row.label} className="rp-row" style={{ position: 'relative', borderRadius: 4, overflow: 'hidden' }}>
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              width: `${Math.max((row.value / max) * 100, row.value > 0 ? 2 : 0)}%`,
              background: row.color ?? color ?? 'currentColor',
              opacity: 0.35,
              borderRadius: 4,
            }}
          />
          <Flex justify="space-between" gap={3} padding={2} style={{ position: 'relative' }}>
            <Text size={1} textOverflow="ellipsis">
              {row.label}
            </Text>
            <Text size={1} weight="medium" style={{ whiteSpace: 'nowrap' }}>
              {row.display ?? row.value.toLocaleString('es-CL')}
            </Text>
          </Flex>
        </Box>
      ))}
    </Stack>
  );
}

export function Section({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padding={3} radius={2} border>
      <Stack space={3}>
        <Flex align="flex-start" justify="space-between" gap={3}>
          <Stack space={2} flex={1}>
            <Text size={1} weight="semibold">
              {title}
            </Text>
            {subtitle && (
              <Text size={0} muted>
                {subtitle}
              </Text>
            )}
          </Stack>
          {actions}
        </Flex>
        {children}
      </Stack>
    </Card>
  );
}

/** Acordeón nativo: sin estado propio, con teclado y semántica gratis. */
export function Accordion({ summary, children }: { summary: React.ReactNode; children: React.ReactNode }) {
  return (
    <details className="rp-accordion">
      <summary>
        <Box flex={1} style={{ minWidth: 0 }}>
          {summary}
        </Box>
      </summary>
      <Box paddingTop={3} paddingLeft={4} paddingBottom={2}>
        {children}
      </Box>
    </details>
  );
}

/** Button de @sanity/ui, no Card clicable: trae foco visible, estados de hover
 *  y semántica de botón sin reimplementarlos. */
export function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <Flex gap={1}>
      {options.map((option) => (
        <Button
          key={option.id}
          className="rp-press"
          mode={value === option.id ? 'default' : 'bleed'}
          tone={value === option.id ? 'primary' : 'default'}
          fontSize={1}
          padding={2}
          text={option.label}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        />
      ))}
    </Flex>
  );
}

/** Muestra de color del tipo de producto. Acompaña siempre a una etiqueta de
 *  texto: el color nunca es el único canal. */
export function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 2,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}
