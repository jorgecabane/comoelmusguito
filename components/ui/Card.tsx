/**
 * Componente Card con patrón de composición
 * Permite crear cards flexibles con subcomponentes
 */

import { cn } from '@/lib/utils/cn';
import Image from 'next/image';
import { HTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Card({
  hover = false,
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-cream rounded-lg shadow-natural-md transition-all duration-300',
        hover && 'hover:shadow-natural-lg hover:-translate-y-1 cursor-pointer',
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Subcomponentes usando composición

interface CardImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

Card.Image = function CardImage({
  src,
  alt,
  width = 800,
  height = 600,
  className,
}: CardImageProps) {
  return (
    <div className={cn('relative aspect-[4/3] overflow-hidden rounded-t-lg', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-300 hover:scale-105"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

Card.Content = function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {children}
    </div>
  );
};

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

Card.Title = function CardTitle({
  children,
  as: Component = 'h3',
  className,
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={cn('font-display text-2xl font-semibold text-forest', className)}
      {...props}
    >
      {children}
    </Component>
  );
};

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

Card.Description = function CardDescription({
  children,
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <p className={cn('text-gray leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
};

interface CardPriceProps {
  value: number;
  currency?: 'CLP' | 'USD';
  className?: string;
}

Card.Price = function CardPrice({ value, currency = 'CLP', className }: CardPriceProps) {
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(value);

  return (
    <span className={cn('text-xl font-semibold text-musgo', className)}>{formatted}</span>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

Card.Footer = function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('mt-4 flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
};

