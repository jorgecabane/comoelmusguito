/**
 * Componente Breadcrumb
 * Muestra la navegación jerárquica de la página actual
 */

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`container mb-8 ${className}`}
    >
      <ol className="flex items-center gap-2 text-sm text-gray flex-wrap">
        <li>
          <Link
            href="/"
            className="hover:text-musgo transition-colors flex items-center gap-1"
            aria-label="Ir al inicio"
          >
            <Home size={16} />
            <span className="sr-only md:not-sr-only">Inicio</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight size={16} className="text-gray/40" />
              {isLast || !item.href ? (
                <span className={isLast ? 'text-forest font-medium' : 'text-gray'}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-musgo transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
