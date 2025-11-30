/**
 * Final CTA Section
 * "Tu Turno" - Llamado a la acción final
 */

'use client';

import { FadeIn, ParallaxSection } from '@/components/animations';
import { Button } from '@/components/ui';
import { Leaf, BookOpen, Users, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export function FinalCTA() {
  const paths = [
    {
      icon: <Leaf size={40} />,
      title: 'Quiero un Ecosistema',
      description: 'Explora terrarios únicos hechos a mano',
      cta: 'Ver Terrarios',
      href: '/terrarios',
      color: 'musgo',
    },
    {
      icon: <BookOpen size={40} />,
      title: 'Quiero Aprender',
      description: 'Cursos online para crear tus propios terrarios',
      cta: 'Ver Cursos',
      href: '/cursos',
      color: 'vida',
    },
    {
      icon: <Users size={40} />,
      title: 'Quiero Conocerte',
      description: 'Talleres presenciales en Santiago',
      cta: 'Ver Talleres',
      href: '/talleres',
      color: 'tierra',
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-musgo via-vida to-musgo-dark" />
      
      {/* Pattern decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <ParallaxSection speed={-0.2} className="relative z-10">
        <div className="container">
          <div className="max-w-6xl mx-auto text-center text-white space-y-16">
            {/* Header */}
            <FadeIn>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-4">
                  <Leaf size={20} />
                  <span className="font-semibold">Capítulo Final</span>
                </div>

                <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
                  ¿Qué Crearás
                  <br />
                  <span className="text-yellow-300">Tú</span>?
                </h2>

                <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
                  Tu viaje hacia crear vida puede comenzar de muchas formas.
                  Elige la tuya.
                </p>
              </div>
            </FadeIn>

            {/* Paths */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {paths.map((path, i) => (
                <FadeIn key={i} delay={0.2 + i * 0.1}>
                  <Link href={path.href}>
                    <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer border border-white/20">
                      <div className="space-y-6">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                          {path.icon}
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h3 className="font-display text-2xl md:text-3xl font-bold">
                            {path.title}
                          </h3>
                          <p className="text-white/80 text-lg">
                            {path.description}
                          </p>
                        </div>

                        {/* CTA */}
                        <div className="pt-4">
                          <span className="inline-flex items-center gap-2 font-semibold group-hover:gap-3 transition-all">
                            {path.cta}
                            <span className="text-xl">→</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>

            {/* Mensaje final */}
            <FadeIn delay={0.8}>
              <div className="pt-12 space-y-6">
                <p className="text-2xl md:text-3xl font-display italic">
                  "La vida encuentra su camino...
                  <br />
                  <span className="text-yellow-300">incluso en un frasco de vidrio."</span>
                </p>
                <p className="text-white/60">
                  — Tomás Barrera, el Musguito 🌿
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </ParallaxSection>
    </section>
  );
}

