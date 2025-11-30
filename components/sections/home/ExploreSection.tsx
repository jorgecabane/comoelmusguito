/**
 * Explore Section - Galería de Terrarios
 * Grid masonry con hover effects
 */

'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, Badge, Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Terrarium } from '@/types/sanity';
import { getFirstImage, formatPrice, getSlugString, sizeLabels } from '@/lib/sanity/utils';

interface ExploreSectionProps {
  terrarios: Terrarium[];
}

export function ExploreSection({ terrarios }: ExploreSectionProps) {
  if (!terrarios || terrarios.length === 0) {
    return null; // No mostrar sección si no hay terrarios
  }

  return (
    <section className="py-32 bg-white">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest">
              Cada Terrario
              <br />
              Cuenta una <span className="text-musgo">Historia</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-xl text-gray max-w-2xl mx-auto">
              Explora ecosistemas únicos, cada uno hecho a mano con dedicación.
              No hay dos iguales.
            </p>
          </FadeIn>
        </div>

        {/* Grid de Terrarios */}
        <StaggerContainer staggerDelay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {terrarios.map((terrarium) => {
              const slug = getSlugString(terrarium.slug);
              const imageUrl = getFirstImage(terrarium.images, { width: 800 });
              const sizeLabel = terrarium.size ? sizeLabels[terrarium.size] : 'N/A';
              
              return (
                <StaggerItem key={terrarium._id}>
                  <Link href={`/terrarios/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      {/* Imagen con hover effect */}
                      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                        <Card.Image 
                          src={imageUrl} 
                          alt={terrarium.images?.[0]?.alt || terrarium.name}
                        />
                        
                        {/* Overlay info al hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-forest/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-white">
                          {terrarium.plants && terrarium.plants.length > 0 && (
                            <p className="text-sm mb-2 opacity-90">
                              {terrarium.plants.slice(0, 2).join(' • ')}
                            </p>
                          )}
                          <p className="font-semibold">
                            Toca para ver la historia completa →
                          </p>
                        </div>
                      </div>

                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <Badge variant={terrarium.inStock ? 'success' : 'error'} size="sm">
                            {terrarium.inStock
                              ? `Stock: ${terrarium.stock}`
                              : 'Agotado'}
                          </Badge>
                          <span className="text-xs text-gray uppercase tracking-wide">{sizeLabel}</span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-display text-2xl font-semibold text-forest group-hover:text-musgo transition-colors">
                            {terrarium.name}
                          </h3>
                          <p className="text-gray line-clamp-2">
                            {terrarium.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-auto">
                          <div className="text-2xl font-display font-bold text-forest">
                            {formatPrice(terrarium.price, terrarium.currency)}
                          </div>
                          <Button
                            variant="ghost"
                            icon={<ArrowRight size={18} />}
                            className="text-musgo"
                          >
                            Ver más
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
        <FadeIn delay={0.4}>
          <div className="text-center mt-16">
            <Link href="/terrarios">
              <Button variant="primary" size="lg">
                Explorar Todos los Ecosistemas
                <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

