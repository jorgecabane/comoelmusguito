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
          quality={90}
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
          quality={90}
        />
      )}

      {/* Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
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

