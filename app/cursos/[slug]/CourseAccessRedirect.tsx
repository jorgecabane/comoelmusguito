/**
 * Componente Cliente: Verifica acceso y redirige a lecciones
 * Muestra loading mientras se verifica y redirige
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface CourseAccessRedirectProps {
  courseSlug: string;
  courseName: string;
}

export function CourseAccessRedirect({ courseSlug, courseName }: CourseAccessRedirectProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    const checkAccessAndRedirect = async () => {
      if (status === 'loading') return; // Esperar a que la sesión cargue
      
      if (!session?.user?.email) {
        // No está logueado, no hacer nada (mostrar página de venta)
        setIsRedirecting(false);
        return;
      }

      try {
        // Verificar acceso
        const response = await fetch(`/api/courses/check-access?courseSlug=${courseSlug}`);
        const data = await response.json();

        if (data.hasAccess) {
          // Tiene acceso, redirigir a lecciones
          if (data.lastWatched) {
            const parts = data.lastWatched.split('-');
            if (parts.length === 2) {
              const moduleIndex = parseInt(parts[0], 10);
              const lessonIndex = parseInt(parts[1], 10);
              if (!isNaN(moduleIndex) && !isNaN(lessonIndex)) {
                router.push(`/cursos/${courseSlug}/leccion/${moduleIndex}/${lessonIndex}`);
                return;
              }
            }
          }
          // Si no hay última vista, ir a la primera lección
          router.push(`/cursos/${courseSlug}/leccion/0/0`);
        } else {
          // No tiene acceso, mostrar página de venta
          setIsRedirecting(false);
        }
      } catch (error) {
        console.error('Error verificando acceso:', error);
        setIsRedirecting(false);
      }
    };

    checkAccessAndRedirect();
  }, [session, status, courseSlug, router]);

  // Mostrar loading mientras se verifica el acceso (overlay que cubre toda la página)
  if (isRedirecting || status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-cream to-white flex items-center justify-center">
        <div className="container max-w-4xl px-4">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Spinner */}
            <div className="relative">
              <Loader2 className="animate-spin text-musgo" size={48} />
              <div className="absolute inset-0 bg-musgo/20 blur-2xl rounded-full" />
            </div>

            {/* Mensaje */}
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-bold text-forest">
                Preparando tu curso...
              </h2>
              <p className="text-gray">
                Te estamos redirigiendo a tus lecciones
              </p>
            </div>

            {/* Skeleton del curso */}
            <div className="w-full max-w-2xl space-y-6 mt-8">
              <Skeleton className="h-64 w-full rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no tiene acceso o no está logueado, no renderizar nada (dejar que se muestre la página de venta)
  return null;
}
