/**
 * Lazy Motion Wrapper
 * Carga framer-motion solo cuando se necesita (para componentes below the fold)
 * Mejora FCP al no bloquear el render inicial
 */

'use client';

import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Lazy load framer-motion solo cuando el componente está en viewport
const LazyMotionProvider = dynamic(
  () => import('framer-motion').then((mod) => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
  })),
  { ssr: false }
);

interface LazyMotionProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyMotion({ children, fallback = null }: LazyMotionProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Usar Intersection Observer para cargar cuando está cerca del viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' } // Cargar 200px antes de que sea visible
    );

    // Observar un elemento dummy o el primer child
    const element = document.querySelector('[data-lazy-motion-trigger]');
    if (element) {
      observer.observe(element);
    } else {
      // Si no hay trigger, cargar después de un delay
      const timer = setTimeout(() => setShouldLoad(true), 1000);
      return () => {
        clearTimeout(timer);
        observer.disconnect();
      };
    }

    return () => observer.disconnect();
  }, []);

  if (!mounted || !shouldLoad) {
    return <>{fallback || children}</>;
  }

  return <LazyMotionProvider>{children}</LazyMotionProvider>;
}
