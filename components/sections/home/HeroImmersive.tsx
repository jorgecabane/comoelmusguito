/**
 * Hero Inmersivo
 * Video fullscreen con texto narrativo
 */

'use client';

import { motion } from 'framer-motion';
import { VideoBackground } from '@/components/animations';
import Image from 'next/image';

export function HeroImmersive() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <VideoBackground
        videoSrc="/videos/hero/hero-main.mp4"
        fallbackImage="/images/hero/hero-musguito.jpg"
        overlay="dark"
      />

      {/* Contenido: logo y bajada */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-fg px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative w-[min(88vw,560px)] aspect-[1800/857]"
        >
          <Image
            src="/logo/logo-cream.png"
            alt="Como el musguito"
            fill
            sizes="(max-width: 640px) 88vw, 560px"
            className="object-contain"
            priority
          />
          <span className="sr-only">: terrarios artesanales, cursos y talleres</span>
        </motion.h1>

      </div>

      {/* Scroll indicator - Flechita simple */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          y: [0, 8, 0]
        }}
        transition={{ 
          opacity: { delay: 3, duration: 1 },
          y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }}
        onClick={() => {
          const nextSection = document.querySelector('section:nth-of-type(2)');
          if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="absolute bottom-25 left-1/2 -translate-x-1/2 z-20 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-fg"
        aria-label="Scroll hacia abajo"
      >
        <span className="flex flex-col items-center gap-2 text-fg/80 hover:text-fg transition-colors">
          <span className="text-sm font-medium uppercase tracking-[0.24em]">Descubre</span>
          <Image src="/logo/snail-cream.png" alt="" width={44} height={24} className="w-11 h-auto" />
        </span>
      </motion.button>

      {/* Overlay gradient bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-bg to-transparent z-10" />
    </section>
  );
}

