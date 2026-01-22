/**
 * Página: Detalle de Insumo
 * Datos desde Sanity CMS
 */

import { getSupplyBySlug, getAllSupplies } from '@/lib/sanity/fetch';
import { getImageUrl, formatPrice, getSlugString, supplyCategoryLabels } from '@/lib/sanity/utils';
import { Badge, Button, ImageGallery } from '@/components/ui';
import { Package, Wrench } from 'lucide-react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SupplyDetail } from '@/components/product/SupplyDetail';
import { ProductSchema, BreadcrumbSchema } from '@/lib/seo/schema';

export const revalidate = 60;

interface SupplyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all supplies
export async function generateStaticParams() {
  const insumos = await getAllSupplies();
  return insumos.map((insumo) => ({
    slug: insumo.slug.current,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: SupplyPageProps) {
  const { slug } = await params;
  const insumo = await getSupplyBySlug(slug);

  if (!insumo) {
    return {
      title: 'Insumo no encontrado',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
  const insumoSlug = getSlugString(insumo.slug);
  const images = insumo.images?.map((img) => 
    getImageUrl(img, { width: 1200, height: 1200 })
  ) || [];

  const price = insumo.price || 0;
  const currency = insumo.currency || 'CLP';

  return {
    title: insumo.seo?.metaTitle || `${insumo.name} - Insumo para Terrarios`,
    description: insumo.seo?.metaDescription || insumo.description,
    openGraph: {
      title: insumo.seo?.metaTitle || insumo.name,
      description: insumo.seo?.metaDescription || insumo.description,
      images: images.length > 0 ? [{ url: images[0], width: 1200, height: 1200 }] : [],
      url: `${baseUrl}/insumos/${insumoSlug}`,
      type: 'website',
    },
    // Metadata adicional para rich snippets
    other: {
      'product:price:amount': price.toString(),
      'product:price:currency': currency,
      'product:availability': insumo.inStock ? 'in stock' : 'out of stock',
      'product:condition': 'new',
    },
  };
}

export default async function SupplyPage({ params }: SupplyPageProps) {
  const { slug } = await params;
  const insumo = await getSupplyBySlug(slug);

  if (!insumo) {
    notFound();
  }

  const categoryLabel = insumo.category ? supplyCategoryLabels[insumo.category] : 'N/A';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
  const insumoSlug = getSlugString(insumo.slug);
  const images = insumo.images?.map((img) => 
    getImageUrl(img, { width: 1200, height: 1200 })
  ) || [];

  return (
    <>
      {/* Structured Data para SEO */}
      <ProductSchema
        name={insumo.name}
        description={insumo.description}
        images={images}
        price={insumo.price}
        currency={insumo.currency}
        slug={insumoSlug}
        inStock={insumo.inStock || false}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Inicio', url: baseUrl },
          { name: 'Insumos', url: `${baseUrl}/insumos` },
          { name: insumo.name, url: `${baseUrl}/insumos/${insumoSlug}` },
        ]}
      />
      
    <div className="pt-32 pb-16">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/insumos" className="hover:text-musgo transition-colors">
            Insumos
          </Link>
          <span className="mx-2 text-gray">/</span>
          <span className="text-gray">{insumo.name}</span>
        </nav>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Galería de Imágenes */}
          {insumo.images && insumo.images.length > 0 && (
            <div>
              <ImageGallery
                images={insumo.images.map((img) =>
                  getImageUrl(img, { width: 1200, height: 1200 })
                )}
                alt={insumo.images[0]?.alt || insumo.name}
              />
            </div>
          )}

          {/* Información del Producto */}
          <div className="space-y-6">
            {/* Categoría y Stock */}
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="default" size="md">
                {categoryLabel}
              </Badge>
              <Badge variant={insumo.inStock ? 'success' : 'error'} size="md">
                {insumo.inStock ? `Stock: ${insumo.stock}` : 'Agotado'}
              </Badge>
              {insumo.brand && (
                <Badge variant="default" size="md">
                  {insumo.brand}
                </Badge>
              )}
            </div>

            {/* Título */}
            <h1 className="font-display text-4xl md:text-5xl font-bold text-forest">
              {insumo.name}
            </h1>

            {/* Descripción Corta */}
            <p className="text-xl text-gray leading-relaxed">
              {insumo.description}
            </p>

            {/* Componente de Detalle (Precio y CTA) */}
            <SupplyDetail supply={insumo} />

            {/* Especificaciones */}
            <div className="border-t border-gray/20 pt-6 space-y-4">
              <h3 className="font-display text-xl font-semibold text-forest">
                Especificaciones
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {insumo.weight && (
                  <div>
                    <p className="text-sm text-gray mb-1">Peso</p>
                    <p className="font-semibold">{insumo.weight}g</p>
                  </div>
                )}
                {insumo.dimensions && (
                  <div>
                    <p className="text-sm text-gray mb-1">Dimensiones</p>
                    <p className="font-semibold">
                      {insumo.dimensions.length && `${insumo.dimensions.length}×`}
                      {insumo.dimensions.width && `${insumo.dimensions.width}×`}
                      {insumo.dimensions.height && `${insumo.dimensions.height}`} cm
                    </p>
                  </div>
                )}
                {insumo.localPickupOnly && (
                  <div>
                    <p className="text-sm text-gray mb-1">Disponibilidad</p>
                    <p className="font-semibold">Solo retiro en tienda</p>
                  </div>
                )}
                {insumo.shippingAvailable && (
                  <div>
                    <p className="text-sm text-gray mb-1">Envío</p>
                    <p className="font-semibold">Disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Compatibilidad */}
            {insumo.compatibility && insumo.compatibility.length > 0 && (
              <div className="border-t border-gray/20 pt-6">
                <h3 className="font-display text-xl font-semibold text-forest mb-4">
                  Compatibilidad
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insumo.compatibility.map((type) => (
                    <Badge key={type} variant="default" size="sm">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Garantía */}
            {insumo.warranty && (
              <div className="border-t border-gray/20 pt-6">
                <h3 className="font-display text-xl font-semibold text-forest mb-2">
                  Garantía / Política
                </h3>
                <p className="text-gray">{insumo.warranty}</p>
              </div>
            )}
          </div>
        </div>

        {/* Descripción Detallada */}
        {insumo.longDescription && insumo.longDescription.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-forest mb-6">
              Descripción Detallada
            </h2>
            <div className="prose prose-lg max-w-none">
              {/* Aquí iría el renderizado de rich text blocks */}
              <p className="text-gray leading-relaxed">
                {insumo.description}
              </p>
            </div>
          </section>
        )}

        {/* Instrucciones de Uso */}
        {insumo.instructions && insumo.instructions.length > 0 && (
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-forest mb-6">
              Instrucciones de Uso
            </h2>
            <div className="prose prose-lg max-w-none">
              {/* Aquí iría el renderizado de rich text blocks */}
              <p className="text-gray leading-relaxed">
                Consulta las instrucciones incluidas con el producto.
              </p>
            </div>
          </section>
        )}

        {/* CTA Final */}
        <div className="text-center">
          <Link href="/insumos">
            <Button variant="secondary">← Ver todos los insumos</Button>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
