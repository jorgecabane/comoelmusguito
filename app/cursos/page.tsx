/**
 * Página: Catálogo de Cursos Online
 * Datos desde Sanity CMS
 */

import { Card, Badge, Button } from '@/components/ui';
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { getAllCourses } from '@/lib/sanity/fetch';
import { getImageUrl, formatPriceWithSale, getSlugString, levelLabels, getCoursePrice } from '@/lib/sanity/utils';
import { getUserCurrency } from '@/lib/utils/geolocation';
import Link from 'next/link';

export const revalidate = 60;
// Forzar renderizado dinámico porque usamos geolocalización
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Cursos Online de Terrarios',
  description:
    'Aprende a crear terrarios autosustentables con cursos online completos. A tu ritmo, desde cualquier lugar del mundo.',
};

export default async function CursosPage() {
  const cursos = await getAllCourses();
  const userCurrency = await getUserCurrency();

  return (
    <div className="pt-32 pb-16">
      {/* Header */}
      <section className="container mb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-forest mb-6">
            Aprende a Crear Terrarios
          </h1>
          <p className="text-xl text-gray leading-relaxed">
            Cursos online completos donde aprenderás desde lo básico hasta técnicas avanzadas.
            Acceso de por vida, aprende a tu propio ritmo desde cualquier parte del mundo.
          </p>
        </div>
      </section>

      {/* Beneficios */}
      <section className="container mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Play className="text-musgo" size={32} />,
              title: 'Acceso de por Vida',
              description: 'Una vez comprado, es tuyo para siempre',
            },
            {
              icon: <Clock className="text-musgo" size={32} />,
              title: 'A tu Ritmo',
              description: 'Aprende cuando quieras, donde quieras',
            },
            {
              icon: <BookOpen className="text-musgo" size={32} />,
              title: 'Material Descargable',
              description: 'PDFs, listas de materiales y recursos',
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

      {/* Mensaje si no hay cursos */}
      {cursos.length === 0 ? (
        <section className="container">
          <div className="bg-cream/50 rounded-2xl p-12 text-center">
            <p className="text-xl text-gray mb-6">
              Estamos preparando nuevos cursos. Vuelve pronto 🌱
            </p>
            <Link href="/terrarios">
              <Button variant="primary">Ver Terrarios</Button>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Grid de Cursos */}
          <section className="container">
            <h2 className="font-display text-3xl font-semibold text-forest mb-8">
              Todos los Cursos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {cursos.map((course) => {
                const slug = getSlugString(course.slug);
                const imageUrl = getImageUrl(course.thumbnail, { width: 1200, height: 675 });
                const levelLabel = course.level ? levelLabels[course.level] : 'Todos';
                const coursePricing = getCoursePrice(course, userCurrency);
                const pricing = formatPriceWithSale(
                  coursePricing.price,
                  coursePricing.salePrice,
                  coursePricing.currency
                );

                return (
                  <Link key={course._id} href={`/cursos/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      <div className="relative aspect-video overflow-hidden rounded-t-lg">
                        <Card.Image 
                          src={imageUrl} 
                          alt={course.thumbnail?.alt || course.name} 
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-forest/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="text-musgo ml-1" size={28} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <Card.Content>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="info" size="sm">{levelLabel}</Badge>
                            <span className="text-sm text-gray">
                              {course.lessonCount} lecciones • {course.duration}h
                            </span>
                          </div>
                          <Card.Title as="h2">{course.name}</Card.Title>
                          <Card.Description>{course.shortDescription}</Card.Description>

                          <div className="space-y-1 pt-3 mt-auto">
                            <div className="text-2xl font-display font-bold text-forest">
                              {pricing.current}
                            </div>
                            {pricing.hasDiscount && pricing.original && (
                              <div className="text-sm text-gray line-through">
                                {pricing.original}
                              </div>
                            )}
                          </div>
                        </Card.Content>
                        <Card.Footer>
                          <Button variant="primary" className="w-full group-hover:bg-musgo-dark transition-colors">
                            Comenzar mi Viaje
                            <ArrowRight size={18} />
                          </Button>
                        </Card.Footer>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* CTA - Talleres Presenciales */}
          <section className="container mt-24">
            <div className="bg-gradient-to-br from-musgo to-vida text-white rounded-2xl p-12 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-semibold mb-4">
                ¿Prefieres Aprender en Persona?
              </h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto text-lg">
                Ofrecemos talleres presenciales en Santiago donde crearás tu propio
                terrario, aprendiendo la teoría a través de la práctica.
              </p>
              <Link href="/talleres">
                <Button
                  variant="secondary"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-musgo"
                >
                  Ver Próximos Talleres
                </Button>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="container mt-24">
            <h2 className="font-display text-3xl font-semibold text-forest mb-8 text-center">
              Preguntas Frecuentes
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: '¿Necesito experiencia previa?',
                  a: 'No, nuestros cursos están diseñados para principiantes. Partimos desde cero.',
                },
                {
                  q: '¿Cuánto tiempo tengo acceso?',
                  a: 'Acceso de por vida. Una vez comprado, el curso es tuyo para siempre.',
                },
                {
                  q: '¿Qué necesito para empezar?',
                  a: 'Cada curso incluye una lista detallada de materiales. La mayoría son fáciles de conseguir.',
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="bg-cream p-6 rounded-lg cursor-pointer group"
                >
                  <summary className="font-display text-lg font-semibold text-forest list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-musgo">+</span>
                  </summary>
                  <p className="text-gray mt-4 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
