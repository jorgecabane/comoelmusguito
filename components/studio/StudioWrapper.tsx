/**
 * Studio Wrapper
 * Wrapper para Sanity Studio que suprime warnings de React 19
 */

'use client';

import { useEffect } from 'react';
import { NextStudio } from 'next-sanity/studio';
import type { Config } from 'sanity';

interface StudioWrapperProps {
  config: Config;
}

export function StudioWrapper({ config }: StudioWrapperProps) {
  useEffect(() => {
    // Suprimir warnings específicos de React 19 relacionados con Sanity Studio
    const originalError = console.error;
    const originalWarn = console.warn;

    const filteredError = (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('disableTransition') ||
          message.includes('React does not recognize'))
      ) {
        // No mostrar este warning específico
        return;
      }
      originalError.apply(console, args);
    };

    const filteredWarn = (...args: any[]) => {
      const message = args[0];
      if (
        typeof message === 'string' &&
        (message.includes('disableTransition') ||
          message.includes('React does not recognize'))
      ) {
        // No mostrar este warning específico
        return;
      }
      originalWarn.apply(console, args);
    };

    // Reemplazar console.error y console.warn temporalmente
    console.error = filteredError;
    console.warn = filteredWarn;

    return () => {
      // Restaurar funciones originales al desmontar
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return <NextStudio config={config} />;
}

