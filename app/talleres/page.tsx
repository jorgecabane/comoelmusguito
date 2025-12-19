/**
 * Página: Catálogo de Talleres Presenciales
 * Datos desde Sanity CMS
 */

import { Card, Badge, Button } from '@/components/ui';
import { Calendar, MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import { getAllWorkshops } from '@/lib/sanity/fetch';
import { getFirstImage, formatPrice, formatDateShort, getSlugString, levelLabels } from '@/lib/sanity/utils';
import Link from 'next/link';
import { Breadcrumb } from '@/components/shared/Breadcrumb';

export const revalidate = 60;

export const metadata = {
  title: 'Talleres Presenciales',
  description:
    'Aprende a crear terrarios en persona. Talleres prácticos en Santiago donde crearás tu propio terrario mientras aprendes las técnicas directamente.',
};

export default async function TalleresPage() {
  const talleres = await getAllWorkshops();

  // Calcular próximas fechas disponibles por taller
  const talleresConFechas = talleres.map((taller) => {
    const proximasFechas = taller.dates
      ?.filter((date) => {
        const fechaTaller = new Date(date.date);
        return fechaTaller > new Date() && date.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    // Verificar si hay alguna fecha futura con cupos disponibles
    const hayCuposDisponibles = proximasFechas?.some((f) => f.status !== 'sold_out') || false;

    return {
      ...taller,
      proximasFechas: proximasFechas || [],
      hayCuposDisponibles,
    };
  });

  return (
    <div className="pt-32 pb-16">
      <Breadcrumb items={[{ label: 'Talleres Presenciales' }]} />
      {/* Header */}
      <section className="container mb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-forest mb-6">
            Talleres Presenciales
          </h1>
          <p className="text-xl text-gray leading-relaxed">
            Experiencias prácticas donde aprenderás a crear terrarios con las manos en la masa.
            Cada taller incluye todos los materiales y te llevas tu terrario a casa.
          </p>
        </div>
      </section>

      {/* Beneficios */}
      <section className="container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Users className="text-musgo" size={32} />,
              title: 'Grupos Reducidos',
              description: 'Máximo 8 personas para atención personalizada',
            },
            {
              icon: <Calendar className="text-musgo" size={32} />,
              title: 'Materiales Incluidos',
              description: 'Todo lo necesario para crear tu terrario',
            },
            {
              icon: <MapPin className="text-musgo" size={32} />,
              title: 'En Santiago',
              description: 'Taller de Tomás en el corazón de la ciudad',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-cream p-6 rounded-lg text-center space-y-3"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vida/20">
                {item.icon}
              </div>
              <h3 className="font-display text-xl font-semibold text-forest">
                {item.title}
              </h3>
              <p className="text-gray">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mensaje si no hay talleres */}
      {talleres.length === 0 ? (
        <section className="container">
          <div className="bg-cream/50 rounded-2xl p-12 text-center">
            <p className="text-xl text-gray mb-6">
              Estamos organizando nuevos talleres. Vuelve pronto o inscríbete en un curso online 🌱
            </p>
            <Link href="/cursos">
              <Button variant="primary">Ver Cursos Online</Button>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Grid de Talleres */}
          <section className="container">
            <h2 className="font-display text-3xl font-semibold text-forest mb-8">
              Próximos Talleres
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {talleresConFechas.map((taller) => {
                const slug = getSlugString(taller.slug);
                const imageUrl = getFirstImage(taller.images, { width: 800 });
                const levelLabel = taller.level && taller.level !== 'all' ? levelLabels[taller.level] : 'Todos los Niveles';
                const proximaFecha = taller.proximasFechas[0];
                
                // Buscar la primera fecha con cupos disponibles (no agotada)
                const fechaConCupos = taller.proximasFechas.find((f) => f.status !== 'sold_out');
                // Si no hay ninguna con cupos, usar la primera fecha (que estará agotada)
                const fechaParaBadge = fechaConCupos || proximaFecha;

                return (
                  <Link key={taller._id} href={`/talleres/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      <Card.Image 
                        src={imageUrl} 
                        alt={taller.images?.[0]?.alt || taller.name} 
                      />
                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <Card.Content>
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            {fechaParaBadge ? (
                              <Badge
                                variant={
                                  fechaParaBadge.status === 'available'
                                    ? 'success'
                                    : fechaParaBadge.status === 'limited'
                                    ? 'warning'
                                    : 'error'
                                }
                                size="sm"
                              >
                                {fechaParaBadge.status === 'sold_out'
                                  ? 'Agotado'
                                  : `${fechaParaBadge.spotsAvailable} ${fechaParaBadge.spotsAvailable === 1 ? 'cupo' : 'cupos'}`}
                              </Badge>
                            ) : (
                              <Badge variant="default" size="sm">
                                Sin fechas
                              </Badge>
                            )}
                            <span className="text-xs text-gray uppercase tracking-wide">
                              {levelLabel}
                            </span>
                          </div>

                          <Card.Title as="h2">{taller.name}</Card.Title>
                          <Card.Description>
                            {taller.description.slice(0, 100)}...
                          </Card.Description>

                          {/* Próxima fecha */}
                          {proximaFecha && (
                            <div className="flex items-center gap-2 text-sm text-gray pt-3">
                              <Calendar size={16} className="text-musgo" />
                              <span>{formatDateShort(proximaFecha.date)}</span>
                            </div>
                          )}

                          {/* Ubicación */}
                          <div className="flex items-center gap-2 text-sm text-gray pt-2">
                            <MapPin size={16} className="text-musgo" />
                            <span>{taller.location.city}</span>
                          </div>

                          {/* Duración */}
                          <div className="flex items-center gap-2 text-sm text-gray pt-2">
                            <Clock size={16} className="text-musgo" />
                            <span>{taller.duration}h</span>
                          </div>

                          <div className="flex items-center justify-between pt-4 mt-auto">
                            <div className="text-2xl font-display font-bold text-forest">
                              {formatPrice(taller.price, taller.currency)}
                            </div>
                          </div>
                        </Card.Content>
                        <Card.Footer>
                          <Button
                            variant="primary"
                            className="w-full group-hover:bg-musgo-dark transition-colors"
                            disabled={!taller.hayCuposDisponibles}
                          >
                            {!taller.hayCuposDisponibles ? 'Agotado' : 'Ver Detalles'}
                            {taller.hayCuposDisponibles && <ArrowRight size={18} />}
                          </Button>
                        </Card.Footer>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* CTA - Cursos Online */}
          <section className="container mt-24">
            <div className="bg-gradient-to-br from-vida/10 to-musgo/10 rounded-2xl p-12 text-center">
              <h2 className="font-display text-3xl font-semibold text-forest mb-4">
                ¿No puedes venir en persona?
              </h2>
              <p className="text-gray mb-6 max-w-2xl mx-auto">
                Aprende desde cualquier lugar con nuestros cursos online
                y más de 9 horas de contenido educativo.
              </p>
              <Link href="/cursos">
                <Button variant="primary" size="lg">
                  Ver Cursos Online
                </Button>
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

