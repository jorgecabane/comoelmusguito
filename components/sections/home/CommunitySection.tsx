/**
 * Community Section
 * Social proof y comunidad
 */

'use client';

import { FadeIn } from '@/components/animations';
import { Button } from '@/components/ui';
import { Instagram, Heart } from 'lucide-react';
import { InstagramFeed } from '@/components/social/InstagramFeed';

export function CommunitySection() {
  return (
    <section className="py-32 bg-gradient-to-br from-vida/5 to-musgo/5">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <FadeIn>
            <div className="inline-flex items-center gap-2 text-4xl mb-4">
              <Heart className="text-red-500 fill-red-500" size={32} />
              <span>🌿</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest">
              Una Comunidad de
              <br />
              <span className="text-musgo">40,000+ Personas</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.4}>
            <p className="text-xl text-gray max-w-2xl mx-auto">
              Cada día, miles de personas alrededor del mundo crean vida en frascos,
              comparten sus historias y aprenden juntos.
            </p>
          </FadeIn>
        </div>

        {/* Instagram Feed */}
        <FadeIn delay={0.6}>
          <div className="mb-12 max-w-5xl mx-auto">
            <InstagramFeed limit={8} />
          </div>
        </FadeIn>

        {/* CTA Instagram */}
        <FadeIn delay={0.8}>
          <div className="text-center space-y-6">
            <p className="text-gray text-lg">
              Únete a la comunidad en Instagram y comparte tu viaje
            </p>
            <a
              href="https://www.instagram.com/comoelmusguito"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg" icon={<Instagram size={24} />}>
                @comoelmusguito
              </Button>
            </a>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-20 max-w-4xl mx-auto">
            {[
              { number: '40k+', label: 'Seguidores Instagram' },
              { number: '2,000+', label: 'Estudiantes Felices' },
              { number: '500+', label: 'Terrarios Viviendo' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl md:text-6xl font-display font-bold text-musgo mb-3">
                  {stat.number}
                </div>
                <div className="text-gray text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

