/**
 * Final CTA Section
 * "Tu Turno" - Llamado a la acción final
 */

'use client';

import { FadeIn, ParallaxSection } from '@/components/animations';
import { Button, Section } from '@/components/ui';
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
    <Section tone="soft" contained={false} className="relative overflow-hidden">
      {/* Pattern decorativo */}
      <div className="absolute inset-0 opacity-[0.06]">
        <div className="absolute inset-0 bg-dots" />
      </div>

      <ParallaxSection speed={-0.2} className="relative z-10">
        <div className="container">
          <div className="max-w-6xl mx-auto text-center text-fg space-y-16">
            {/* Header */}
            <FadeIn>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 bg-fg/10 px-6 py-3 rounded-full mb-4">
                  <Leaf size={20} />
                  <span className="font-semibold">Capítulo Final</span>
                </div>

                <h2 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold leading-tight">
                  ¿Qué Crearás
                  <br />
                  <span className="text-brand">Tú</span>?
                </h2>

                <p className="text-xl md:text-2xl text-muted max-w-2xl mx-auto leading-relaxed">
                  Tu viaje puede comenzar de muchas formas.
                  Elige la tuya.
                </p>
              </div>
            </FadeIn>

            {/* Paths */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {paths.map((path, i) => (
                <FadeIn key={i} delay={0.2 + i * 0.1}>
                  <Link href={path.href}>
                    <div className="group bg-surface/60 rounded-2xl p-8 hover:bg-surface transition-all duration-300 hover:scale-105 hover:shadow-natural-lg cursor-pointer border border-line">
                      <div className="space-y-6">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-fg/10 group-hover:bg-fg/15 transition-colors">
                          {path.icon}
                        </div>

                        {/* Content */}
                        <div className="space-y-3">
                          <h3 className="font-display text-2xl md:text-3xl font-bold">
                            {path.title}
                          </h3>
                          <p className="text-muted text-lg">
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
                <p className="text-2xl md:text-3xl font-display">
                  "La vida encuentra su camino...
                  <br />
                  <span className="text-brand">incluso en un frasco de vidrio."</span>
                </p>
                <p className="text-muted">
                  — Tomás Barrera, el Musguito 🌿
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </ParallaxSection>
    </Section>
  );
}

