/**
 * Componente Section
 * Franja de página a todo el ancho con contenido centrado en `container`.
 * tone="soft" usa el tema claro (verde suave + texto verde oscuro) para dar
 * ritmo a páginas largas. Úsalo con criterio: pocas franjas claras por página,
 * nunca en flujos de compra o cuenta.
 */

import { cn } from '@/lib/utils/cn';
import { HTMLAttributes, ReactNode } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: 'default' | 'soft';
  /** Clases extra para el `container` interno */
  containerClassName?: string;
  children: ReactNode;
}

export function Section({
  tone = 'default',
  containerClassName,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(tone === 'soft' && 'theme-soft bg-bg py-24', className)}
      {...props}
    >
      <div className={cn('container', containerClassName)}>{children}</div>
    </section>
  );
}
