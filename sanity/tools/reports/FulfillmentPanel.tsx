/**
 * Panel de entregas: cola de despachos y de retiros en tienda, lado a lado.
 *
 * Sólo aparecen órdenes pagadas con productos físicos. Cursos quedan fuera
 * (acceso instantáneo) y talleres también (se entregan presencialmente).
 * Ninguna orden se asume entregada por antigüedad: el check es manual.
 */

import { useState } from 'react';
import { Badge, Box, Card, Checkbox, Flex, Stack, Text, useToast } from '@sanity/ui';
import { useClient } from 'sanity';
import { Accordion, Columns, formatCLP, formatDate, formatDateTime, Section, Toggle } from './components';
import { fulfillmentQueues, saleDate, type ItemType, type ReportOrder } from './data';

const PHYSICAL = new Set<ItemType>(['terrarium', 'supply']);

const STATUS_LABEL: Record<number, string> = {
  1: 'Pendiente',
  2: 'Pagada',
  3: 'Rechazada',
  4: 'Anulada',
  5: 'Reembolsada',
};

function Detail({ label, value }: { label: string; value?: string | number | boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <Flex gap={2}>
      <Box style={{ minWidth: 130 }}>
        <Text size={0} muted>
          {label}
        </Text>
      </Box>
      <Text size={0}>{typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}</Text>
    </Flex>
  );
}

function OrderDetail({ order }: { order: ReportOrder }) {
  const address = order.shippingAddress;

  return (
    <Stack space={2}>
      <Detail label="Orden" value={order.orderId} />
      <Detail label="Estado" value={STATUS_LABEL[order.paymentStatus ?? 0]} />
      <Detail label="Creada" value={order.createdAt ? formatDateTime(order.createdAt) : undefined} />
      <Detail label="Pagada" value={order.paymentDate ? formatDateTime(order.paymentDate) : 'sin fecha registrada'} />
      <Detail label="Pasarela" value={order.paymentProvider} />
      <Detail label="ID transacción" value={order.providerTransactionId} />
      <Detail label="Cliente" value={order.customerName} />
      <Detail label="Email" value={order.customerEmail} />
      <Detail label="Email enviado" value={order.emailSent} />
      <Detail label="Es regalo" value={order.isGift} />
      <Detail label="Destinatario" value={order.recipientName} />
      <Detail label="Email destinatario" value={order.recipientEmail} />
      <Detail label="Mensaje" value={order.giftMessage} />
      <Detail label="Requiere despacho" value={order.requiresShipping} />
      {address && (
        <>
          <Detail
            label="Dirección"
            value={[address.address, address.number, address.details].filter(Boolean).join(' ')}
          />
          <Detail label="Comuna / región" value={[address.comuna, address.region].filter(Boolean).join(', ')} />
          <Detail label="Teléfono" value={address.phone} />
          <Detail label="RUT" value={address.rut} />
          <Detail label="Email de contacto" value={address.contactEmail} />
        </>
      )}

      <Box paddingTop={2}>
        <Text size={0} muted>
          Productos
        </Text>
      </Box>
      {(order.items ?? []).map((item, i) => (
        <Text key={`${item.id}-${i}`} size={0}>
          {item.name} ×{item.quantity ?? 1} · {formatCLP(item.price ?? 0)} {item.currency ?? 'CLP'}
          {item.selectedDate?.date ? ` · ${formatDateTime(item.selectedDate.date)}` : ''}
        </Text>
      ))}

      <Box paddingTop={2}>
        <Text size={0}>
          <a href={`/studio/intent/edit/id=${order._id};type=order/`} style={{ color: 'inherit' }}>
            Abrir la orden completa en el Studio →
          </a>
        </Text>
      </Box>
    </Stack>
  );
}

