/**
 * Página: Detalle de Taller
 * Datos desde Sanity CMS
 */

import { getWorkshopBySlug, getAllWorkshops } from '@/lib/sanity/fetch';
import { getImageUrl, levelLabels, getFirstImage } from '@/lib/sanity/utils';
import { Badge, Button } from '@/components/ui';
import { MapPin, Clock, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { WorkshopDetail } from '@/components/product/WorkshopDetail';

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

          {/* Sidebar - Reserva (Cliente Component) */}
          <div className="lg:col-span-1">
            <WorkshopDetail workshop={taller} />
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

