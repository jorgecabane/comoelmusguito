/**
 * FadeIn Animation Component
 * Elementos que aparecen suavemente al entrar en viewport
 */

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
  once?: boolean;
  // Nueva prop para forzar animación inmediata (útil para contenido arriba del fold)
  immediate?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  className,
  once = true,
  immediate = false,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (prefersReducedMotion || !mounted) {
    // Durante SSR o si no está montado, mostrar contenido sin animación
    return <div className={className}>{children}</div>;
  }

  // Si es inmediato o está cerca del top, usar animate en lugar de whileInView
  if (immediate) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          ...directions[direction],
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          duration,
          delay,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once, margin: '-100px' }} // Aumentar margen para detectar mejor
      transition={{
        duration,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

