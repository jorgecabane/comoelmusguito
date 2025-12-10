/**
 * Instagram Feed Component
 * Muestra las últimas fotos de Instagram
 */

'use client';

import { useState, useEffect } from 'react';
import { Instagram } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

interface InstagramPost {
  id: string;
  url: string;
  thumbnail: string;
  permalink: string;
  caption: string;
  timestamp: string;
}

interface InstagramFeedProps {
  limit?: number;
  className?: string;
}

export function InstagramFeed({ limit = 8, className }: InstagramFeedProps) {
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
        console.error('Error cargando Instagram feed:', err);
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
            className="aspect-square bg-gradient-to-br from-musgo/10 to-vida/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Estado de error o sin posts
  if (error || posts.length === 0) {
    // Si hay error, mostrar placeholders silenciosamente
    // No mostrar mensaje de error al usuario final
    return (
      <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
        {[...Array(limit)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gradient-to-br from-musgo/10 to-vida/10 rounded-lg shadow-natural-sm hover:shadow-natural-md transition-all cursor-pointer group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-musgo/0 group-hover:bg-musgo/10 transition-colors flex items-center justify-center">
              <Instagram className="text-musgo opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
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
          <div className="absolute inset-0 bg-musgo/0 group-hover:bg-musgo/20 transition-colors flex items-center justify-center">
            <Instagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
          </div>
        </Link>
      ))}
    </div>
  );
}

