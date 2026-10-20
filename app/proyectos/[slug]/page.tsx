/**
 * Página: Detalle de Proyecto
 * Entrada individual del blog con narrativa inmersiva
 */

import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/sanity/fetch';
import { getSlugString, getImageUrl, formatDateLong } from '@/lib/sanity/utils';
import { BlogHero, BlogContent } from '@/components/blog';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { FadeIn } from '@/components/animations';
import { Badge } from '@/components/ui';
import { Button, CtaBanner } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Tag, Calendar, MapPin, ArrowLeft } from 'lucide-react';

export const revalidate = 60;

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: getSlugString(post.slug),
  }));
}

// Generate metadata
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Proyecto no encontrado',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
  const postSlug = getSlugString(post.slug);
  const featuredImage = getImageUrl(post.featuredImage, { width: 1200, height: 630 });

  return {
    title: post.seo?.metaTitle || `${post.name} | Proyectos`,
    description: post.seo?.metaDescription || post.excerpt,
    openGraph: {
      title: post.seo?.metaTitle || post.name,
      description: post.seo?.metaDescription || post.excerpt,
      images: [{ url: featuredImage, width: 1200, height: 630 }],
      url: `${baseUrl}/proyectos/${postSlug}`,
      type: 'article',
      publishedTime: post.projectDate,
    },
  };
}


export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comoelmusguito.cl';
  const postSlug = getSlugString(post.slug);

  return (
    <>
      {/* Hero */}
      <BlogHero post={post} />

      <div className="bg-surface">
        {/* Breadcrumb */}
        <div className="container pt-8 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-brand transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/proyectos" className="hover:text-brand transition-colors">
              Proyectos
            </Link>
            <span>/</span>
            <span className="text-fg">{post.name}</span>
          </div>
        </div>

        {/* Metadatos */}
        <section className="container py-8 border-b border-line">
          <FadeIn>
            <div className="flex flex-wrap items-center gap-6 text-muted">
              {post.projectDate && (
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-brand" />
                  <span>{formatDateLong(post.projectDate)}</span>
                </div>
              )}
              {post.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-brand" />
                  <span>{post.location}</span>
                </div>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={18} className="text-brand" />
                  {post.tags.map((tag, index) => (
                    <Badge key={index} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        </section>

        {/* Video Destacado - Justo antes del contenido */}
        {post.featuredVideo?.url && (
          <section className="container py-16">
            <FadeIn>
              <div className="max-w-4xl mx-auto">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-natural-xl">
                  <VideoPlayer
                    src={post.featuredVideo.url}
                    provider={post.featuredVideo.provider}
                    className="w-full h-full"
                    controls={true}
                    autoplay={false}
                  />
                </div>
              </div>
            </FadeIn>
          </section>
        )}

        {/* Contenido */}
        {post.content && post.content.length > 0 && (
          <section className="container py-16">
            <div className="max-w-3xl mx-auto">
              <FadeIn>
                <BlogContent content={post.content} />
              </FadeIn>
            </div>
          </section>
        )}

        {/* Galería */}
        {post.gallery && post.gallery.length > 0 && (
          <section className="container py-16 bg-bg/30">
            <FadeIn>
              <h2 className="font-display text-3xl font-semibold text-fg mb-8 text-center">
                Galería del Proyecto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {post.gallery.map((image, index) => {
                  const imageUrl = getImageUrl(image, { width: 800 });
                  return (
                    <FadeIn key={index} delay={index * 0.1}>
                      <div className="relative aspect-square rounded-xl overflow-hidden shadow-natural-md">
                        <Image
                          src={imageUrl}
                          alt={image.alt || `Imagen ${index + 1} del proyecto`}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            </FadeIn>
          </section>
        )}

        {/* CTA Final */}
        <section className="container py-16">
          <FadeIn>
            <CtaBanner
              title="¿Te Interesa un Proyecto Similar?"
              description="Si estás interesado en realizar un proyecto con terrarios, contáctanos para discutir tus ideas y necesidades."
            >
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contacto">
                  <Button variant="primary" size="lg">
                    Contactar
                  </Button>
                </Link>
                <Link href="/proyectos">
                  <Button variant="secondary" size="lg">
                    Ver Más Proyectos
                  </Button>
                </Link>
              </div>
            </CtaBanner>
          </FadeIn>
        </section>

        {/* Back to list */}
        <section className="container pb-16">
          <Link href="/proyectos">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              Volver a Proyectos
            </Button>
          </Link>
        </section>
      </div>
    </>
  );
}
