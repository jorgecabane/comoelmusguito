/**
 * BlogContent Component
 * Renderiza rich text blocks de Sanity con soporte para bloques personalizados
 */

'use client';

import { PortableText, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { getImageUrl } from '@/lib/sanity/utils';
import type { BlogPost, VideoBlock, QuoteBlock, SeparatorBlock, SanityImage } from '@/types/sanity';

interface BlogContentProps {
  content: BlogPost['content'];
}

const components: PortableTextComponents = {
  // Bloques de texto estándar
  block: {
    h1: ({ children }) => (
      <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-6 mt-12 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-4 mt-10 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display text-2xl md:text-3xl font-semibold text-forest mb-3 mt-8 first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="font-display text-xl md:text-2xl font-semibold text-forest mb-2 mt-6 first:mt-0">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-base md:text-lg text-gray leading-relaxed mb-6">
        {children}
      </p>
    ),
    blockquote: ({ children }) => {
      // Renderizar blockquote con estructura correcta para evitar errores de hidratación
      // Los children de blockquote pueden contener múltiples párrafos, así que los envolvemos en un div
      return (
        <blockquote className="border-l-4 border-musgo pl-6 py-4 my-8 italic text-gray text-lg not-prose">
          <div className="space-y-2">
            {children}
          </div>
        </blockquote>
      );
    },
  },
  // Listas
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-outside ml-6 mb-6 space-y-2 text-gray">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-outside ml-6 mb-6 space-y-2 text-gray">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="pl-2">{children}</li>,
    number: ({ children }) => <li className="pl-2">{children}</li>,
  },
  // Enlaces
  marks: {
    link: ({ value, children }) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-musgo hover:text-vida underline underline-offset-4 transition-colors"
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => (
      <strong className="font-semibold text-forest">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray">{children}</em>
    ),
  },
  // Imágenes embebidas
  types: {
    image: ({ value }: { value: SanityImage & { caption?: string } }) => {
      if (!value?.asset) return null;
      
      const imageUrl = getImageUrl(value, { width: 1200 });
      
      return (
        <figure className="my-12">
          <div className="relative w-full aspect-video md:aspect-[16/9] rounded-xl overflow-hidden">
            <Image
              src={imageUrl}
              alt={value.alt || 'Imagen del proyecto'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
          {value.caption && (
            <figcaption className="text-sm text-gray text-center mt-4 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    // Bloque de video personalizado
    videoBlock: ({ value }: { value: VideoBlock }) => {
      if (!value?.url) return null;
      
      return (
        <figure className="my-12">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
            <VideoPlayer
              src={value.url}
              provider={value.provider}
              className="w-full h-full"
              controls={true}
              autoplay={false}
            />
          </div>
          {value.caption && (
            <figcaption className="text-sm text-gray text-center mt-4 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      );
    },
    // Bloque de cita personalizado
    quoteBlock: ({ value }: { value: QuoteBlock }) => {
      if (!value?.quote) return null;
      
      return (
        <blockquote className="bg-cream border-l-4 border-musgo pl-8 pr-6 py-8 my-12 rounded-r-xl">
          <p className="font-display text-xl md:text-2xl text-forest leading-relaxed italic mb-4">
            "{value.quote}"
          </p>
          {value.author && (
            <cite className="text-gray text-base not-italic">
              — {value.author}
            </cite>
          )}
        </blockquote>
      );
    },
    // Bloque separador personalizado
    separatorBlock: ({ value }: { value: SeparatorBlock }) => {
      const style = value?.style || 'line';
      
      if (style === 'spaced') {
        return (
          <div className="my-16 flex items-center justify-center">
            <div className="w-24 h-0.5 bg-vida"></div>
          </div>
        );
      }
      
      return (
        <div className="my-12">
          <div className="w-full h-0.5 bg-vida/30"></div>
        </div>
      );
    },
  },
};

export function BlogContent({ content }: BlogContentProps) {
  if (!content || !Array.isArray(content) || content.length === 0) {
    return null;
  }

  return (
    <div className="prose prose-lg max-w-none">
      <PortableText value={content} components={components} />
    </div>
  );
}
