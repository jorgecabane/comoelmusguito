/**
 * Logo Component
 * Componente centralizado para el logo del sitio.
 * Los archivos (crema, pensados para fondos oscuros) viven en /public/logo.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type LogoVariant = 'default' | 'icon-only';
type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  href?: string;
}

/** Proporciones reales de los PNG (ancho / alto) */
const LOGO_FILES = {
  default: { src: '/logo/logo-cream.png', ratio: 1800 / 857 },
  'icon-only': { src: '/logo/snail-cream.png', ratio: 700 / 384 },
} as const;

/** Alto del logo en px por tamaño; el ancho sale de la proporción */
const HEIGHT_BY_SIZE: Record<LogoSize, number> = {
  sm: 36,
  md: 48,
  lg: 64,
};

function LogoImage({ variant, size, className }: Required<Pick<LogoProps, 'variant' | 'size'>> & { className?: string }) {
  const { src, ratio } = LOGO_FILES[variant];
  const height = HEIGHT_BY_SIZE[size];

  return (
    <Image
      src={src}
      alt="Como el musguito"
      width={Math.round(height * ratio)}
      height={height}
      className={cn('w-auto', className)}
      priority
    />
  );
}

export function Logo({ variant = 'default', size = 'md', className, href = '/' }: LogoProps) {
  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-80" aria-label="Como el musguito, ir al inicio">
        <LogoImage variant={variant} size={size} className={className} />
      </Link>
    );
  }

  return <LogoImage variant={variant} size={size} className={className} />;
}
