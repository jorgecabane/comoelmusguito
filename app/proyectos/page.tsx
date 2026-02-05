/**
 * Página: Listado de Proyectos
 * Catálogo de proyectos grandes realizados por el Musguito
 */

import { getAllBlogPosts } from '@/lib/sanity/fetch';
import { BlogCard } from '@/components/blog';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { FadeIn } from '@/components/animations';
import { Leaf, Camera, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export const revalidate = 60;

export const metadata = {
  title: 'Proyectos | comoelmusguito',
  description:
    'Descubre los proyectos grandes realizados por el Musguito. Instalaciones, proyectos comerciales y residenciales con terrarios artesanales.',
};

export default async function ProyectosPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className="pt-32 pb-16">
      <Breadcrumb items={[{ label: 'Proyectos' }]} />
      
      {/* Header */}
      <section className="container mb-16">
        <FadeIn>
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl md:text-6xl font-bold text-forest mb-6">
              Proyectos del Musguito
            </h1>
            <p className="text-xl text-gray leading-relaxed">
              Documentación de proyectos grandes realizados por Tomás Barrera. 
              Instalaciones, proyectos comerciales y residenciales que muestran 
              el potencial de los terrarios como elementos de diseño y vida.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Beneficios */}
      <section className="container mb-16">
        <FadeIn delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Leaf className="text-musgo" size={32} />,
                title: 'Proyectos Únicos',
                description: 'Cada proyecto es una obra única adaptada al espacio',
              },
              {
                icon: <Camera className="text-musgo" size={32} />,
                title: 'Documentación Completa',
                description: 'Fotos y videos del proceso y resultado final',
              },
              {
                icon: <Video className="text-musgo" size={32} />,
                title: 'Experiencias Inmersivas',
                description: 'Cada entrada cuenta la historia completa del proyecto',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-cream p-6 rounded-lg text-center space-y-3"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-vida/20">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-forest">
                  {item.title}
                </h3>
                <p className="text-gray">{item.description}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Mensaje si no hay posts */}
      {posts.length === 0 ? (
        <section className="container">
          <FadeIn>
            <div className="bg-cream/50 rounded-2xl p-12 text-center">
              <p className="text-xl text-gray mb-6">
                Estamos documentando nuevos proyectos. Vuelve pronto 🌱
              </p>
              <Link href="/terrarios">
                <Button variant="primary">Ver Terrarios</Button>
              </Link>
            </div>
          </FadeIn>
        </section>
      ) : (
        <>
          {/* Grid de Proyectos */}
          <section className="container">
            <h2 className="font-display text-3xl font-semibold text-forest mb-8">
              Todos los Proyectos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <FadeIn key={post._id} delay={0.1}>
                  <BlogCard post={post} />
                </FadeIn>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="container mt-24">
            <FadeIn>
              <div className="bg-gradient-to-br from-musgo/10 to-vida/10 rounded-2xl p-12 text-center">
                <h2 className="font-display text-3xl font-semibold text-forest mb-4">
                  ¿Tienes un Proyecto en Mente?
                </h2>
                <p className="text-gray mb-6 max-w-2xl mx-auto">
                  Si estás interesado en realizar un proyecto con terrarios, 
                  contáctanos para discutir tus ideas.
                </p>
                <Link href="/contacto">
                  <Button variant="primary" size="lg">
                    Contactar
                  </Button>
                </Link>
              </div>
            </FadeIn>
          </section>
        </>
      )}
    </div>
  );
}
