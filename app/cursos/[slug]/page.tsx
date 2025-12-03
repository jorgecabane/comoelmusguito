/**
 * Página: Detalle de Curso
 * Datos desde Sanity CMS
 */

import { getCourseBySlug, getAllCourses } from '@/lib/sanity/fetch';
import { getImageUrl, formatPriceWithSale, levelLabels, getCoursePrice } from '@/lib/sanity/utils';
import { getUserCurrency } from '@/lib/utils/geolocation';
import { getSession } from '@/lib/auth/get-session';
import { getUserByEmail } from '@/lib/auth/sanity-adapter';
import { hasCourseAccess } from '@/lib/sanity/course-access';
import { Badge, Button, VideoPlayer } from '@/components/ui';
import { Play, Clock, BookOpen, Award, CheckCircle2, Download, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CourseDetail } from '@/components/product/CourseDetail';

export const revalidate = 60;
// Forzar renderizado dinámico porque usamos geolocalización
export const dynamic = 'force-dynamic';

interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ requireAuth?: string; requireAccess?: string }>;
}

// Generate static params for all courses
export async function generateStaticParams() {
  const cursos = await getAllCourses();
  return cursos.map((curso) => ({
    slug: curso.slug.current,
  }));
}

// Generate metadata
export async function generateMetadata({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) {
    return {
      title: 'Curso no encontrado',
    };
  }

  return {
    title: course.seo?.metaTitle || course.name,
    description: course.seo?.metaDescription || course.shortDescription,
  };
}

