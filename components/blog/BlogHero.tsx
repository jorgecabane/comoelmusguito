/**
 * BlogHero Component
 * Hero section para entrada individual del blog
 */

'use client';

import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { getImageUrl } from '@/lib/sanity/utils';
import type { BlogPost } from '@/types/sanity';
import { FadeIn } from '@/components/animations';

interface BlogHeroProps {
  post: BlogPost;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogHero({ post }: BlogHeroProps) {
  const imageUrl = getImageUrl(post.featuredImage, { width: 1920, height: 1080 });

  return (
    <section className="relative w-full h-[60vh] min-h-[600px] md:min-h-[500px] max-h-[800px] overflow-hidden pt-20">
      {/* Background: Siempre imagen */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={post.featuredImage?.alt || post.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest/60 via-forest/50 to-forest/70" />

      {/* Contenido */}
      <div className="relative z-10 h-full flex items-end">
        <div className="container pb-8 md:pb-16">
          <FadeIn>
            <div className="max-w-4xl">
              {/* Contenedor con fondo glassmorphism para legibilidad */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 lg:p-10 border border-white/20 shadow-2xl">
                {/* Metadatos */}
                <div className="flex items-center gap-6 text-white/90 mb-6 flex-wrap">
                  {post.projectDate && (
                    <div className="flex items-center gap-2">
                      <Calendar size={18} />
                      <span className="text-sm md:text-base">{formatDate(post.projectDate)}</span>
                    </div>
                  )}
                  {post.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={18} />
                      <span className="text-sm md:text-base">{post.location}</span>
                    </div>
                  )}
                </div>

                {/* Título */}
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
                  {post.name}
                </h1>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl drop-shadow-md">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
