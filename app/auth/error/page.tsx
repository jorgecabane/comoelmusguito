/**
 * Página de Error de Autenticación
 */

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Error de Configuración',
          message: 'Hay un problema con la configuración del sistema. Por favor, contacta al administrador.',
        };
      case 'AccessDenied':
        return {
          title: 'Acceso Denegado',
          message: 'No tienes permiso para acceder a esta página.',
        };
      case 'Verification':
        return {
          title: 'Error de Verificación',
          message: 'El enlace de verificación ha expirado o es inválido.',
        };
      default:
        return {
          title: 'Error de Autenticación',
          message: 'Ocurrió un error al intentar iniciar sesión. Por favor, intenta nuevamente.',
        };
    }
  };

  const { title, message } = getErrorMessage();

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
      <div className="container max-w-md">
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

          <h1 className="font-display text-3xl font-bold text-forest mb-4">
            {title}
          </h1>
          <p className="text-gray text-lg mb-8 leading-relaxed">{message}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button variant="primary" size="lg">
                Intentar Nuevamente
                <ArrowLeft size={20} className="rotate-180" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" size="lg">
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
          <div className="container max-w-md">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center">
              <div className="animate-pulse">
                <div className="w-24 h-24 bg-gray/20 rounded-full mx-auto mb-6" />
                <div className="h-8 bg-gray/20 rounded w-3/4 mx-auto mb-4" />
                <div className="h-4 bg-gray/20 rounded w-full mb-2" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}


