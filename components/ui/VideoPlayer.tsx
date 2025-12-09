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
  onEnded?: () => void;
  url?: string; // URL completa del video (para compatibilidad)
  provider?: 'vimeo' | 'youtube' | 'bunny';
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
 * Extraer ID y hash privado del video de Vimeo
 * Soporta múltiples formatos:
 * - vimeo.com/1144342696
 * - vimeo.com/video/1144342696
 * - vimeo.com/1144342696/f88bb2c0a2 (hash privado en la ruta)
 * - vimeo.com/1144342696?h=f88bb2c0a2 (hash privado como query param)
 */
function getVimeoVideoInfo(url: string): { id: string; hash?: string } | null {
  // Formato con hash en la ruta: vimeo.com/1144342696/f88bb2c0a2
  const routeHashMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)\/([a-f0-9]+)/);
  if (routeHashMatch) {
    return { id: routeHashMatch[1], hash: routeHashMatch[2] };
  }

  // Formato con hash como query param: vimeo.com/1144342696?h=f88bb2c0a2
  const queryHashMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+).*[?&]h=([a-f0-9]+)/);
  if (queryHashMatch) {
    return { id: queryHashMatch[1], hash: queryHashMatch[2] };
  }

  // Formato simple: vimeo.com/1144342696
  const simpleMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (simpleMatch) {
    return { id: simpleMatch[1] };
  }

  return null;
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoplay = false,
  controls = false,
  onEnded,
  url,
  provider,
}: VideoPlayerProps) {
  // Usar url si está disponible, sino src
  const videoUrl = url || src;
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
  const youtubeId = getYouTubeVideoId(videoUrl);
  const vimeoInfo = getVimeoVideoInfo(videoUrl);

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
  } else if (vimeoInfo) {
    // Vimeo embed URL
    // IMPORTANTE: Los videos deben estar configurados en Vimeo para permitir embedding
    // solo en los siguientes dominios:
    // - localhost:3000 (desarrollo)
    // - comoelmusguito.vercel.app (preview)
    // - comoelmusguito.cl (producción)
    // Ver: docs/VIMEO_DOMAIN_RESTRICTION.md
    
    // Construir URL base con ID del video
    iframeSrc = `https://player.vimeo.com/video/${vimeoInfo.id}?`;
    
    // Agregar hash privado si está presente (necesario para videos privados)
    if (vimeoInfo.hash) {
      iframeSrc += `h=${vimeoInfo.hash}&`;
    }
    
    // Agregar otros parámetros
    if (autoplay) iframeSrc += 'autoplay=1&';
    if (!controls) iframeSrc += 'controls=0&';
    
    // Agregar parámetros adicionales para mejor seguridad
    iframeSrc += 'dnt=1&'; // Do Not Track
  } else {
    // Para otros proveedores, usar la URL directamente
    iframeSrc = videoUrl;
  }

  // Nota: Detectar cuando termina un video embebido requiere APIs específicas
  // Por ahora, el usuario puede marcar manualmente la lección como completada
  // En el futuro, podemos integrar YouTube/Vimeo Player APIs para detectar onEnded

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

