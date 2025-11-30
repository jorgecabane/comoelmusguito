/**
 * Componente Button
 * Botón reutilizable con múltiples variantes y tamaños
 */

import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-2';

  const variants = {
    primary:
      'bg-musgo text-white hover:bg-musgo-dark active:scale-[0.98] shadow-natural-sm hover:shadow-natural-md',
    secondary:
      'bg-transparent text-tierra border-2 border-tierra hover:bg-tierra hover:text-white',
    ghost:
      'bg-transparent text-vida hover:text-vida-dark underline underline-offset-4 hover:decoration-2',
  };

  const sizes = {
    sm: 'text-sm px-4 py-2 rounded-md',
    md: 'text-base px-6 py-3 rounded-md',
    lg: 'text-lg px-8 py-4 rounded-lg',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          {children && <span>Cargando...</span>}
        </>
      ) : (
        <>
          {icon && <span className="inline-flex">{icon}</span>}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
}

