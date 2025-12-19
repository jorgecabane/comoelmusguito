/**
 * Studio Wrapper
 * Wrapper para Sanity Studio que suprime warnings de React 19
 * 
 * Filtra errores conocidos de compatibilidad:
 * - disableTransition prop
 * - flushSync lifecycle errors
 * - React rendering conflicts
 */

'use client';

import { Suspense } from 'react';
import { NextStudio } from 'next-sanity/studio';
import type { Config } from 'sanity';

interface StudioWrapperProps {
  config: Config;
}

// Filtrar errores de React 19 + Sanity Studio ANTES de que se monte el componente
// Esto se ejecuta cuando el módulo se carga, antes de cualquier renderizado
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  const filteredError = (...args: any[]) => {
    const message = args[0];
    const allArgs = args.join(' ');
    
    if (
      (typeof message === 'string' &&
        (message.includes('disableTransition') ||
          message.includes('React does not recognize') ||
          message.includes('flushSync was called from inside a lifecycle method') ||
          message.includes('flushSync') ||
          message.includes('React cannot flush when React is already rendering') ||
          message.includes('Consider moving this call to a scheduler task') ||
          message.includes('React cannot flush'))) ||
      allArgs.includes('flushSync') ||
      allArgs.includes('lifecycle method') ||
      allArgs.includes('React cannot flush') ||
      allArgs.includes('scheduler task')
    ) {
      // No mostrar estos warnings específicos de React 19 + Sanity Studio
      return;
    }
    originalError.apply(console, args);
  };

  const filteredWarn = (...args: any[]) => {
    const message = args[0];
    const allArgs = args.join(' ');
    
    if (
      (typeof message === 'string' &&
        (message.includes('disableTransition') ||
          message.includes('React does not recognize') ||
          message.includes('flushSync was called from inside a lifecycle method') ||
          message.includes('flushSync') ||
          message.includes('React cannot flush when React is already rendering') ||
          message.includes('Consider moving this call to a scheduler task') ||
          message.includes('React cannot flush'))) ||
      allArgs.includes('flushSync') ||
      allArgs.includes('lifecycle method') ||
      allArgs.includes('React cannot flush') ||
      allArgs.includes('scheduler task')
    ) {
      // No mostrar estos warnings específicos de React 19 + Sanity Studio
      return;
    }
    originalWarn.apply(console, args);
  };

  // Aplicar filtros inmediatamente cuando el módulo se carga
  console.error = filteredError;
  console.warn = filteredWarn;
}

export function StudioWrapper({ config }: StudioWrapperProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest mx-auto mb-4"></div>
          <p className="text-gray">Cargando Sanity Studio...</p>
        </div>
      </div>
    }>
      <NextStudio config={config} />
    </Suspense>
  );
}
