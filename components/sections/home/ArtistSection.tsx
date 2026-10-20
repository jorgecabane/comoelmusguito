/**
 * Artist Section - Tomás Barrera
 * Con parallax y animaciones
 */

'use client';

import { FadeIn, ParallaxSection } from '@/components/animations';
import { Leaf } from 'lucide-react';
import Image from 'next/image';

export function ArtistSection() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-bg to-surface overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 bg-olivo rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Foto de Tomás: completa en todos los tamaños (parallax suave) */}
          <ParallaxSection speed={-0.3} className="max-w-md mx-auto w-full lg:max-w-none">
            <FadeIn direction="left" duration={0.8}>
              <div className="relative aspect-[4/5] lg:aspect-[3/4] rounded-2xl overflow-hidden shadow-natural-lg">
                <Image
                  src="/images/about/tomas-musguito.jpg"
                  alt="Tomás Barrera en su taller con plantas"
                  fill
                  className="object-cover object-[50%_35%]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </FadeIn>
          </ParallaxSection>

          {/* Contenido */}
          <div className="space-y-8 relative">
            <FadeIn delay={0.2}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-olivo/20 mb-4 relative z-10">
                <Leaf className="text-brand" size={32} />
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-fg leading-tight relative z-10">
                Hola, soy
                <br />
                <span className="text-brand">Tomás Barrera</span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.6}>
              <div className="space-y-6 text-lg md:text-xl text-muted leading-relaxed relative z-10">
                <p>
                  Pero me conocen como <span className="text-brand font-semibold">el Musguito</span>.
                </p>
                
                <p className="text-2xl md:text-3xl font-display text-fg font-semibold">
                  No solo vendo terrarios.
                  <br />
                  Cultivo ecosistemas.
                  <br />
                  Capturo paisajes.
                  <br />
                  Enseño a crear vida.
                </p>

                <p>
                  Cada terrario es una historia única. Un rincón de bosque, 
                  un recordatorio de que la vida puede florecer en cualquier lugar.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.8}>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-line relative z-10">
                {[
                  { number: '40k+', label: 'Comunidad IG' },
                  { number: '500+', label: 'Terrarios Creados' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="stat-number text-3xl md:text-4xl">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted mt-2">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