export default async function CoursePage({ 
  params,
  searchParams,
}: CoursePageProps & {
  searchParams: Promise<{ requireAuth?: string; requireAccess?: string }>;
}) {
  const { slug } = await params;
  const params_search = await searchParams;
  const course = await getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  // Verificar si el usuario tiene acceso
  const session = await getSession();
  let hasAccess = false;
  
  if (session?.user?.email) {
    const user = await getUserByEmail(session.user.email);
    if (user?._id) {
      hasAccess = await hasCourseAccess(user._id, course._id);
    }
  }

  // Detectar moneda del usuario
  const userCurrency = await getUserCurrency();
  const coursePricing = getCoursePrice(course, userCurrency);
  const pricing = formatPriceWithSale(
    coursePricing.price,
    coursePricing.salePrice,
    coursePricing.currency
  );

  const levelLabel = course.level ? levelLabels[course.level] : 'Todos';

  return (
    <div className="pt-32 pb-16">
      {/* Breadcrumb */}
      <div className="container mb-8">
        <div className="flex items-center gap-2 text-sm text-gray">
          <Link href="/" className="hover:text-musgo transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/cursos" className="hover:text-musgo transition-colors">
            Cursos
          </Link>
          <span>/</span>
          <span className="text-forest">{course.name}</span>
        </div>
      </div>

      {/* Mensajes de alerta según query params */}
      {params_search?.requireAuth === 'true' && (
        <div className="container mb-6">
          <div className="bg-musgo/10 border border-musgo/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-musgo mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-forest mb-1">
                  Inicia sesión para continuar
                </p>
                <p className="text-sm text-gray mb-3">
                  Necesitas iniciar sesión para acceder a este curso.
                </p>
                <Link href={`/auth/login?callbackUrl=${encodeURIComponent(`/cursos/${slug}`)}`}>
                  <Button variant="primary" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {params_search?.requireAccess === 'true' && (
        <div className="container mb-6">
          <div className="bg-vida/10 border border-vida/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="text-vida mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-forest mb-1">
                  Acceso Requerido
                </p>
                <p className="text-sm text-gray mb-3">
                  Necesitas comprar este curso para acceder al contenido completo.
                </p>
                <div className="flex gap-2">
                  <CourseDetail course={course} userCurrency={userCurrency} />
                  <Link href="/mi-cuenta?tab=cursos">
                    <Button variant="secondary" size="sm">
                      Ver Mis Cursos
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="container mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="info">{levelLabel}</Badge>
                {pricing.hasDiscount && (
                  <Badge variant="error">¡Oferta!</Badge>
                )}
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
                {course.name}
              </h1>
              <p className="text-xl text-gray leading-relaxed">
                {course.shortDescription}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 py-4">
              <div className="flex items-center gap-2">
                <Clock className="text-musgo" size={20} />
                <span className="text-gray">{course.duration} horas</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="text-musgo" size={20} />
                <span className="text-gray">{course.lessonCount} lecciones</span>
              </div>
              {course.certificate && (
                <div className="flex items-center gap-2">
                  <Award className="text-musgo" size={20} />
                  <span className="text-gray">Con certificado</span>
                </div>
              )}
            </div>

            {/* Price & CTA (Cliente Component) */}
            <CourseDetail course={course} userCurrency={userCurrency} />
          </div>

          {/* Video Player o Thumbnail */}
          {course.promoVideo?.url ? (
            <VideoPlayer
              src={course.promoVideo.url}
              poster={getImageUrl(course.thumbnail, { width: 1200, height: 675 })}
              className="aspect-video"
              autoplay={false}
              controls={true}
            />
          ) : (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-cream shadow-natural-xl">
              <Image
                src={getImageUrl(course.thumbnail, { width: 1200, height: 675 })}
                alt={course.thumbnail?.alt || course.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* What you'll learn */}
      {course.learningOutcomes && course.learningOutcomes.length > 0 && (
        <section className="container mb-16">
          <div className="bg-cream rounded-2xl p-8 md:p-12">
            <h2 className="font-display text-3xl font-semibold text-forest mb-8">
              ¿Qué Aprenderás?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="text-vida shrink-0 mt-1" size={20} />
                  <span className="text-gray">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Course Content */}
      {course.modules && course.modules.length > 0 && (
        <section className="container mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-semibold text-forest">
              Contenido del Curso
            </h2>
            {!hasAccess && (
              <Badge variant="warning" className="flex items-center gap-2">
                <Lock size={14} />
                Requiere compra
              </Badge>
            )}
          </div>
          <div className="space-y-4 max-w-3xl">
            {course.modules.map((module, index) => (
              <details
                key={index}
                className="bg-white border border-gray/20 rounded-xl overflow-hidden group"
                open={hasAccess && index === 0} // Abrir primer módulo si tiene acceso
              >
                <summary className="p-6 cursor-pointer list-none flex items-center justify-between hover:bg-cream/50 transition-colors">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-forest mb-2">
                      Módulo {module.order}: {module.title}
                    </h3>
                    {module.description && (
                      <p className="text-gray text-sm">{module.description}</p>
                    )}
                  </div>
                  <span className="text-2xl text-musgo">+</span>
                </summary>
                <div className="px-6 pb-6 space-y-3">
                  {module.lessons?.map((lesson, lessonIndex) => {
                    const isFree = lesson.isFree;
                    const canAccess = hasAccess || isFree;
                    const LessonWrapper = canAccess ? Link : 'div';
                    const lessonHref = canAccess
                      ? `/cursos/${course.slug.current}/leccion/${index}/${lessonIndex}`
                      : '#';

                    return (
                      <LessonWrapper
                        key={lessonIndex}
                        href={lessonHref}
                        className={`
                          flex items-center justify-between py-3 border-t border-gray/10 transition-colors
                          ${canAccess ? 'hover:bg-cream/50 cursor-pointer' : 'opacity-60'}
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {canAccess ? (
                            <Play className="text-musgo" size={16} />
                          ) : (
                            <Lock className="text-gray/40" size={16} />
                          )}
                          <span className={canAccess ? 'text-gray' : 'text-gray/60'}>
                            {lesson.title}
                          </span>
                          {isFree && (
                            <Badge variant="success" size="sm">
                              Gratis
                            </Badge>
                          )}
                          {!canAccess && !isFree && (
                            <Badge variant="warning" size="sm">
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray">{lesson.duration} min</span>
                      </LessonWrapper>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
          {!hasAccess && (
            <div className="mt-8 p-6 bg-cream rounded-xl text-center">
              <p className="text-gray mb-4">
                Para acceder a todo el contenido del curso, necesitas comprarlo
              </p>
              <CourseDetail course={course} userCurrency={userCurrency} />
            </div>
          )}
        </section>
      )}

      {/* Requirements */}
      {course.requirements && course.requirements.length > 0 && (
        <section className="container mb-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-forest mb-6">
              Requisitos
            </h2>
            <ul className="space-y-2">
              {course.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-gray">
                  <span className="text-musgo mt-1">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Materials */}
      {course.materials && course.materials.length > 0 && (
        <section className="container mb-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-forest mb-6 flex items-center gap-2">
              <Download size={24} />
              Materiales que Necesitarás
            </h2>
            <div className="bg-cream rounded-xl p-6">
              <ul className="space-y-2">
                {course.materials.map((material, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray">
                    <span className="text-musgo mt-1">✓</span>
                    {material}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Instructor */}
      {course.instructor && (
        <section className="container mb-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-semibold text-forest mb-6">
              Tu Instructor
            </h2>
            <div className="flex items-start gap-6 bg-cream rounded-xl p-6">
              {course.instructor.photo && (
                <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={getImageUrl(course.instructor.photo, { width: 200, height: 200 })}
                    alt={course.instructor.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-semibold text-forest mb-2">
                  {course.instructor.name}
                </h3>
                {course.instructor.bio && (
                  <p className="text-gray">{course.instructor.bio}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Back to catalog */}
      <section className="container mt-16">
        <Link href="/cursos">
          <Button variant="secondary">← Ver todos los cursos</Button>
        </Link>
      </section>
    </div>
  );
}

