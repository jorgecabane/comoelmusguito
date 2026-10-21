/**
 * Componente Button
 * Botón reutilizable con múltiples variantes y tamaños.
 * Con `href` se renderiza como enlace (Link interno o <a> externo) con el mismo
 * aspecto, evitando anidar un <button> dentro de un <a>. Con `as="span"` solo
 * toma el aspecto (para tarjetas completas que ya son un enlace). El span no tiene
 * estado deshabilitado: si la tarjeta sigue navegando, el botón tampoco debe verse
 * deshabilitado; solo cambia su texto (p. ej. "Agotado").
 */

import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

interface ButtonOwnProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

type ButtonAsButton = ButtonOwnProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

/** Aspecto de botón sin ser interactivo: para usar dentro de una tarjeta que ya es un enlace. */
type ButtonAsSpan = ButtonOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & { as: 'span'; href?: undefined };

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsSpan;

const baseStyles =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2';

const variants = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover active:scale-[0.98] shadow-natural-sm hover:shadow-natural-md',
  secondary:
    'bg-transparent text-accent-text border-2 border-accent-text hover:bg-accent hover:border-accent hover:text-on-accent',
  ghost:
    'bg-transparent text-brand hover:text-fg underline underline-offset-4 hover:decoration-2',
};

const sizes = {
  sm: 'text-sm px-4 py-2 rounded-md',
  md: 'text-base px-6 py-3 rounded-md',
  lg: 'text-lg px-8 py-4 rounded-lg',
};

/** Enlaces fuera del sitio o con esquema propio (mailto, tel, wa.me...) usan <a> */
const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', loading = false, icon, children, className, ...rest } = props;
  const classes = cn(baseStyles, variants[variant], sizes[size], className);

  const content = loading ? (
    <>
      <Loader2 className="animate-spin" size={20} />
      {children && <span>Cargando...</span>}
    </>
  ) : (
    <>
      {icon && <span className="inline-flex">{icon}</span>}
      {children && <span className="inline-flex items-center gap-2">{children}</span>}
    </>
  );

  if ('as' in rest && rest.as === 'span') {
    const { as: _as, ...spanProps } = rest as Omit<ButtonAsSpan, keyof ButtonOwnProps>;
    void _as;
    return (
      <span className={classes} {...spanProps}>
        {content}
      </span>
    );
  }

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as Omit<ButtonAsLink, keyof ButtonOwnProps>;
    return isExternal(href) ? (
      <a href={href} className={classes} {...anchorProps}>
        {content}
      </a>
    ) : (
      <Link href={href} className={classes} {...anchorProps}>
        {content}
      </Link>
    );
  }

  const { disabled, ...buttonProps } = rest as Omit<ButtonAsButton, keyof ButtonOwnProps>;
  return (
    <button className={classes} disabled={disabled || loading} {...buttonProps}>
      {content}
    </button>
  );
}
