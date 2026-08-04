/**
 * Panel de cursos y talleres: quién tiene acceso a qué y quién viene al próximo taller.
 */

import { useState } from 'react';
import { Badge, Box, Button, Card, Flex, Stack, Text } from '@sanity/ui';
import { BarList, formatDateTime, Kpi, Section } from './components';
import { courseStats, upcomingWorkshops, type ReportData } from './data';

function WorkshopCard({ row }: { row: ReturnType<typeof upcomingWorkshops>[number] }) {
  const [open, setOpen] = useState(false);
  const full = row.spotsTotal !== undefined && row.enrolled >= row.spotsTotal;

  return (
    <Card padding={3} radius={2} border>
      <Stack space={3}>
        <Flex gap={2} align="center" wrap="wrap">
          <Text size={1} weight="semibold">
            {row.workshop}
          </Text>
          <Badge tone={full ? 'critical' : row.enrolled > 0 ? 'positive' : 'default'} fontSize={0}>
            {row.enrolled}
            {row.spotsTotal !== undefined ? `/${row.spotsTotal}` : ''} inscrito{row.enrolled === 1 ? '' : 's'}
          </Badge>
          <Text size={0} muted>
            {formatDateTime(row.date)}
          </Text>
        </Flex>

        {row.attendees.length > 0 && (
          <Box>
            <Button
              mode="bleed"
              fontSize={1}
              text={open ? 'Ocultar inscritos' : 'Ver inscritos'}
              onClick={() => setOpen((v) => !v)}
            />
          </Box>
        )}

        {open &&
          row.attendees.map((a, i) => (
            <Text key={`${a.email}-${i}`} size={1}>
              {a.name} {a.quantity > 1 ? `×${a.quantity} ` : ''}
              <span style={{ opacity: 0.6 }}>{a.email}</span>
            </Text>
          ))}
      </Stack>
    </Card>
  );
}

export function LearningPanel({ data, now }: { data: ReportData; now: Date }) {
  const courses = courseStats(data);
  const workshops = upcomingWorkshops(data, now);
  const mismatch = courses.purchases - courses.byCourse.reduce((n, c) => n + c.people, 0);

  return (
    <Stack space={4}>
      <Flex gap={3} wrap="wrap">
        <Kpi label="Personas con cursos" value={String(courses.totalPeople)} hint="con acceso activo" />
        <Kpi label="Cursos comprados" value={String(courses.purchases)} hint="en órdenes pagadas" />
        <Kpi label="Talleres próximos" value={String(workshops.length)} hint="fechas futuras no canceladas" />
      </Flex>

      <Section
        title="Personas por curso"
        subtitle={
          mismatch > 0
            ? `Hay ${mismatch} compra(s) de curso sin acceso asociado — probablemente invitados que no se han registrado.`
            : 'Accesos activos por curso.'
        }
      >
        <BarList
          rows={courses.byCourse.map((c) => ({
            label: c.name,
            value: c.people,
            display: `${c.people} ${c.people === 1 ? 'persona' : 'personas'}`,
          }))}
          emptyLabel="Todavía no hay accesos a cursos."
        />
      </Section>

      <Section title="Talleres próximos" subtitle="Inscritos por fecha, calculados desde las órdenes pagadas.">
        <Stack space={3}>
          {workshops.length === 0 ? (
            <Text size={1} muted>
              No hay fechas futuras publicadas.
            </Text>
          ) : (
            workshops.map((row) => <WorkshopCard key={`${row.workshop}-${row.date}`} row={row} />)
          )}
        </Stack>
      </Section>
    </Stack>
  );
}
