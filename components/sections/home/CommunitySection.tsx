/**
 * Community Section
 * Social proof y comunidad
 */

'use client';

import { FadeIn } from '@/components/animations';
import { Button } from '@/components/ui';
import { Instagram, Heart } from 'lucide-react';
import { InstagramFeed } from '@/components/social/InstagramFeed';

/** Fotos propias de respaldo si el feed de Instagram no está disponible */
const fallbackPhotos = [
  { src: '/images/community/terrario-frasco.jpg', alt: 'Terrario en frasco de vidrio con plantas tropicales' },
  { src: '/images/community/taller-alumna.jpg', alt: 'Asistente a un taller con su terrario' },
  { src: '/images/community/terrario-tapa.jpg', alt: 'Terrario con tapa de vidrio y musgo' },
  { src: '/images/community/taller-mesa.jpg', alt: 'Taller de terrarios, mesa de trabajo' },
];

const communityStats = [
  { number: '40k+', label: 'Seguidores en Instagram' },
  { number: '15k+', label: 'Suscriptores en YouTube' },
];

export function CommunitySection() {
  return (
    <section className="py-32 bg-surface">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 text-4xl mb-4">
              <Heart className="text-error fill-error" size={32} />
              <span>🌿</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-fg">
              Una Comunidad de
              <br />
              <span className="text-brand">40,000+ Personas</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Cada día, miles de personas alrededor del mundo crean vida en frascos,
              comparten sus historias y aprenden juntos.
            </p>
          </FadeIn>
        </div>

        {/* Instagram Feed */}
        <FadeIn delay={0.6}>
          <div className="mb-12 max-w-5xl mx-auto">
            <InstagramFeed limit={8} fallbackPhotos={fallbackPhotos} />
          </div>
        </FadeIn>

        {/* CTA Instagram */}
        <FadeIn delay={0.8}>
          <div className="text-center space-y-6">
            <p className="text-muted text-lg">
              Únete a la comunidad en Instagram y comparte tu viaje
            </p>
            <Button
              href="https://www.instagram.com/comoelmusguito"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
              icon={<Instagram size={24} />}
            >
              @comoelmusguito
            </Button>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={1}>
          <div className="grid grid-cols-2 gap-12 mt-20 max-w-2xl mx-auto">
            {communityStats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="stat-number text-5xl md:text-6xl mb-3">
                  {stat.number}
                </div>
                <div className="text-muted text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

