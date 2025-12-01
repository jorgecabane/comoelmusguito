/**
 * Hero Inmersivo
 * Video fullscreen con texto narrativo
 */

'use client';

import { motion } from 'framer-motion';
import { VideoBackground } from '@/components/animations';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

export function HeroImmersive() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Video Background */}
      <VideoBackground
        videoSrc="/videos/hero/hero-main.mp4"
        fallbackImage="/images/hero/hero-fallback.jpg"
        overlay="dark"
      />

      {/* Contenido - Solo logo y texto */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4 gap-12 md:gap-16">
        {/* Logo arriba - Con círculo de fondo glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex items-center justify-center"
        >
          {/* Círculo de fondo con glassmorphism */}
          <div className="relative">
            {/* Glow effect verde */}
            <div className="absolute inset-0 bg-vida/40 blur-3xl rounded-full scale-125" />
            
            {/* Círculo glassmorphism */}
            <div className="relative bg-white/5 backdrop-blur-md rounded-full p-8 md:p-10 lg:p-12 border-2 border-white/30 shadow-2xl">
              <div className="relative w-26 h-26 md:w-32 md:h-32 lg:w-40 lg:h-40">
                <Image
                  src="/logo/logo-white.svg"
                  alt="comoelmusguito logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </motion.div>
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer focus:outline-none"
        aria-label="Scroll hacia abajo"
      >
        <ChevronDown 
          size={32} 
          className="text-white/70 hover:text-white transition-colors" 
          strokeWidth={2}
        />
      </motion.button>

      {/* Overlay gradient bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-gradient-to-t from-cream to-transparent z-10" />
    </section>
  );
}

