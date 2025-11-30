/**
 * Página: Detalle de Terrario
 * Datos desde Sanity CMS
 */

import { getTerrariumBySlug, getAllTerrariums } from '@/lib/sanity/fetch';
import { getImageUrl, formatPrice, sizeLabels, categoryLabels, extractPlainText } from '@/lib/sanity/utils';
import { Badge, Button } from '@/components/ui';
import { ShoppingCart, Leaf, Package, Droplets, Heart } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

interface TerrariumPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all terrariums
export async function generateStaticParams() {
  const terrarios = await getAllTerrariums();
  return terrarios.map((terrarium) => ({
    slug: terrarium.slug.current,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: TerrariumPageProps) {
  const { slug } = await params;
  const terrarium = await getTerrariumBySlug(slug);

  if (!terrarium) {
    return {
      title: 'Terrario no encontrado',
    };
  }

  return {
    title: terrarium.seo?.metaTitle || terrarium.name,
    description: terrarium.seo?.metaDescription || terrarium.description,
  };
}

export default async function TerrariumPage({ params }: TerrariumPageProps) {
  const { slug } = await params;
  const terrarium = await getTerrariumBySlug(slug);

  if (!terrarium) {
    notFound();
  }

  const sizeLabel = terrarium.size ? sizeLabels[terrarium.size] : 'N/A';
  const categoryLabel = terrarium.category ? categoryLabels[terrarium.category] : 'N/A';

  return (
    <div className="pt-32 pb-16">
      {/* Breadcrumb */}
      <div className="container mb-8">
        <div className="flex items-center gap-2 text-sm text-gray">
          <Link href="/" className="hover:text-musgo transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/terrarios" className="hover:text-musgo transition-colors">
            Terrarios
          </Link>
          <span>/</span>
          <span className="text-forest">{terrarium.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <section className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream">
              <Image
                src={getImageUrl(terrarium.images?.[0], { width: 800, height: 800 })}
                alt={terrarium.images?.[0]?.alt || terrarium.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Thumbnails */}
            {terrarium.images && terrarium.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {terrarium.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-cream cursor-pointer hover:opacity-75 transition-opacity"
                  >
                    <Image
                      src={getImageUrl(image, { width: 200, height: 200 })}
                      alt={image.alt || `${terrarium.name} ${index + 2}`}
                      fill
                      className="object-cover"
                      sizes="200px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={terrarium.inStock ? 'success' : 'error'}>
                  {terrarium.inStock ? `${terrarium.stock} disponibles` : 'Agotado'}
                </Badge>
                <Badge variant="default">{categoryLabel}</Badge>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
                {terrarium.name}
              </h1>
              <p className="text-xl text-gray leading-relaxed">
                {terrarium.description}
              </p>
            </div>

            {/* Price & CTA */}
            <div className="border-t border-b border-gray/20 py-6">
              <div className="text-4xl font-display font-bold text-forest mb-6">
                {formatPrice(terrarium.price, terrarium.currency)}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  icon={<ShoppingCart size={20} />}
                  disabled={!terrarium.inStock}
                >
                  {terrarium.inStock ? 'Adoptar Terrario' : 'Agotado'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Heart size={20} />}
                  aria-label="Guardar favorito"
                />
              </div>

              {!terrarium.shippingAvailable && (
                <p className="text-sm text-gray mt-4">
                  📍 Solo retiro en persona (Santiago, Chile)
                </p>
              )}
            </div>

            {/* Specs */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl font-semibold text-forest">
                Características
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cream p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-musgo mb-2">
                    <Package size={20} />
                    <span className="font-semibold">Tamaño</span>
                  </div>
                  <p className="text-gray">{sizeLabel}</p>
                </div>
                {terrarium.careLevel && (
                  <div className="bg-cream p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-musgo mb-2">
                      <Leaf size={20} />
                      <span className="font-semibold">Dificultad</span>
                    </div>
                    <p className="text-gray capitalize">{terrarium.careLevel}</p>
                  </div>
                )}
                {terrarium.lightRequirement && (
                  <div className="bg-cream p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-musgo mb-2">
                      <Leaf size={20} />
                      <span className="font-semibold">Luz</span>
                    </div>
                    <p className="text-gray capitalize">{terrarium.lightRequirement}</p>
                  </div>
                )}
                {terrarium.wateringFrequency && (
                  <div className="bg-cream p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-musgo mb-2">
                      <Droplets size={20} />
                      <span className="font-semibold">Riego</span>
                    </div>
                    <p className="text-gray">{terrarium.wateringFrequency}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Plants */}
            {terrarium.plants && terrarium.plants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display text-xl font-semibold text-forest">
                  Plantas Incluidas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {terrarium.plants.map((plant) => (
                    <Badge key={plant} variant="default">
                      🌿 {plant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Hardscape */}
            {terrarium.hardscape && terrarium.hardscape.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display text-xl font-semibold text-forest">
                  Hardscape
                </h3>
                <div className="flex flex-wrap gap-2">
                  {terrarium.hardscape.map((item) => (
                    <Badge key={item} variant="default">
                      🪨 {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Back to catalog */}
      <section className="container mt-16">
        <Link href="/terrarios">
          <Button variant="secondary">← Ver todos los terrarios</Button>
        </Link>
      </section>
    </div>
  );
}

