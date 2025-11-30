/**
 * Scroll Progress Indicator
 * Barra sutil que muestra progreso de scroll
 */

'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  
  // Spring para animación más fluida
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-vida origin-left z-50"
      style={{ scaleX }}
    />
  );
}