function OrderRow({ order, onToggle }: { order: ReportOrder; onToggle: (order: ReportOrder, done: boolean) => void }) {
  const date = saleDate(order);
  const physical = (order.items ?? []).filter((i) => PHYSICAL.has((i.type ?? '') as ItemType));
  const done = Boolean(order.fulfilledAt);

  return (
    <Card padding={2} radius={2} border tone={done ? 'positive' : 'default'}>
      <Flex gap={3} align="flex-start">
        <Box paddingTop={2}>
          <Checkbox
            checked={done}
            onChange={(event) => onToggle(order, event.currentTarget.checked)}
            aria-label={`Marcar orden ${order.orderId ?? ''} como entregada`}
          />
        </Box>

        <Box flex={1}>
          <Accordion
            summary={
              <Stack space={2} paddingY={1} style={{ display: 'inline-block', width: 'calc(100% - 24px)' }}>
                <Flex gap={2} align="center" wrap="wrap">
                  <Text size={1} weight="semibold">
                    {order.customerName || order.customerEmail || 'Sin nombre'}
                  </Text>
                  <Badge tone={done ? 'positive' : 'caution'} fontSize={0}>
                    {done ? 'Entregada' : 'Pendiente'}
                  </Badge>
                  <Text size={0} muted>
                    {date ? formatDate(date) : 's/f'} · {formatCLP(order.total ?? 0)}
                  </Text>
                </Flex>
                <Text size={0} muted textOverflow="ellipsis">
                  {physical.map((i) => `${i.name} ×${i.quantity ?? 1}`).join(' · ')}
                  {order.shippingAddress?.comuna ? ` — ${order.shippingAddress.comuna}` : ''}
                </Text>
              </Stack>
            }
          >
            <OrderDetail order={order} />
          </Accordion>

          {done && order.fulfilledAt && (
            <Text size={0} muted>
              Marcada el {formatDateTime(order.fulfilledAt)}
            </Text>
          )}
        </Box>
      </Flex>
    </Card>
  );
}

function Queue({
  title,
  orders,
  view,
  onToggle,
}: {
  title: string;
  orders: ReportOrder[];
  view: 'pendientes' | 'historicas';
  onToggle: (order: ReportOrder, done: boolean) => void;
}) {
  const pending = orders.filter((o) => !o.fulfilledAt);
  const visible = view === 'pendientes' ? pending : orders.filter((o) => o.fulfilledAt);

  return (
    <Section
      title={`${title} (${visible.length})`}
      subtitle={view === 'pendientes' ? 'De la más antigua a la más reciente.' : 'Ya entregadas, en el mismo orden.'}
    >
      <Stack space={2}>
        {visible.length === 0 ? (
          <Text size={1} muted>
            {view === 'pendientes' ? 'Nada pendiente. 🎉' : 'Nada entregado todavía en este rango.'}
          </Text>
        ) : (
          visible.map((order) => <OrderRow key={order._id} order={order} onToggle={onToggle} />)
        )}
      </Stack>
    </Section>
  );
}

export function FulfillmentPanel({
  orders,
  months,
  now,
  onChange,
}: {
  orders: ReportOrder[];
  months: number | null;
  now: Date;
  onChange: (order: ReportOrder) => void;
}) {
  const client = useClient({ apiVersion: '2024-01-01' });
  const toast = useToast();
  const [view, setView] = useState<'pendientes' | 'historicas'>('pendientes');
  const { despacho, retiro, hiddenPending } = fulfillmentQueues(orders, months, now);

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
    <Stack space={3}>
      <Flex justify="space-between" align="center" gap={3} wrap="wrap">
        <Toggle
          value={view}
          onChange={setView}
          options={[
            { id: 'pendientes', label: 'Pendientes' },
            { id: 'historicas', label: 'Históricas' },
          ]}
        />
        {hiddenPending > 0 && view === 'pendientes' && (
          <Card padding={2} radius={2} tone="caution">
            <Text size={0}>
              {hiddenPending} entrega{hiddenPending === 1 ? '' : 's'} pendiente{hiddenPending === 1 ? '' : 's'} queda
              {hiddenPending === 1 ? '' : 'n'} fuera de este rango de fechas.
            </Text>
          </Card>
        )}
      </Flex>

      <Columns min={380}>
        <Queue title="Por despachar" orders={despacho} view={view} onToggle={toggle} />
        <Queue title="Retiro en tienda" orders={retiro} view={view} onToggle={toggle} />
      </Columns>
    </Stack>
  );
}
