/**
 * Supplies Section - Galería de Insumos
 * Grid con hover effects
 */

'use client';

import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations';
import { Card, Badge, Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Supply } from '@/types/sanity';
import { getFirstImage, formatPrice, getSlugString, supplyCategoryLabels } from '@/lib/sanity/utils';

interface SuppliesSectionProps {
  insumos: Supply[];
}

export function SuppliesSection({ insumos }: SuppliesSectionProps) {
  if (!insumos || insumos.length === 0) {
    return null; // No mostrar sección si no hay insumos
  }

  return (
    <section className="py-32 bg-cream/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest">
              Todo lo que Necesitas
              <br />
              para <span className="text-musgo">Crear y Cultivar</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-xl text-gray max-w-2xl mx-auto">
              Insumos profesionales con el sello de aprobación de Comoelmusguito. 
              Sustratos, bio-estimulantes, kits y más para que puedas crear todo tipo de terrarios en casa.
            </p>
          </FadeIn>
        </div>

        {/* Grid de Insumos */}
        <StaggerContainer staggerDelay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insumos.map((insumo) => {
              const slug = getSlugString(insumo.slug);
              const imageUrl = getFirstImage(insumo.images, { width: 800 });
              const categoryLabel = insumo.category ? supplyCategoryLabels[insumo.category] : 'N/A';
              
              return (
                <StaggerItem key={insumo._id}>
                  <Link href={`/insumos/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      {/* Imagen con hover effect */}
                      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                        <Card.Image 
                          src={imageUrl} 
                          alt={insumo.images?.[0]?.alt || insumo.name}
                        />
                        
                        {/* Overlay info al hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-forest/90 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6 text-white">
                          {insumo.brand && (
                            <p className="text-sm mb-2 opacity-90">
                              {insumo.brand}
                            </p>
                          )}
                          <p className="font-semibold">
                            Toca para ver más detalles →
                          </p>
                        </div>
                      </div>

                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <Badge variant={insumo.inStock ? 'success' : 'error'} size="sm">
                            {insumo.inStock
                              ? `Stock: ${insumo.stock}`
                              : 'Agotado'}
                          </Badge>
                          <span className="text-xs text-gray uppercase tracking-wide">{categoryLabel}</span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-display text-2xl font-semibold text-forest group-hover:text-musgo transition-colors">
                            {insumo.name}
                          </h3>
                          <p className="text-gray line-clamp-2">
                            {insumo.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-auto">
                          <div className="text-2xl font-display font-bold text-forest">
                            {formatPrice(insumo.price, insumo.currency)}
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
            <Link href="/insumos">
              <Button variant="primary" size="lg">
                Ver Todos los Insumos
                <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
