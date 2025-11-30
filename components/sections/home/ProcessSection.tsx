/**
 * Process Section - Scroll Horizontal Interactivo
 * Muestra el proceso de creación paso a paso
 */

'use client';

import { FadeIn } from '@/components/animations';
import { Leaf, Sparkles, Palette, Heart } from 'lucide-react';
import Image from 'next/image';

const processSteps = [
  {
    step: '01',
    title: 'Recolección',
    description: 'Recolecto musgo y plantas nativas de forma sustentable, respetando el ecosistema.',
    icon: Leaf,
    image: '/images/process/proceso-01-recoleccion.jpg', // TODO: Reemplazar con foto real
    imagePlaceholder: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
    story: 'Cada salida al bosque es una aventura. Este musgo tiene 3 meses creciendo en mi taller.',
  },
  {
    step: '02',
    title: 'Cultivo',
    description: 'Cuido y propago las especies, esperando el momento perfecto para cada planta.',
    icon: Sparkles,
    image: '/images/process/proceso-02-cultivo.jpg', // TODO: Reemplazar con foto real
    imagePlaceholder: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&q=80',
    story: 'La paciencia es clave. Algunas especies tardan semanas en adaptarse.',
  },
  {
    step: '03',
    title: 'Diseño',
    description: 'Compongo cada terrario como una obra de arte, creando capas y profundidad.',
    icon: Palette,
    image: '/images/process/proceso-03-diseño.jpg', // TODO: Reemplazar con foto real
    imagePlaceholder: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800&q=80',
    story: 'Esta piedra la encontré en un río. Cada elemento cuenta una historia.',
  },
  {
    step: '04',
    title: 'Vida',
    description: 'El ecosistema cobra vida, autosustentable y listo para crecer contigo.',
    icon: Heart,
    image: '/images/process/proceso-04-vida.jpg', // TODO: Reemplazar con foto real
    imagePlaceholder: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80',
    story: 'Ver cómo un terrario crece y evoluciona es mágico. Cada uno es único.',
  },
];

export function ProcessSection() {
  return (
    <section className="py-32 bg-gradient-to-br from-musgo/5 via-cream to-vida/5">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-20 space-y-6">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-forest">
              El Proceso Artesanal
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-xl text-gray max-w-2xl mx-auto">
              Cada terrario pasa por un cuidadoso proceso de creación.
              No es magia, es dedicación y amor por la naturaleza.
            </p>
          </FadeIn>
        </div>

        {/* Process Steps - Con línea cronológica */}
        <div className="relative">
          {/* Línea cronológica vertical (solo desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-musgo via-vida to-musgo-dark transform -translate-x-1/2 opacity-20" />
          
          <div className="space-y-24 md:space-y-32">
          {processSteps.map((step, index) => (
            <FadeIn key={step.step} delay={index * 0.2}>
              <div
                className={`relative grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                {/* Imagen */}
                <div
                  className={`relative ${
                    index % 2 === 1 ? 'lg:col-start-2' : ''
                  }`}
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-natural-lg group">
                    <Image
                      src={step.imagePlaceholder} // Usando placeholder por ahora
                      alt={step.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    
                    {/* Overlay con historia */}
                    <div className="absolute inset-0 bg-gradient-to-t from-forest/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-8">
                      <p className="text-white text-lg italic">
                        "{step.story}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-musgo text-white">
                    <step.icon size={32} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl md:text-7xl font-display font-bold text-musgo/20">
                        {step.step}
                      </span>
                      <h3 className="text-3xl md:text-4xl font-display font-bold text-forest">
                        {step.title}
                      </h3>
                    </div>

                    <p className="text-xl text-gray leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Decorative arrow para desktop */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block pt-8">
                      <div className="flex items-center gap-2 text-vida">
                        <div className="h-px flex-1 bg-vida/30" />
                        <span className="text-2xl">→</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Línea divisoria horizontal en mobile */}
                {index < processSteps.length - 1 && (
                  <div className="lg:hidden mt-12 mb-12">
                    <div className="h-px bg-gradient-to-r from-transparent via-musgo/30 to-transparent" />
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

