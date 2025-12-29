/**
 * Video Background Component
 * Video fullscreen con fallback a imagen
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface VideoBackgroundProps {
  videoSrc: string;
  fallbackImage: string;
  overlay?: 'none' | 'light' | 'dark';
  className?: string;
}

export function VideoBackground({
  videoSrc,
  fallbackImage,
  overlay = 'dark',
  className = '',
}: VideoBackgroundProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    // Detectar mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lazy load del video solo en desktop cuando está en viewport (mejora FCP)
  useEffect(() => {
    // En mobile no cargamos video, solo imagen
    if (isMobile || videoLoaded) return;

    // Usar Intersection Observer para cargar video solo cuando está visible (solo desktop)
    const videoElement = document.querySelector('video[data-hero-video]') as HTMLVideoElement;
    if (!videoElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Cargar video cuando está visible (solo en desktop)
            videoElement.load();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Cargar 50px antes de que sea visible
    );

    observer.observe(videoElement);

    return () => observer.disconnect();
  }, [isMobile, videoLoaded]);

  const overlayClasses = {
    none: '',
    light: 'bg-white/30',
    dark: 'bg-forest/60', // Incrementado para mejor contraste
  };

  // En mobile, mostrar solo imagen
  if (isMobile) {
    return (
      <div className={`absolute inset-0 w-full h-full ${className}`}>
        <Image
          src={fallbackImage}
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={75}
          sizes="100vw"
        />
        {overlay !== 'none' && (
          <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
        )}
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 w-full h-full ${className}`}>
      {/* Fallback image mientras carga video */}
      {!videoLoaded && (
        <Image
          src={fallbackImage}
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={80}
          sizes="100vw"
        />
      )}

      {/* Video - Lazy load para mejorar FCP */}
      <video
        data-hero-video
        autoPlay
        loop
        muted
        playsInline
        preload="none" // No precargar video, solo cuando esté visible
        onLoadedData={() => setVideoLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
      )}
    </div>
  );
}

