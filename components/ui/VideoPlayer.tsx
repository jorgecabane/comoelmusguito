/**
 * Video Player Component
 * Player de video simple y confiable usando iframe directo
 * Soporta YouTube, Vimeo y otros proveedores
 */

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
  controls?: boolean;
}

/**
 * Extraer ID del video de YouTube desde diferentes formatos de URL
 */
function getYouTubeVideoId(url: string): string | null {
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];

  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
}

/**
 * Extraer ID del video de Vimeo
 */
function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoplay = false,
  controls = false,
}: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);

  if (!src) {
    return (
      <div className={cn('relative aspect-video rounded-2xl overflow-hidden bg-cream', className)}>
        {poster && (
          <img
            src={poster}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        )}
      </div>
    );
  }

  // Detectar tipo de video y extraer ID
  const youtubeId = getYouTubeVideoId(src);
  const vimeoId = getVimeoVideoId(src);

  // Construir URL del iframe
  let iframeSrc = '';
  if (youtubeId) {
    // Parámetros para minimizar la UI de YouTube
    const params = new URLSearchParams({
      // Controles básicos
      controls: controls ? '1' : '0',
      // Ocultar elementos extra
      modestbranding: '1', // Oculta el logo de YouTube
      rel: '0', // No muestra videos relacionados al final
      showinfo: '0', // Oculta información del video (deprecated pero ayuda)
      iv_load_policy: '3', // Oculta anotaciones
      cc_load_policy: '0', // No carga subtítulos automáticamente
      // Reproducción
      playsinline: '1', // Reproduce en línea en iOS
      // Autoplay
      ...(autoplay && { autoplay: '1', mute: '1' }), // Autoplay requiere mute
    });
    
    iframeSrc = `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  } else if (vimeoId) {
    iframeSrc = `https://player.vimeo.com/video/${vimeoId}?`;
    if (autoplay) iframeSrc += 'autoplay=1&';
    if (!controls) iframeSrc += 'controls=0&';
  } else {
    // Para otros proveedores, usar la URL directamente
    iframeSrc = src;
  }

  return (
    <div className={cn('relative group rounded-2xl overflow-hidden bg-cream aspect-video', className)}>
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-cream text-center z-10">
          <AlertCircle className="text-musgo mb-4" size={48} />
          <h3 className="font-display text-xl font-semibold text-forest mb-2">
            Video no disponible
          </h3>
          <p className="text-gray mb-4 max-w-md">
            No se pudo cargar el video. Verifica que la URL sea correcta y que el video permita embedding.
          </p>
          {poster && (
            <img
              src={poster}
              alt="Video thumbnail"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
        </div>
      ) : (
        <iframe
          src={iframeSrc}
          className="absolute inset-0 w-full h-full rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Video player"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}

