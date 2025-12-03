/**
 * Página 404 - No Encontrado
 */

import Link from 'next/link';
import { Button } from '@/components/ui';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
      <div className="container max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="mb-6"
          >
            <div className="text-8xl mb-4">🌿</div>
          </motion.div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
            Página No Encontrada
          </h1>
          <p className="text-gray text-lg mb-8 leading-relaxed">
            Lo sentimos, la página que buscas no existe o ha sido movida.
            Pero no te preocupes, hay mucho más que explorar en nuestro sitio.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/">
              <Button variant="primary" size="lg">
                <Home size={20} />
                Ir al Inicio
              </Button>
            </Link>
            <Link href="/cursos">
              <Button variant="secondary" size="lg">
                <Search size={20} />
                Ver Cursos
              </Button>
            </Link>
          </div>

          <div className="pt-8 border-t border-gray/20">
            <p className="text-sm text-gray mb-4">O explora nuestras secciones:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/terrarios" className="text-musgo hover:text-forest transition-colors text-sm">
                Terrarios
              </Link>
              <Link href="/cursos" className="text-musgo hover:text-forest transition-colors text-sm">
                Cursos Online
              </Link>
              <Link href="/talleres" className="text-musgo hover:text-forest transition-colors text-sm">
                Talleres
              </Link>
              <Link href="/mi-cuenta" className="text-musgo hover:text-forest transition-colors text-sm">
                Mi Cuenta
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

