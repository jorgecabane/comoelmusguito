/**
 * Instagram Feed Component
 * Muestra las últimas fotos de Instagram
 */

'use client';

import { useState, useEffect } from 'react';
import { Instagram } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import Image from 'next/image';

interface InstagramPost {
  id: string;
  url: string;
  thumbnail: string;
  permalink: string;
  caption: string;
  timestamp: string;
}

interface FallbackPhoto {
  src: string;
  alt: string;
}

interface InstagramFeedProps {
  limit?: number;
  className?: string;
  /** Fotos propias que se muestran si el feed de Instagram no responde o viene vacío */
  fallbackPhotos?: FallbackPhoto[];
  /** Perfil al que enlazan las fotos de respaldo */
  profileUrl?: string;
}

export function InstagramFeed({
  limit = 8,
  className,
  fallbackPhotos,
  profileUrl = 'https://www.instagram.com/comoelmusguito',
}: InstagramFeedProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInstagramPosts() {
      try {
        setLoading(true);
        const response = await fetch(`/api/instagram/feed?limit=${limit}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener fotos de Instagram');
        }

        setPosts(data.data || []);
        setError(null);
      } catch (err) {
        console.warn('Instagram feed no disponible, se muestran fotos de respaldo:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        // En caso de error, mantener posts vacíos (no mostrar nada)
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchInstagramPosts();
  }, [limit]);

  // Estado de carga
  if (loading) {
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[...Array(limit)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-bosque/10 to-olivo/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Estado de error o sin posts
  if (error || posts.length === 0) {
    // Sin error visible para el usuario: si hay fotos de respaldo se muestran esas,
    // si no, placeholders neutros
    if (fallbackPhotos && fallbackPhotos.length > 0) {
      return (
        <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
          {fallbackPhotos.slice(0, limit).map((photo) => (
            <Link
              key={photo.src}
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg shadow-natural-sm hover:shadow-natural-md transition-all group overflow-hidden relative"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-bosque-deep/0 group-hover:bg-bosque-deep/30 transition-colors flex items-center justify-center">
                <Instagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[...Array(limit)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-bosque/10 to-olivo/10 rounded-lg shadow-natural-sm hover:shadow-natural-md transition-all cursor-pointer group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/10 transition-colors flex items-center justify-center">
              <Instagram className="text-brand opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mostrar posts reales
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {posts.map((post) => (
        <Link
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-square rounded-lg shadow-natural-sm hover:shadow-natural-md transition-all cursor-pointer group overflow-hidden relative"
        >
          <img
            src={post.thumbnail}
            alt={post.caption || 'Foto de Instagram'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/20 transition-colors flex items-center justify-center">
            <Instagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
          </div>
        </Link>
      ))}
    </div>
  );
}

