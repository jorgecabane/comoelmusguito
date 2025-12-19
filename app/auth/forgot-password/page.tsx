/**
 * Página: Olvidé mi Contraseña
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Loader2, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar la solicitud');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('Error al procesar la solicitud. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
        <div className="container max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center"
          >
            <div className="w-16 h-16 bg-musgo/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-musgo" size={32} />
            </div>

            <h1 className="font-display text-3xl font-bold text-forest mb-4">
              Email Enviado
            </h1>
            <p className="text-gray mb-8 leading-relaxed">
              Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <p className="text-sm text-gray mb-8">
              Por favor, revisa tu bandeja de entrada y carpeta de spam.
            </p>

            <div className="space-y-4">
              <Link href="/auth/login">
                <Button variant="primary" size="lg" className="w-full">
                  Volver al Login
                </Button>
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="text-sm text-musgo hover:text-forest transition-colors"
              >
                Enviar otro email
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
      <div className="container max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl"
        >
          <h1 className="font-display text-3xl font-bold text-forest mb-2">
            Olvidé mi Contraseña
          </h1>
          <p className="text-gray mb-8">
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-forest mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Enlace de Recuperación
                  <ArrowRight size={20} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-sm text-musgo hover:text-forest font-medium">
              ← Volver al Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
