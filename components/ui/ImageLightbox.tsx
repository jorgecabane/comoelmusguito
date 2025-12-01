/**
 * Image Lightbox Component
 * Modal para ver imágenes en grande
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface ImageLightboxProps {
  images: string[];
  alt: string;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  alt,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index cuando se abre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-forest/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          />

          {/* Lightbox Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col">
              {/* Botón cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-colors pointer-events-auto"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>

              {/* Navegación anterior */}
              {images.length > 1 && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-colors pointer-events-auto"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Imagen principal */}
              <div className="flex-1 flex items-center justify-center pointer-events-auto">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="relative w-full h-full max-w-6xl"
                >
                  <Image
                    src={images[currentIndex]}
                    alt={`${alt} ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="90vw"
                    priority
                  />
                </motion.div>
              </div>

              {/* Navegación siguiente */}
              {images.length > 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-colors pointer-events-auto"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={24} />
                </button>
              )}

              {/* Indicador de imagen */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm pointer-events-auto">
                  {currentIndex + 1} / {images.length}
                </div>
              )}

              {/* Thumbnails (si hay más de 1 imagen) */}
              {images.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-4xl overflow-x-auto px-4 pointer-events-auto">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0',
                        currentIndex === index
                          ? 'border-vida scale-110'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

