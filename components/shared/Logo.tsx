/**
 * Logo Component
 * Componente centralizado para el logo del sitio
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'default' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
}

const sizeMap = {
  sm: { width: 120, height: 32 },
  md: { width: 150, height: 40 },
  lg: { width: 180, height: 48 },
};

interface LogoContentProps {
  variant: 'default' | 'icon-only';
  dimensions: { width: number; height: number };
  className: string;
}

function LogoContent({ variant, dimensions, className }: LogoContentProps) {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <Image
        src={variant === 'icon-only' ? '/logo/logo-icon.svg' : '/logo/logo.svg'}
        alt="comoelmusguito"
        width={variant === 'icon-only' ? dimensions.height : dimensions.width - 70}
        height={dimensions.height}
        className={className}
        priority
      />
      {variant === 'default' && (
        <span className="font-display font-bold text-forest" style={{ fontSize: `${dimensions.height * 0.5}px` }}>
          comoelmusguito
        </span>
      )}
    </div>
  );
}

export function Logo({ 
  variant = 'default', 
  size = 'md',
  className = '',
  href = '/'
}: LogoProps) {
  const dimensions = sizeMap[size];

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        <LogoContent variant={variant} dimensions={dimensions} className={className} />
      </Link>
    );
  }

  return <LogoContent variant={variant} dimensions={dimensions} className={className} />;
}

