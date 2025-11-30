/**
 * Página: Detalle de Taller
 * Datos desde Sanity CMS
 */

import { getWorkshopBySlug, getAllWorkshops } from '@/lib/sanity/fetch';
import { getImageUrl, formatPrice, formatDate, levelLabels, getFirstImage } from '@/lib/sanity/utils';
import { Badge, Button } from '@/components/ui';
import { Calendar, MapPin, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

interface WorkshopPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all workshops
export async function generateStaticParams() {
  const talleres = await getAllWorkshops();
  return talleres.map((taller) => ({
    slug: taller.slug.current,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: WorkshopPageProps) {
  const { slug } = await params;
  const taller = await getWorkshopBySlug(slug);

  if (!taller) {
    return {
      title: 'Taller no encontrado',
    };
  }

  return {
    title: taller.seo?.metaTitle || taller.name,
    description: taller.seo?.metaDescription || taller.description,
  };
}

export default async function WorkshopPage({ params }: WorkshopPageProps) {
  const { slug } = await params;
  const taller = await getWorkshopBySlug(slug);

  if (!taller) {
    notFound();
  }

  const levelLabel = taller.level && taller.level !== 'all' ? levelLabels[taller.level] : 'Todos los Niveles';

  // Filtrar fechas futuras y disponibles
  const fechasDisponibles = taller.dates
    ?.filter((date) => {
      const fechaTaller = new Date(date.date);
      return fechaTaller > new Date() && date.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const hayCuposDisponibles = fechasDisponibles?.some((f) => f.status !== 'sold_out');

  return (
    <div className="pt-32 pb-16">
      {/* Breadcrumb */}
      <div className="container mb-8">
        <div className="flex items-center gap-2 text-sm text-gray">
          <Link href="/" className="hover:text-musgo transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/talleres" className="hover:text-musgo transition-colors">
            Talleres
          </Link>
          <span>/</span>
          <span className="text-forest">{taller.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <section className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Info Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="info">{levelLabel}</Badge>
                {!hayCuposDisponibles && (
                  <Badge variant="error">Fechas Agotadas</Badge>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
                {taller.name}
              </h1>
              <p className="text-xl text-gray leading-relaxed">
                {taller.description}
              </p>
            </div>

            {/* Image */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-cream">
              <Image
                src={getFirstImage(taller.images, { width: 1200, height: 675 })}
                alt={taller.images?.[0]?.alt || taller.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>

            {/* Qué Aprenderás */}
            {taller.learningOutcomes && taller.learningOutcomes.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest mb-6">
                  ¿Qué Aprenderás?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {taller.learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="text-vida shrink-0 mt-1" size={20} />
                      <span className="text-gray">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qué Incluye */}
            {taller.includes && taller.includes.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest mb-6">
                  Qué Incluye
                </h2>
                <div className="bg-cream rounded-xl p-6">
                  <ul className="space-y-3">
                    {taller.includes.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="text-vida shrink-0 mt-1" size={18} />
                        <span className="text-gray">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Requisitos */}
            {taller.requirements && taller.requirements.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest mb-6">
                  Requisitos
                </h2>
                <ul className="space-y-2">
                  {taller.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray">
                      <span className="text-musgo mt-1">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Política de Cancelación */}
            {taller.cancellationPolicy && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-forest mb-4">
                  Política de Cancelación
                </h2>
                <div className="bg-cream rounded-xl p-6">
                  <p className="text-gray">{taller.cancellationPolicy}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Reserva */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Info Card */}
              <div className="bg-white border border-gray/20 rounded-2xl p-6 space-y-6">
                <div>
                  <div className="text-3xl font-display font-bold text-forest mb-2">
                    {formatPrice(taller.price, taller.currency)}
                  </div>
                  <p className="text-sm text-gray">por persona</p>
                </div>

                {/* Detalles */}
                <div className="space-y-4 py-4 border-t border-b border-gray/20">
                  <div className="flex items-center gap-3">
                    <Clock className="text-musgo shrink-0" size={20} />
                    <span className="text-gray">{taller.duration} horas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-musgo shrink-0 mt-1" size={20} />
                    <div className="text-gray text-sm">
                      <div className="font-semibold">{taller.location.venue}</div>
                      <div>{taller.location.address}</div>
                      <div>{taller.location.city}, {taller.location.region}</div>
                    </div>
                  </div>
                </div>

                {/* Fechas Disponibles */}
                <div>
                  <h3 className="font-display text-lg font-semibold text-forest mb-4">
                    Fechas Disponibles
                  </h3>
                  {fechasDisponibles && fechasDisponibles.length > 0 ? (
                    <div className="space-y-3">
                      {fechasDisponibles.map((fecha, index) => (
                        <div
                          key={index}
                          className="border border-gray/20 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray mb-1">
                              <Calendar size={14} className="text-musgo" />
                              <span className="font-semibold text-forest">
                                {new Date(fecha.date).toLocaleDateString('es-CL', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-gray">
                              {new Date(fecha.date).toLocaleTimeString('es-CL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                          <Badge
                            variant={
                              fecha.status === 'available'
                                ? 'success'
                                : fecha.status === 'limited'
                                ? 'warning'
                                : 'error'
                            }
                            size="sm"
                          >
                            {fecha.status === 'sold_out'
                              ? 'Agotado'
                              : `${fecha.spotsAvailable} cupos`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray">
                      <p className="mb-2">Sin fechas disponibles</p>
                      <p className="text-sm">Estamos organizando nuevas fechas pronto</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={<Calendar size={20} />}
                  disabled={!hayCuposDisponibles}
                >
                  {hayCuposDisponibles ? 'Reservar Cupo' : 'Sin Cupos'}
                </Button>

                <p className="text-xs text-gray text-center">
                  Al reservar, aceptas nuestra política de cancelación
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back to catalog */}
      <section className="container mt-16">
        <Link href="/talleres">
          <Button variant="secondary">← Ver todos los talleres</Button>
        </Link>
      </section>
    </div>
  );
}

