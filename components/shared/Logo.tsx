/**
 * Logo Component
 * Componente centralizado para el logo del sitio.
 * El archivo (crema, pensado para fondos oscuros) vive en /public/logo.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  className?: string;
  href?: string;
}

/** Proporción real del PNG (ancho / alto) */
const LOGO_SRC = '/logo/logo-cream.png';
const LOGO_RATIO = 1800 / 857;

/** Alto del logo en px por tamaño; el ancho sale de la proporción */
const HEIGHT_BY_SIZE: Record<LogoSize, number> = {
  sm: 36,
  md: 48,
  lg: 64,
};

export function Logo({ size = 'md', className, href = '/' }: LogoProps) {
  const height = HEIGHT_BY_SIZE[size];
  const image = (
    <Image
      src={LOGO_SRC}
      alt="Como el musguito"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      className={cn('w-auto', className)}
      priority
    />
  );

  return href ? (
    <Link
      href={href}
      className="inline-flex transition-opacity hover:opacity-80"
      aria-label="Como el musguito, ir al inicio"
    >
      {image}
    </Link>
  ) : (
    image
  );
}
