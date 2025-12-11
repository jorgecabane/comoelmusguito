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
  textColor?: string;
}

const sizeMap = {
  sm: { width: 120, height: 32 },
  md: { width: 150, height: 40 },
  lg: { width: 180, height: 48 },
};

export function Logo({ 
  variant = 'default', 
  size = 'md',
  className = '',
  href = '/',
  textColor = 'text-forest'
}: LogoProps) {
  const dimensions = sizeMap[size];

  const LogoContent = () => (
    <div className={`flex items-center gap-0 ${className}`}>
      {/* Placeholder temporal - Reemplazar con logo real */}
      <Image
        src={variant === 'icon-only' ? '/logo/logo-icon.svg' : '/logo/logo.svg'}
        alt="comoelmusguito"
        width={variant === 'icon-only' ? dimensions.height: dimensions.width - 70}
        height={dimensions.height}
        className={className}
        priority
        />
      {variant === 'default' && (
        <span className={`font-display font-bold ${textColor}`} style={{ fontSize: `${dimensions.height * 0.5}px` }}>
          comoelmusguito
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}

