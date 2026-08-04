/**
 * Panel de entregas: cola de despachos y de retiros en tienda.
 *
 * Sólo aparecen órdenes pagadas con productos físicos. Cursos quedan fuera
 * (acceso instantáneo) y talleres también (se entregan presencialmente).
 * Ninguna orden se asume entregada por antigüedad: el check es manual.
 */

import { useState } from 'react';
import { Badge, Box, Button, Card, Checkbox, Flex, Stack, Text, useToast } from '@sanity/ui';
import { useClient } from 'sanity';
import { formatCLP, formatDate, formatDateTime, Section } from './components';
import { fulfillmentQueues, saleDate, type ReportOrder } from './data';

const PHYSICAL = new Set(['terrarium', 'supply']);

function OrderRow({ order, onToggle }: { order: ReportOrder; onToggle: (order: ReportOrder, done: boolean) => void }) {
  const date = saleDate(order);
  const physical = (order.items ?? []).filter((i) => PHYSICAL.has(i.type ?? ''));
  const address = order.shippingAddress;
  const done = Boolean(order.fulfilledAt);

  return (
    <Card padding={3} radius={2} border tone={done ? 'positive' : 'default'}>
      <Flex gap={3} align="flex-start">
        <Box paddingTop={1}>
          <Checkbox
            checked={done}
            onChange={(event) => onToggle(order, event.currentTarget.checked)}
            aria-label={`Marcar orden ${order.orderId ?? ''} como entregada`}
          />
        </Box>

        <Stack space={3} flex={1}>
          <Flex gap={2} align="center" wrap="wrap">
            <Text size={1} weight="semibold">
              {order.customerName || order.customerEmail || 'Sin nombre'}
            </Text>
            <Badge tone={done ? 'positive' : 'caution'} fontSize={0}>
              {done ? 'Entregada' : 'Pendiente'}
            </Badge>
            <Text size={0} muted>
              {date ? formatDate(date) : 'sin fecha'} · {order.orderId ?? order._id.slice(0, 8)} ·{' '}
              {formatCLP(order.total ?? 0)} {order.currency ?? 'CLP'}
            </Text>
          </Flex>

          <Text size={1}>{physical.map((i) => `${i.name} ×${i.quantity ?? 1}`).join(' · ')}</Text>

          {address && (
            <Text size={0} muted>
              {[address.address, address.number, address.comuna, address.region].filter(Boolean).join(' ')}
              {address.phone ? ` · ${address.phone}` : ''}
            </Text>
          )}
          {order.customerEmail && (
            <Text size={0} muted>
              {order.customerEmail}
            </Text>
          )}
          {done && order.fulfilledAt && (
            <Text size={0} muted>
              Marcada el {formatDateTime(order.fulfilledAt)}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  );
}

function Queue({
  title,
  subtitle,
  orders,
  onToggle,
}: {
  title: string;
  subtitle: string;
  orders: ReportOrder[];
  onToggle: (order: ReportOrder, done: boolean) => void;
}) {
  const [showDone, setShowDone] = useState(false);
  const pending = orders.filter((o) => !o.fulfilledAt);
  const done = orders.filter((o) => o.fulfilledAt);
  const visible = showDone ? orders : pending;

  return (
    <Section title={`${title} (${pending.length})`} subtitle={subtitle}>
      <Stack space={3}>
        {visible.length === 0 ? (
          <Text size={1} muted>
            {showDone ? 'Sin órdenes.' : 'Nada pendiente. 🎉'}
          </Text>
        ) : (
          visible.map((order) => <OrderRow key={order._id} order={order} onToggle={onToggle} />)
        )}

        {done.length > 0 && (
          <Box>
            <Button
              mode="bleed"
              fontSize={1}
              text={showDone ? 'Ocultar entregadas' : `Ver ${done.length} entregada${done.length === 1 ? '' : 's'}`}
              onClick={() => setShowDone((v) => !v)}
            />
          </Box>
        )}
      </Stack>
    </Section>
  );
}

export function FulfillmentPanel({ orders, onChange }: { orders: ReportOrder[]; onChange: (order: ReportOrder) => void }) {
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const { despacho, retiro } = fulfillmentQueues(orders);

  const toggle = async (order: ReportOrder, done: boolean) => {
    const fulfilledAt = done ? new Date().toISOString() : undefined;
    onChange({ ...order, fulfilledAt }); // optimista

    try {
      const patch = client.patch(order._id);
      await (done ? patch.set({ fulfilledAt }) : patch.unset(['fulfilledAt'])).commit();
    } catch (error) {
      onChange(order); // revertir
      toast.push({
        status: 'error',
        title: 'No se pudo guardar',
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  return (
    <Stack space={4}>
      <Queue
        title="Por despachar"
        subtitle="Órdenes pagadas con despacho a domicilio, de la más antigua a la más reciente."
        orders={despacho}
        onToggle={toggle}
      />
      <Queue
        title="Por retirar en tienda"
        subtitle="Órdenes pagadas con retiro, de la más antigua a la más reciente."
        orders={retiro}
        onToggle={toggle}
      />
    </Stack>
  );
}
