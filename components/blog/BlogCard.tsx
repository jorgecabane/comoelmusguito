/**
 * BlogCard Component
 * Card para mostrar posts del blog en el listado
 */

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { Card } from '@/components/ui';
import { getImageUrl, getSlugString } from '@/lib/sanity/utils';
import type { BlogPost } from '@/types/sanity';
import { Badge } from '@/components/ui';

interface BlogCardProps {
  post: BlogPost;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogCard({ post }: BlogCardProps) {
  const slug = getSlugString(post.slug);
  const imageUrl = getImageUrl(post.featuredImage, { width: 800, height: 600 });

  return (
    <Link href={`/proyectos/${slug}`}>
      <Card hover padding="none" className="group cursor-pointer h-full flex flex-col">
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={post.featuredImage?.alt || post.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-6 space-y-4 flex flex-col flex-1">
          <Card.Content>
            {/* Metadatos */}
            <div className="flex items-center gap-4 text-sm text-gray mb-3 flex-wrap">
              {post.projectDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-musgo" />
                  <span>{formatDate(post.projectDate)}</span>
                </div>
              )}
              {post.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-musgo" />
                  <span>{post.location}</span>
                </div>
              )}
            </div>

            {/* Título */}
            <Card.Title as="h2">{post.name}</Card.Title>

            {/* Excerpt */}
            <Card.Description>{post.excerpt}</Card.Description>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                {post.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-gray">+{post.tags.length - 3} más</span>
                )}
              </div>
            )}
          </Card.Content>
        </div>
      </Card>
    </Link>
  );
}
