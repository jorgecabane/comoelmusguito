/**
 * Página: Catálogo de Insumos
 * Datos desde Sanity CMS
 */

import { Card, Badge, Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import { getAllSupplies } from '@/lib/sanity/fetch';
import { getFirstImage, formatPrice, getSlugString, supplyCategoryLabels } from '@/lib/sanity/utils';
import Link from 'next/link';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import type { SupplyCategory } from '@/types/sanity';

export const revalidate = 60;

export const metadata = {
  title: 'Insumos para Terrarios',
  description:
    'Encuentra todo lo que necesitas para crear terrarios profesionales en casa. Sustratos, herramientas, kits, frascos y más, con el sello de aprobación de comoelmusguito.',
};

export default async function InsumosPage() {
  const insumos = await getAllSupplies();

  // Agrupar por categoría para filtros
  const insumosPorCategoria: Record<SupplyCategory, typeof insumos> = {
    sustrato: [],
    herramienta: [],
    kit: [],
    frasco: [],
    urna: [],
    accesorio: [],
    material: [],
  };

  insumos.forEach((insumo) => {
    if (insumosPorCategoria[insumo.category]) {
      insumosPorCategoria[insumo.category].push(insumo);
    }
  });

  return (
    <div className="pt-32 pb-16">
      <Breadcrumb items={[{ label: 'Insumos' }]} />
      {/* Header */}
      <section className="container mb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-forest mb-6">
            Insumos Profesionales
          </h1>
          <p className="text-xl text-gray leading-relaxed">
            Todo lo que necesitas para crear y cultivar terrarios en casa.
            Sustratos, bioestimulantes, kits y más, productos ecológicos de alta calidad, todos con el sello de aprobación de Comoelmusguito.
          </p>
        </div>
      </section>

      {/* Mensaje si no hay insumos */}
      {insumos.length === 0 ? (
        <section className="container">
          <div className="bg-cream/50 rounded-2xl p-12 text-center">
            <p className="text-xl text-gray mb-6">
              Estamos preparando nuevos insumos. Vuelve pronto 🛠️
            </p>
            <Link href="/cursos">
              <Button variant="primary">Ver Cursos Online</Button>
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Grid de Insumos */}
          <section className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {insumos.map((insumo) => {
                const slug = getSlugString(insumo.slug);
                const imageUrl = getFirstImage(insumo.images, { width: 800 });
                const categoryLabel = insumo.category ? supplyCategoryLabels[insumo.category] : '';

                return (
                  <Link key={insumo._id} href={`/insumos/${slug}`}>
                    <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
                      <Card.Image 
                        src={imageUrl} 
                        alt={insumo.images?.[0]?.alt || insumo.name} 
                      />
                      <div className="p-6 space-y-4 flex flex-col flex-1">
                        <Card.Content>
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <Badge variant={insumo.inStock ? 'success' : 'error'} size="sm">
                              {insumo.inStock
                                ? `Stock: ${insumo.stock}`
                                : 'Agotado'}
                            </Badge>
                            <span className="text-xs text-gray uppercase tracking-wide">
                              {categoryLabel}
                            </span>
                          </div>
                          <Card.Title as="h2">{insumo.name}</Card.Title>
                          <Card.Description>
                            {insumo.description.slice(0, 120)}...
                          </Card.Description>
                          
                          {/* Marca si existe */}
                          {insumo.brand && (
                            <div className="pt-2">
                              <Badge variant="default" size="sm">
                                {insumo.brand}
                              </Badge>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 mt-auto">
                            <div className="text-2xl font-display font-bold text-forest">
                              {formatPrice(insumo.price, insumo.currency)}
                            </div>
                            {insumo.localPickupOnly && (
                              <span className="text-xs text-gray">Solo retiro</span>
                            )}
                          </div>
                        </Card.Content>
                        <Card.Footer>
                          <Button
                            variant="primary"
                            className="w-full group-hover:bg-musgo-dark transition-colors"
                            disabled={!insumo.inStock}
                          >
                            {insumo.inStock ? 'Ver Detalles' : 'Agotado'}
                            {insumo.inStock && <ArrowRight size={18} />}
                          </Button>
                        </Card.Footer>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
