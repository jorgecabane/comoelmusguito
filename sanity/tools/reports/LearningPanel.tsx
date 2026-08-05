/**
 * Panel de cursos y talleres, lado a lado.
 * Cursos: quién tiene acceso, cuánto lleva y en qué lección va.
 * Talleres: sesiones futuras o pasadas con sus inscritos.
 */

import { useState } from 'react';
import { Badge, Box, Card, Flex, Stack, Text } from '@sanity/ui';
import { Accordion, Columns, formatDate, formatDateTime, Kpi, Section, Swatch, Toggle, usePalette } from './components';
import { courseStats, workshopSessions, type CoursePerson, type ReportData, type WorkshopSession } from './data';

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <Box style={{ height: 6, borderRadius: 3, background: 'currentColor', opacity: 0.15, flex: 1, minWidth: 60 }}>
      <Box style={{ width: `${percent}%`, height: 6, borderRadius: 3, background: color, opacity: 1 }} />
    </Box>
  );
}

function PersonRow({ person, color }: { person: CoursePerson; color: string }) {
  return (
    <Stack space={2} paddingY={2}>
      <Flex gap={3} align="center" justify="space-between">
        <Text size={1} textOverflow="ellipsis">
          {person.name}
        </Text>
        <Flex gap={2} align="center" style={{ minWidth: 140 }}>
          <ProgressBar percent={person.percent} color={color} />
          <Text size={0} weight="medium" style={{ whiteSpace: 'nowrap' }}>
            {person.percent}%
          </Text>
        </Flex>
      </Flex>
      <Text size={0} muted textOverflow="ellipsis">
        {person.total > 0 ? `${person.completed}/${person.total} lecciones` : 'curso sin lecciones'}
        {person.position ? ` · va en ${person.position}` : ' · no ha empezado'}
        {person.lastWatchedAt ? ` · ${formatDate(person.lastWatchedAt)}` : ''}
      </Text>
    </Stack>
  );
}

function WorkshopCard({ session, color }: { session: WorkshopSession; color: string }) {
  const full = session.spotsTotal !== undefined && session.enrolled >= session.spotsTotal;

  return (
    <Card padding={2} radius={2} border>
      <Accordion
        summary={
          <Stack space={3}>
            <Flex gap={2} align="center" wrap="wrap">
              <Text size={1} weight="semibold">
                {session.workshop}
              </Text>
              <Badge tone={full ? 'critical' : session.enrolled > 0 ? 'positive' : 'default'} fontSize={0}>
                {session.enrolled}
                {session.spotsTotal !== undefined ? `/${session.spotsTotal}` : ''} inscrito
                {session.enrolled === 1 ? '' : 's'}
              </Badge>
            </Flex>
            <Text size={1} muted>
              {formatDateTime(session.date)}
            </Text>
          </Stack>
        }
      >
        <Stack space={2}>
          {session.attendees.length === 0 ? (
            <Text size={0} muted>
              Sin inscritos.
            </Text>
          ) : (
            session.attendees.map((a, i) => (
              <Flex key={`${a.email}-${i}`} gap={2} align="center">
                <Swatch color={color} />
                <Text size={1}>
                  {a.name}
                  {a.quantity > 1 ? ` ×${a.quantity}` : ''} <span style={{ opacity: 0.6 }}>{a.email}</span>
                </Text>
              </Flex>
            ))
          )}
        </Stack>
      </Accordion>
    </Card>
  );
}

export function LearningPanel({
  data,
  months,
  now,
}: {
  data: ReportData;
  months: number | null;
  now: Date;
}) {
  const palette = usePalette();
  const [when, setWhen] = useState<'futuros' | 'historicos'>('futuros');
  const courses = courseStats(data, months, now);
  const { upcoming, past } = workshopSessions(data, now, months);
  const sessions = when === 'futuros' ? upcoming : past;
  const missingAccess = courses.purchases - courses.courses.reduce((n, c) => n + c.people.length, 0);

  return (
    <Stack space={3}>
      <Columns min={180}>
        <Kpi
          label="Personas con cursos"
          value={String(courses.totalPeopleAllTime)}
          hint={`histórico · ${courses.newAccess} con acceso nuevo en el período`}
          accent={palette.forType('course')}
        />
        <Kpi
          label="Activas en el período"
          value={String(courses.totalPeople)}
          hint={`${courses.started} con lecciones completadas`}
        />
        <Kpi label="Cursos comprados" value={String(courses.purchases)} hint="en órdenes pagadas del período" />
        <Kpi
          label="Talleres próximos"
          value={String(upcoming.length)}
          hint={`${upcoming.reduce((n, s) => n + s.enrolled, 0)} inscritos en total`}
          accent={palette.forType('workshop')}
        />
      </Columns>

      <Columns min={380}>
        <Stack space={3}>
          {courses.courses.length === 0 && (
            <Section title="Cursos" subtitle="Personas con acceso nuevo o actividad en el período.">
              <Text size={1} muted>
                Nadie compró ni avanzó en un curso en este rango de fechas.
              </Text>
            </Section>
          )}

          {courses.courses.map((course) => (
            <Section
              key={course.name}
              title={`${course.name} · ${course.people.length}`}
              subtitle={
                missingAccess > 0
                  ? `Con acceso nuevo o actividad en el período. Ojo: ${missingAccess} compra(s) sin acceso asociado.`
                  : 'Con acceso nuevo o actividad en el período, ordenadas por avance.'
              }
            >
              <Stack space={1}>
                {course.people.map((person) => (
                  <PersonRow key={person.id} person={person} color={palette.forType('course')} />
                ))}
              </Stack>
            </Section>
          ))}
        </Stack>

        <Section
          title={when === 'futuros' ? `Talleres próximos (${sessions.length})` : `Talleres pasados (${sessions.length})`}
          subtitle="Inscritos calculados desde las órdenes pagadas."
          actions={
            <Toggle
              value={when}
              onChange={setWhen}
              options={[
                { id: 'futuros', label: 'Futuros' },
                { id: 'historicos', label: 'Históricos' },
              ]}
            />
          }
        >
          <Stack space={2}>
            {sessions.length === 0 ? (
              <Text size={1} muted>
                {when === 'futuros' ? 'No hay fechas futuras publicadas.' : 'No hay talleres pasados.'}
              </Text>
            ) : (
              sessions.map((session) => (
                <WorkshopCard
                  key={`${session.workshopId}-${session.date}`}
                  session={session}
                  color={palette.forType('workshop')}
                />
              ))
            )}
          </Stack>
        </Section>
      </Columns>
    </Stack>
  );
}
