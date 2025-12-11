/**
 * Página: Catálogo de Terrarios
 * Datos desde Sanity CMS
 */

import { Card, Badge, Button } from '@/components/ui';
import { Heart, Filter, ArrowRight } from 'lucide-react';
import { getAllTerrariums } from '@/lib/sanity/fetch';
import { getFirstImage, formatPrice, getSlugString, sizeLabels, categoryLabels } from '@/lib/sanity/utils';
import Link from 'next/link';
import { getWhatsAppLink } from '@/lib/config/contact';

export const revalidate = 60;

export const metadata = {
  title: 'Terrarios Artesanales',
  description:
    'Explora nuestra colección de terrarios artesanales únicos. Cada uno hecho a mano con plantas nativas y musgo recolectado sustentablemente.',
};

export default async function TerrariosPage() {
  const terrarios = await getAllTerrariums();

  return (
    <div className="pt-32 pb-16">
      {/* Header */}
      <section className="container mb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-forest mb-6">
            Ecosistemas Vivos
          </h1>
          <p className="text-xl text-gray leading-relaxed">
            Cada terrario es una obra de arte viva, hecha a mano con plantas y musgos cultivados por Tomás
            y materiales recolectados de forma sustentable en Chile.
          </p>
        </div>
      </section>

      {/* Mensaje si no hay terrarios */}
      {terrarios.length === 0 ? (
        <section className="container">
          <div className="bg-cream/50 rounded-2xl p-12 text-center">
            <p className="text-xl text-gray mb-6">
              Estamos preparando nuevos terrarios. Vuelve pronto 🌱
            </p>
            <Link href="/cursos">
              <Button variant="primary">Ver Cursos Online</Button>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Grid de Terrarios */}
          <section className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {terrarios.map((terrarium) => {
                const slug = getSlugString(terrarium.slug);
                const imageUrl = getFirstImage(terrarium.images, { width: 800 });
                const sizeLabel = terrarium.size ? sizeLabels[terrarium.size] : '';
                const categoryLabel = terrarium.category ? categoryLabels[terrarium.category] : '';

                return (
                  <Link key={terrarium._id} href={`/terrarios/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      <Card.Image 
                        src={imageUrl} 
                        alt={terrarium.images?.[0]?.alt || terrarium.name} 
                      />
                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <Card.Content>
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <Badge variant={terrarium.inStock ? 'success' : 'error'} size="sm">
                              {terrarium.inStock
                                ? `Stock: ${terrarium.stock}`
                                : 'Agotado'}
                            </Badge>
                            <span className="text-xs text-gray uppercase tracking-wide">
                              {categoryLabel}
                            </span>
                          </div>
                          <Card.Title as="h2">{terrarium.name}</Card.Title>
                          <Card.Description>
                            {terrarium.description.slice(0, 120)}...
                          </Card.Description>
                          
                          {/* Plantas incluidas */}
                          {terrarium.plants && terrarium.plants.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                              {terrarium.plants.slice(0, 2).map((plant) => (
                                <Badge key={plant} variant="default" size="sm">
                                  {plant}
                                </Badge>
                              ))}
                              {terrarium.plants.length > 2 && (
                                <Badge variant="default" size="sm">
                                  +{terrarium.plants.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 mt-auto">
                            <div className="text-2xl font-display font-bold text-forest">
                              {formatPrice(terrarium.price, terrarium.currency)}
                            </div>
                            <span className="text-sm text-gray">{sizeLabel}</span>
                          </div>
                        </Card.Content>
                        <Card.Footer>
                          <Button
                            variant="primary"
                            className="w-full group-hover:bg-musgo-dark transition-colors"
                            disabled={!terrarium.inStock}
                          >
                            {terrarium.inStock ? 'Ver Detalles' : 'Agotado'}
                            {terrarium.inStock && <ArrowRight size={18} />}
                          </Button>
                        </Card.Footer>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Info adicional */}
          <section className="container mt-24">
            <div className="bg-gradient-to-br from-vida/10 to-musgo/10 rounded-2xl p-12 text-center">
              <h2 className="font-display text-3xl font-semibold text-forest mb-4">
                ¿No encuentras lo que buscas?
              </h2>
              <p className="text-gray mb-6 max-w-2xl mx-auto">
                Creamos terrarios personalizados según tus gustos y espacio.
                Contáctanos y diseñemos juntos tu ecosistema perfecto.
              </p>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="primary" size="lg">
                  Solicitar Terrario Personalizado
                </Button>
              </a>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
