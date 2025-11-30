/**
 * Hero Inmersivo
 * Video fullscreen con texto narrativo
 */

'use client';

import { motion } from 'framer-motion';
import { VideoBackground, FadeIn } from '@/components/animations';
import { Button } from '@/components/ui';
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

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between text-white px-4 py-12 md:py-20">
        {/* Logo arriba */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex items-center justify-center"
        >
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            <Image
              src="/logo/logo-icon.svg"
              alt="comoelmusguito logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </motion.div>

        {/* Contenido central */}
        <div className="max-w-5xl mx-auto text-center space-y-8 flex-shrink-0">
          {/* Fade in secuencial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="space-y-6"
          >
            <p className="text-xl md:text-2xl text-white/90 font-light tracking-wide">
              En un frasco de vidrio...
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
          >
            Cabe un Universo
            <br />
            <span className="text-vida">Entero</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto"
          >
            Cada terrario es un ecosistema vivo que late, crece y respira.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2.5 }}
          >
            <Button
              variant="primary"
              size="lg"
              className="bg-vida hover:bg-vida-dark text-white"
              onClick={() => {
                window.scrollTo({ 
                  top: window.innerHeight, 
                  behavior: 'smooth' 
                });
              }}
            >
              Comenzar el Viaje
            </Button>
          </motion.div>
        </div>

        {/* Texto "comoelmusguito" abajo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex items-center justify-center"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-wider drop-shadow-lg">
            comoelmusguito
          </h2>
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

