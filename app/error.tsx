/**
 * Página de Error Global
 * Se muestra cuando hay un error no manejado
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (en producción, enviar a servicio de monitoreo)
    console.error('Error capturado:', error);
  }, [error]);

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mb-6"
          >
            <div className="w-24 h-24 bg-error/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-error" size={48} />
            </div>
          </motion.div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-forest mb-4">
            Algo Salió Mal
          </h1>
          <p className="text-gray text-lg mb-6 leading-relaxed">
            Ocurrió un error inesperado. Por favor, intenta nuevamente o vuelve al inicio.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs font-mono text-error break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={reset}
            >
              <RefreshCw size={20} />
              Intentar Nuevamente
            </Button>
            <Link href="/">
              <Button variant="secondary" size="lg">
                <Home size={20} />
                Ir al Inicio
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray/20">
            <p className="text-sm text-gray mb-2">
              Si el problema persiste, por favor contáctanos.
            </p>
            <Link href="/contacto" className="text-musgo hover:text-forest transition-colors text-sm">
              Contactar Soporte
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

