/**
 * Learn Section - Cursos Online
 * Invitación a aprender, no a comprar
 */

'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, Badge, Button } from '@/components/ui';
import { Play, Clock, BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Course } from '@/types/sanity';
import { getImageUrl, formatPriceWithSale, getSlugString, levelLabels, getCoursePrice } from '@/lib/sanity/utils';
import { useMemo } from 'react';

interface LearnSectionProps {
  courses: Course[];
  userCurrency: 'CLP' | 'USD';
}

export function LearnSection({ courses, userCurrency }: LearnSectionProps) {
  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <section className="py-32 bg-gradient-to-br from-bg to-surface">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <FadeIn>
            <div className="inline-flex items-center gap-3 bg-tint/10 px-6 py-3 rounded-full mb-4">
              <BookOpen className="text-brand" size={24} />
              <span className="text-brand font-semibold">Educación</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-fg">
              Tú También Puedes
              <br />
              <span className="text-brand">Crear Vida</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Aprende a crear terrarios desde cero. Cursos online completos
              donde te enseño todo lo que sé, a tu ritmo y desde cualquier lugar.
            </p>
          </FadeIn>
        </div>

        {/* Beneficios */}
        <StaggerContainer staggerDelay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: <Play size={24} />,
                title: 'Acceso de por Vida',
                description: 'Una vez tuyo, para siempre',
              },
              {
                icon: <Clock size={24} />,
                title: 'A tu Ritmo',
                description: 'Aprende cuando quieras',
              },
              {
                icon: <BookOpen size={24} />,
                title: 'Material Completo',
                description: 'Videos, PDFs y recursos',
              },
            ].map((benefit, i) => (
              <StaggerItem key={i}>
                <div className="text-center p-8 rounded-xl bg-surface shadow-natural-sm hover:shadow-natural-md transition-all">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand/10 text-brand mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-fg mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted">{benefit.description}</p>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Cursos */}
        <StaggerContainer staggerDelay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {courses.map((course) => {
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
                <StaggerItem key={course._id}>
                  <Link href={`/cursos/${slug}`}>
                    <Card hover padding="none" className="group h-full flex flex-col">
                      <div className="relative aspect-video overflow-hidden rounded-t-lg">
                        <Card.Image 
                          src={imageUrl} 
                          alt={course.thumbnail?.alt || course.name} 
                        />
                        
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-scrim/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-surface/90 flex items-center justify-center">
                            <Play className="text-brand ml-1" size={28} fill="currentColor" />
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <div className="flex items-center gap-3">
                          <Badge variant="info" size="sm">{levelLabel}</Badge>
                          <span className="text-sm text-muted">
                            {course.lessonCount} lecciones • {course.duration}h
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-display text-2xl font-semibold text-fg group-hover:text-brand transition-colors">
                            {course.name}
                          </h3>
                          <p className="text-muted line-clamp-2">
                            {course.shortDescription}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-line mt-auto">
                          <div className="space-y-1">
                            <div className="text-2xl font-display font-bold text-fg">
                              {pricing.current}
                            </div>
                            {pricing.hasDiscount && pricing.original && (
                              <div className="text-sm text-muted line-through">
                                {pricing.original}
                              </div>
                            )}
                          </div>
                          <Button as="span" variant="primary">
                            Comenzar Viaje
                            <ArrowRight size={18} />
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
            <Button variant="secondary" size="lg" href="/cursos">
              Ver Todos los Cursos
              <ArrowRight size={20} />
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

