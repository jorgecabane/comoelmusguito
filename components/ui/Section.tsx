/**
 * Componente Section
 * Franja de página a todo el ancho. Con `contained` (por defecto) centra el
 * contenido en `container`; con `contained={false}` el hijo maneja su propio ancho.
 * tone="soft" usa el tema claro (verde suave + texto verde oscuro) para dar
 * ritmo a páginas largas. Úsalo con criterio: pocas franjas claras por página,
 * nunca en flujos de compra o cuenta.
 */

import { cn } from '@/lib/utils/cn';
import { HTMLAttributes, ReactNode } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: 'default' | 'soft';
  /** Envuelve el contenido en `container` (por defecto sí) */
  contained?: boolean;
  /** Clases extra para el `container` interno */
  containerClassName?: string;
  children: ReactNode;
}

export function Section({
  tone = 'default',
  contained = true,
  containerClassName,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(tone === 'soft' && 'theme-soft py-32', className)} {...props}>
      {contained ? <div className={cn('container', containerClassName)}>{children}</div> : children}
    </section>
  );
}
