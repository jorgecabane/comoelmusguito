/**
 * Workshops Section - Talleres Presenciales
 * Experiencias prácticas en persona
 */

'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, Badge, Button } from '@/components/ui';
import { Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Workshop } from '@/types/sanity';
import { getFirstImage, formatPrice, getSlugString, levelLabels, formatDateShort } from '@/lib/sanity/utils';

interface WorkshopsSectionProps {
  workshops: Workshop[];
}

export function WorkshopsSection({ workshops }: WorkshopsSectionProps) {
  if (!workshops || workshops.length === 0) {
    return null;
  }

  return (
    <section className="py-32 bg-gradient-to-br from-white to-cream">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <FadeIn>
            <div className="inline-flex items-center gap-3 bg-musgo/10 px-6 py-3 rounded-full mb-4">
              <Users className="text-musgo" size={24} />
              <span className="text-musgo font-semibold">Experiencias Presenciales</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest">
              Aprende con las
              <br />
              <span className="text-musgo">Manos en la Masa</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="text-xl text-gray max-w-2xl mx-auto">
              Talleres presenciales en Santiago donde crearás tu terrario mientras aprendes
              las técnicas directamente. Grupos reducidos para atención personalizada.
            </p>
          </FadeIn>
        </div>

        {/* Beneficios */}
        <StaggerContainer staggerDelay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Users size={24} />,
                title: 'Grupos Reducidos',
                description: 'Máximo 8 personas',
              },
              {
                icon: <Calendar size={24} />,
                title: 'Materiales Incluidos',
                description: 'Todo lo necesario',
              },
              {
                icon: <MapPin size={24} />,
                title: 'En Santiago',
                description: 'Taller en el corazón de la ciudad',
              },
            ].map((benefit, i) => (
              <StaggerItem key={i}>
                <div className="text-center p-8 rounded-xl bg-white shadow-natural-sm hover:shadow-natural-md transition-all">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-musgo/10 text-musgo mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-forest mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray">{benefit.description}</p>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Talleres */}
        <StaggerContainer staggerDelay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workshops.map((workshop) => {
              const slug = getSlugString(workshop.slug);
              const imageUrl = getFirstImage(workshop.images, { width: 800 });
              const levelLabel = workshop.level && workshop.level !== 'all' ? levelLabels[workshop.level] : 'Todos los Niveles';
              
              // Buscar la primera fecha disponible (no agotada)
              const primeraFechaDisponible = workshop.dates
                ?.filter((date) => {
                  const fechaTaller = new Date(date.date);
                  return fechaTaller > new Date() && date.status !== 'cancelled';
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .find((fecha) => fecha.status !== 'sold_out');
              
              // Si no hay fecha disponible, usar la primera fecha (que estará agotada)
              const proximaFecha = primeraFechaDisponible || workshop.dates
                ?.filter((date) => {
                  const fechaTaller = new Date(date.date);
                  return fechaTaller > new Date() && date.status !== 'cancelled';
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
              
              // Verificar si hay alguna fecha disponible
              const hayFechasDisponibles = workshop.dates?.some((date) => {
                const fechaTaller = new Date(date.date);
                return fechaTaller > new Date() && date.status !== 'cancelled' && date.status !== 'sold_out';
              }) ?? false;

              // Formatear texto de cupos (singular/plural)
              const cuposText = proximaFecha?.spotsAvailable === 1 
                ? '1 cupo' 
                : `${proximaFecha?.spotsAvailable || 0} cupos`;

              return (
                <StaggerItem key={workshop._id}>
                  <Link href={`/talleres/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      <Card.Image 
                        src={imageUrl} 
                        alt={workshop.images?.[0]?.alt || workshop.name} 
                      />
                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                          {proximaFecha ? (
                            <Badge
                              variant={
                                proximaFecha.status === 'available'
                                  ? 'success'
                                  : proximaFecha.status === 'limited'
                                  ? 'warning'
                                  : 'error'
                              }
                              size="sm"
                            >
                              {proximaFecha.status === 'sold_out'
                                ? 'Agotado'
                                : cuposText}
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

                        <div className="space-y-2">
                          <h3 className="font-display text-2xl font-semibold text-forest group-hover:text-musgo transition-colors">
                            {workshop.name}
                          </h3>
                          <p className="text-gray line-clamp-2">
                            {workshop.description}
                          </p>
                        </div>

                        {/* Próxima fecha */}
                        {proximaFecha && (
                          <div className="flex items-center gap-2 text-sm text-gray pt-2">
                            <Calendar size={16} className="text-musgo" />
                            <span>{formatDateShort(proximaFecha.date)}</span>
                          </div>
                        )}

                        {/* Ubicación y Duración */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 text-sm text-gray">
                            <MapPin size={16} className="text-musgo" />
                            <span>{workshop.location.city}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray">
                            <Clock size={16} className="text-musgo" />
                            <span>{workshop.duration}h</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray/20">
                          <div className="text-2xl font-display font-bold text-forest">
                            {formatPrice(workshop.price, workshop.currency)}
                          </div>
                          <Button
                            variant="ghost"
                            icon={<ArrowRight size={18} />}
                            className="text-musgo"
                            disabled={!hayFechasDisponibles}
                          >
                            {hayFechasDisponibles ? 'Ver Detalles' : 'Agotado'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </div>
        </StaggerContainer>

        {/* CTA */}
        <FadeIn delay={0.6}>
          <div className="text-center mt-16">
            <Link href="/talleres">
              <Button variant="secondary" size="lg">
                Ver Todos los Talleres
                <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
