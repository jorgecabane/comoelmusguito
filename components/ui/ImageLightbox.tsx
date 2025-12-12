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
          {/* Overlay - cierra al hacer click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 h-screen bg-forest/95 backdrop-blur-sm z-50"
          />

          {/* Lightbox Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => {
              // Cerrar si se hace click fuera del contenedor de la imagen
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
            {/* Botón cerrar - posicionado fuera del contenedor de imagen */}
            <button
              onClick={onClose}
              className="absolute top-24 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-colors pointer-events-auto"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            {/* Contenedor de imagen - se ajusta al tamaño de la imagen */}
            <div 
              className="relative max-w-4xl w-full flex items-center justify-center pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Navegación anterior */}
              {images.length > 1 && (
                <button
                  onClick={goToPrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-colors"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {/* Imagen principal */}
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="relative w-full max-w-4xl flex items-center justify-center"
                style={{ maxHeight: '70vh', height: 'auto' }}
              >
                <div 
                  className="relative flex items-center justify-center"
                  style={{ 
                    maxHeight: '70vh', 
                    maxWidth: '100%',
                    width: 'fit-content',
                    height: 'fit-content'
                  }}
                >
                  <img
                    src={images[currentIndex]}
                    alt={`${alt} ${currentIndex + 1}`}
                    className="object-contain max-w-full max-h-[70vh] w-auto h-auto"
                    style={{ display: 'block' }}
                  />
                </div>
              </motion.div>

              {/* Navegación siguiente */}
              {images.length > 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full p-3 text-white transition-colors"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight size={24} />
                </button>
              )}
            </div>

            {/* Indicador de imagen - fuera del contenedor */}
            {images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm pointer-events-auto">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Thumbnails (si hay más de 1 imagen) - fuera del contenedor */}
            {images.length > 1 && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-4xl overflow-x-auto px-4 pointer-events-auto">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

