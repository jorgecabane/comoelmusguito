/**
 * Componente CtaBanner
 * Bloque de llamado a la acción al final de una página: título, bajada y acciones.
 * Usa el tema claro para destacarse del fondo oscuro.
 */

import { cn } from '@/lib/utils/cn';
import { ReactNode } from 'react';

interface CtaBannerProps {
  title: string;
  description?: string;
  /** Botones o links de acción */
  children?: ReactNode;
  className?: string;
}

export function CtaBanner({ title, description, children, className }: CtaBannerProps) {
  return (
    <div
      className={cn(
        'theme-soft rounded-2xl p-8 md:p-12 text-center',
        className
      )}
    >
      <h2 className="font-display text-3xl md:text-4xl mb-4">{title}</h2>
      {description && (
        <p className="text-muted mb-6 max-w-2xl mx-auto text-lg">{description}</p>
      )}
      {children}
    </div>
  );
}
