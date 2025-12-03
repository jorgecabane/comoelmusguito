/**
 * Página: Sustentabilidad
 */

import { FadeIn } from '@/components/animations';
import { Leaf, Recycle, Droplets, Heart, Sprout, Globe } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Sustentabilidad | Como el Musguito',
  description: 'Nuestro compromiso con la sustentabilidad y el cuidado del medio ambiente en Como el Musguito.',
};

const sustainabilityPrinciples = [
  {
    icon: Sprout,
    title: 'Recolección Sustentable',
    description: 'Todo el musgo que utilizamos es recolectado de forma responsable, respetando los ecosistemas naturales y asegurando la regeneración de las áreas.',
  },
  {
    icon: Recycle,
    title: 'Materiales Reutilizables',
    description: 'Utilizamos contenedores y materiales que pueden reutilizarse o reciclarse. Promovemos la reutilización de nuestros terrarios cuando las plantas crecen.',
  },
  {
    icon: Droplets,
    title: 'Conservación de Agua',
    description: 'Los terrarios cerrados son ecosistemas autosuficientes que requieren mínima agua, promoviendo la conservación de este recurso vital.',
  },
  {
    icon: Leaf,
    title: 'Plantas Nativas',
    description: 'Priorizamos el uso de plantas nativas chilenas, que están mejor adaptadas al clima local y requieren menos recursos para prosperar.',
  },
  {
    icon: Globe,
    title: 'Producción Local',
    description: 'Todo nuestro proceso de creación es local en Santiago, reduciendo la huella de carbono asociada al transporte y apoyando la economía local.',
  },
  {
    icon: Heart,
    title: 'Educación Ambiental',
    description: 'A través de nuestros cursos y talleres, educamos sobre la importancia de los ecosistemas y cómo cuidarlos, creando conciencia ambiental.',
  },
];

export default function SustentabilidadPage() {
  return (
    <div className="pt-32 pb-16">
      <div className="container max-w-4xl">
        <FadeIn>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vida/20 mb-6">
              <Leaf className="text-vida" size={32} />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
              Nuestro Compromiso con la Sustentabilidad
            </h1>
            <p className="text-gray text-lg">
              Cuidamos el planeta mientras creamos vida en miniatura
            </p>
          </div>

          {/* Intro */}
          <div className="bg-gradient-to-br from-vida/10 to-musgo/10 rounded-2xl p-8 md:p-12 mb-12">
            <p className="text-lg text-gray leading-relaxed text-center">
              En <strong>Como el Musguito</strong>, creemos que la belleza y la sustentabilidad van de la mano. 
              Cada terrario que creamos es un compromiso con el cuidado del medio ambiente, utilizando prácticas 
              responsables y materiales que respetan la naturaleza.
            </p>
          </div>

          {/* Principles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {sustainabilityPrinciples.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="bg-white rounded-xl border border-gray/20 p-6 hover:shadow-natural-lg transition-shadow">
                    <div className="w-12 h-12 rounded-lg bg-musgo/20 flex items-center justify-center mb-4">
                      <Icon className="text-musgo" size={24} />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-forest mb-2">
                      {principle.title}
                    </h3>
                    <p className="text-gray text-sm leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>

          {/* Detailed Sections */}
          <div className="space-y-12">
            <section>
              <h2 className="font-display text-3xl font-semibold text-forest mb-6">
                Recolección Responsable de Musgo
              </h2>
              <div className="bg-cream/50 rounded-xl p-6">
                <p className="text-gray leading-relaxed mb-4">
                  El musgo es el corazón de nuestros terrarios, y su recolección es un proceso cuidadoso y respetuoso:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                  <li>Recolectamos solo de áreas donde el musgo es abundante y puede regenerarse naturalmente</li>
                  <li>Nunca tomamos más del 20% del musgo disponible en un área</li>
                  <li>Evitamos áreas protegidas o ecosistemas frágiles</li>
                  <li>Dejamos tiempo suficiente entre recolecciones para permitir la regeneración</li>
                  <li>Trabajamos con comunidades locales que conocen y respetan el territorio</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-semibold text-forest mb-6">
                Plantas Nativas y Adaptadas
              </h2>
              <div className="bg-cream/50 rounded-xl p-6">
                <p className="text-gray leading-relaxed mb-4">
                  Priorizamos el uso de plantas nativas chilenas y especies adaptadas al clima local:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                  <li>Plantas que requieren menos agua y mantenimiento</li>
                  <li>Especies que prosperan en condiciones de terrario sin necesidad de recursos externos</li>
                  <li>Evitamos plantas invasoras que puedan afectar ecosistemas locales</li>
                  <li>Promovemos la biodiversidad local</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-semibold text-forest mb-6">
                Producción Artesanal Local
              </h2>
              <div className="bg-cream/50 rounded-xl p-6">
                <p className="text-gray leading-relaxed mb-4">
                  Nuestra producción 100% local tiene múltiples beneficios ambientales:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                  <li>Reducción de la huella de carbono al evitar transporte de larga distancia</li>
                  <li>Apoyo a la economía local y artesanos chilenos</li>
                  <li>Control directo sobre los materiales y procesos utilizados</li>
                  <li>Menor uso de empaques y materiales de transporte</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-semibold text-forest mb-6">
                Ecosistemas Autosuficientes
              </h2>
              <div className="bg-cream/50 rounded-xl p-6">
                <p className="text-gray leading-relaxed">
                  Los terrarios cerrados que creamos son ecosistemas autosuficientes que:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray ml-4 mt-4">
                  <li>Reciclan su propia agua a través del ciclo de condensación</li>
                  <li>Requieren mínima intervención humana una vez establecidos</li>
                  <li>Demuestran cómo los ecosistemas naturales funcionan en equilibrio</li>
                  <li>Pueden durar años con cuidados mínimos, reduciendo el consumo de recursos</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-semibold text-forest mb-6">
                Educación y Conciencia
              </h2>
              <div className="bg-cream/50 rounded-xl p-6">
                <p className="text-gray leading-relaxed mb-4">
                  Creemos que la educación es fundamental para el cambio. Por eso:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray ml-4">
                  <li>Nuestros cursos enseñan sobre ecosistemas y su importancia</li>
                  <li>Compartimos conocimientos sobre plantas nativas y su cuidado</li>
                  <li>Promovemos prácticas de jardinería sustentable</li>
                  <li>Inspiramos a más personas a conectarse con la naturaleza de forma responsable</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-semibold text-forest mb-6">
                Nuestro Futuro
              </h2>
              <div className="bg-gradient-to-br from-musgo/10 to-vida/10 rounded-xl p-8">
                <p className="text-gray leading-relaxed text-center">
                  Estamos comprometidos a continuar mejorando nuestras prácticas sustentables. 
                  Trabajamos constantemente en encontrar nuevas formas de reducir nuestro impacto ambiental 
                  mientras creamos productos hermosos que conectan a las personas con la naturaleza.
                </p>
                <p className="text-gray leading-relaxed text-center mt-4">
                  <strong>Juntos, podemos crear un futuro más verde.</strong> 🌿
                </p>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-12 bg-forest text-cream rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl font-semibold mb-4">
              ¿Quieres saber más?
            </h2>
            <p className="text-cream/80 mb-6">
              Contáctanos si tienes preguntas sobre nuestras prácticas sustentables
            </p>
            <a
              href="/contacto"
              className="inline-flex items-center justify-center px-6 py-3 bg-cream text-forest rounded-lg hover:bg-cream/90 transition-colors font-medium"
            >
              Contactar
            </a>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

