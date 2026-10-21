/**
 * Página 404 - No Encontrado
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-bg to-surface flex items-center justify-center">
      <div className="container max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl p-8 md:p-12 shadow-natural-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-6"
          >
            <Image src="/logo/snail-cream.png" alt="" width={160} height={88} className="mx-auto w-40 h-auto mb-4" />
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-fg mb-4">
            Página No Encontrada
          </h1>
          <p className="text-muted text-lg mb-8 leading-relaxed">
            Lo sentimos, la página que buscas no existe o ha sido movida.
            Pero no te preocupes, hay mucho más que explorar en nuestro sitio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button variant="primary" size="lg" href="/">
              <Home size={20} />
              Ir al Inicio
            </Button>
            <Button variant="secondary" size="lg" href="/cursos">
              <Search size={20} />
              Ver Cursos
            </Button>
          </div>

          <div className="pt-8 border-t border-line">
            <p className="text-sm text-muted mb-4">O explora nuestras secciones:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-md mx-auto">
              <Link 
                href="/terrarios" 
                className="text-brand hover:text-fg transition-colors text-sm font-medium hover:underline"
              >
                Terrarios
              </Link>
              <Link 
                href="/cursos" 
                className="text-brand hover:text-fg transition-colors text-sm font-medium hover:underline"
              >
                Cursos Online
              </Link>
              <Link 
                href="/talleres" 
                className="text-brand hover:text-fg transition-colors text-sm font-medium hover:underline"
              >
                Talleres
              </Link>
              <Link 
                href="/sobre" 
                className="text-brand hover:text-fg transition-colors text-sm font-medium hover:underline"
              >
                Sobre el Musguito
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

