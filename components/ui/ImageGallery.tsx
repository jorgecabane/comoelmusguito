/**
 * Image Gallery Component
 * Galería de imágenes con thumbnails y lightbox
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageLightbox } from './ImageLightbox';
import { cn } from '@/lib/utils/cn';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Imagen principal */}
        <button
          onClick={() => openLightbox(0)}
          className={cn(
            'relative w-full rounded-2xl overflow-hidden bg-cream group cursor-pointer',
            className || 'aspect-[4/3]' // Usar className si se proporciona, sino aspect-[4/3] por defecto
          )}
        >
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-forest/0 group-hover:bg-forest/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium transition-opacity">
              Click para ampliar
            </span>
          </div>
        </button>

        {/* Thumbnails (si hay más de 1 imagen) */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-4">
            {images.slice(1, 5).map((image, index) => (
              <button
                key={index + 1}
                onClick={() => openLightbox(index + 1)}
                className="relative aspect-square rounded-lg overflow-hidden bg-cream group cursor-pointer"
              >
                <Image
                  src={image}
                  alt={`${alt} ${index + 2}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-110"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-forest/0 group-hover:bg-forest/20 transition-colors" />
              </button>
            ))}
            {images.length > 5 && (
              <button
                onClick={() => openLightbox(4)}
                className="relative aspect-square rounded-lg overflow-hidden bg-cream group cursor-pointer"
              >
                <Image
                  src={images[4]}
                  alt={`${alt} 5`}
                  fill
                  className="object-cover opacity-50"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-forest/60 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    +{images.length - 5}
                  </span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        alt={alt}
        initialIndex={selectedIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

