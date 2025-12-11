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
    <section className="relative py-32 bg-gradient-to-b from-cream to-white overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 bg-vida rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-musgo rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Imagen con parallax - Desktop (JPG) */}
          <ParallaxSection speed={-0.3} className="hidden lg:block">
            <FadeIn direction="left" duration={0.8}>
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-natural-lg">
                <Image
                  src="/images/about/tomas-portrait.jpg"
                  alt="Tomás Barrera en su taller con plantas"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </FadeIn>
          </ParallaxSection>

          {/* Contenido */}
          <div className="space-y-8 relative">
            {/* Imagen de fondo solo en mobile - alineada con "No vendo terrarios" */}
            <div className="lg:hidden absolute top-0 right-0 w-40 h-56 opacity-75 rounded-2xl overflow-hidden pointer-events-none">
              <Image
                src="/images/about/tomas-portrait.png"
                alt="Tomás Barrera"
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>

            <FadeIn delay={0.2}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vida/20 mb-4 relative z-10">
                <Leaf className="text-vida" size={32} />
              </div>
            </FadeIn>

            <FadeIn delay={0.4}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest leading-tight relative z-10">
                Hola, soy
                <br />
                <span className="text-musgo">Tomás Barrera</span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.6}>
              <div className="space-y-6 text-lg md:text-xl text-gray leading-relaxed relative z-10">
                <p>
                  Pero me conocen como <span className="text-musgo font-semibold">el Musguito</span>.
                </p>
                
                <p className="text-2xl md:text-3xl font-display text-forest font-semibold">
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
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray/20 relative z-10">
                {[
                  { number: '40k+', label: 'Comunidad IG' },
                  { number: '500+', label: 'Terrarios Creados' },
                  { number: '∞', label: 'Posibilidades' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-musgo font-display">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray mt-2">{stat.label}</div>
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

