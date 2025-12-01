/**
 * Página: Sobre el Musguito
 * Narrativa sobre Tomás Barrera y su proyecto
 */

import { FadeIn } from '@/components/animations';
import { Leaf, BookOpen, Sparkles, Droplets, Home, Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Sobre el Musguito | Tomás Barrera',
  description: 'Conoce la historia de Tomás Barrera, licenciado en Literatura y Horticultor, creador de terrarios autosuficientes y fundador de Como el Musguito.',
};

export default function SobrePage() {
  return (
    <div className="pt-32 pb-16">
      {/* Hero Section */}
      <section className="container mb-24">
        <FadeIn>
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-vida/20 mb-6">
              <Leaf className="text-vida" size={40} />
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-forest leading-tight">
              Sobre el
              <br />
              <span className="text-musgo">Musguito</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray leading-relaxed max-w-2xl mx-auto">
              La historia de cómo un licenciado en Literatura encontró su vocación
              en los musgos y creó un universo de vida en miniatura.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Origen - Formación Humanista */}
      <section className="container mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-natural-lg">
              <Image
                src="/images/about/tomas-table.png"
                alt="Tomás Barrera en su taller"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={0.2}>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 text-musgo mb-4">
                <BookOpen size={24} />
                <span className="font-display text-2xl font-semibold">El Origen</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-forest leading-tight">
                Formación
                <br />
                <span className="text-musgo">Humanista</span>
              </h2>
              <div className="space-y-4 text-lg text-gray leading-relaxed">
                <p>
                  <strong className="text-forest">Tomás Barrera es licenciado en Literatura y Horticultor.</strong> Su formación es humanista. Su acercamiento al mundo de la botánica comenzó como un pasatiempo que se fue estrechando, a medida que se relacionaba con las plantas.
                </p>
                <p>
                  En este proceso le surgieron preguntas que lo motivaron a investigar sobre horticultura, botánica y ecología de forma autodidacta. En el 2019 comienza su proyecto de investigación y realización visual-botánica <strong className="text-musgo">"Como el musguito"</strong>.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* El Descubrimiento - 2018 */}
      <section className="bg-gradient-to-b from-cream to-white py-32 mb-32">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 text-vida mb-4">
                  <Sparkles size={24} />
                  <span className="font-display text-2xl font-semibold">El Descubrimiento</span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-forest mb-6">
                  El Momento del
                  <br />
                  <span className="text-vida">Musguito</span>
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-lg space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-6xl text-musgo/20 font-display">"</div>
                  <div className="space-y-4 text-lg md:text-xl text-gray leading-relaxed flex-1">
                    <p>
                      En 2018, después de trabajar en la recuperación de un jardín abandonado y tras algunas lluvias, Tomás Barrera fue testigo del inicio de la temporada de musgos en Santiago.
                    </p>
                    <p className="text-2xl md:text-3xl font-display text-forest font-semibold italic">
                      "Esto me maravilló profundamente, pero los musgos no duraron mucho"
                    </p>
                    <p>
                      Medio obsesionado por ese hallazgo, empezó a experimentar y así, entre ensayo y error, empezó a desarrollar sus propios terrarios autosuficientes, que <strong className="text-musgo">"enaltecen lo natural y pequeño"</strong>, como cuenta Tomás.
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* El Proceso - Filosofía */}
      <section className="container mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <FadeIn direction="left">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-3 text-vida mb-4">
                <Droplets size={24} />
                <span className="font-display text-2xl font-semibold">La Filosofía</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-forest leading-tight">
                Ecosistemas
                <br />
                <span className="text-vida">Saludables</span>
              </h2>
              <div className="space-y-4 text-lg text-gray leading-relaxed">
                <p>
                  <strong className="text-forest">"Buscamos la belleza a través de la salud de las plantas"</strong> y con esto en mente nos dedicamos a la producción de terrarios colaborando con seres vivos de los cinco reinos.
                </p>
                <p>
                  Cada terrario es un ecosistema completo, un pequeño universo donde la vida se desarrolla de forma autónoma. No son solo decoración, son <strong className="text-musgo">ventanas a la naturaleza</strong>, recordatorios de que la vida puede florecer en cualquier lugar.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="right" delay={0.2}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-natural-lg">
              <Image
                src="/images/about/terrarios-musguito-1.jpg"
                alt="Terrarios autosuficientes creados por Tomás Barrera"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* El Taller */}
      <section className="bg-gradient-to-b from-white to-cream py-32 mb-32">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 text-musgo mb-4">
                  <Home size={24} />
                  <span className="font-display text-2xl font-semibold">El Espacio</span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-forest mb-6">
                  El Taller
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl p-8 shadow-natural-lg">
                  <h3 className="font-display text-2xl font-semibold text-forest mb-4">
                    Visítanos
                  </h3>
                  <p className="text-gray leading-relaxed mb-6">
                    Estas creaciones se pueden ver de lunes a viernes en su taller (Santa Isabel 676, Providencia), donde siempre tiene un stock disponible, de distintos formatos y tamaños.
                  </p>
                  <p className="text-lg text-musgo font-semibold">
                    "Estas visitas son muy entretenidas pues el taller es un espacio muy cautivante con un ambiente de laboratorio, repleto de terrarios, materiales y plantas tropicales"
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-natural-lg">
                  <h3 className="font-display text-2xl font-semibold text-forest mb-4">
                    Aprende con Nosotros
                  </h3>
                  <p className="text-gray leading-relaxed mb-6">
                    Para los que les interesa aprender más sobre esta técnica, Tomás también ofrece cursos y clases personalizadas en el taller.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/cursos"
                      className="inline-flex items-center gap-2 text-musgo hover:text-vida transition-colors font-semibold"
                    >
                      Ver Cursos Online →
                    </Link>
                    <Link
                      href="/talleres"
                      className="inline-flex items-center gap-2 text-musgo hover:text-vida transition-colors font-semibold"
                    >
                      Ver Talleres Presenciales →
                    </Link>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* La Comunidad */}
      <section className="container mb-24">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-3 text-vida mb-4">
              <Instagram size={24} />
              <span className="font-display text-2xl font-semibold">La Comunidad</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-forest">
              Conecta con
              <br />
              <span className="text-vida">el Musguito</span>
            </h2>
            <div className="space-y-4 text-lg text-gray leading-relaxed">
              <p>
                También se pueden ver a través de su Instagram,{' '}
                <a
                  href="https://www.instagram.com/comoelmusguito/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-musgo hover:text-vida font-semibold transition-colors"
                >
                  @comoelmusguito
                </a>
                , donde también se pueden hacer encargo especiales.
              </p>
              <p>
                Únete a una comunidad de más de 40,000 personas que comparten la pasión por crear vida y conectar con la naturaleza.
              </p>
            </div>
            <div className="pt-8">
              <a
                href="https://www.instagram.com/comoelmusguito/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-musgo to-vida text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                <Instagram size={24} />
                Seguir en Instagram
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* CTA Final */}
      <section className="container">
        <FadeIn>
          <div className="bg-gradient-to-br from-musgo to-vida rounded-3xl p-12 md:p-16 text-center text-white">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para crear vida?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Explora nuestros terrarios, aprende con nuestros cursos o únete a un taller presencial.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/terrarios"
                className="bg-white text-musgo px-8 py-4 rounded-full font-semibold hover:bg-cream transition-colors"
              >
                Ver Terrarios
              </Link>
              <Link
                href="/cursos"
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors"
              >
                Ver Cursos
              </Link>
              <Link
                href="/talleres"
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors"
              >
                Ver Talleres
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}

