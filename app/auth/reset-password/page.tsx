/**
 * Página: Resetear Contraseña
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyToken() {
      if (!token) {
        setTokenValid(false);
        setError('Token de recuperación no válido');
        return;
      }

      try {
        const res = await fetch(
          `/api/auth/reset-password/verify?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (cancelled) return;

        if (data?.valid) {
          setTokenValid(true);
          setIsInitializing(Boolean(data.isInitializing));
        } else {
          setTokenValid(false);
          setError('El enlace es inválido o ha expirado');
        }
      } catch (err) {
        if (cancelled) return;
        setTokenValid(false);
        setError('No pudimos verificar el enlace. Intenta nuevamente.');
      }
    }

    verifyToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!token) {
      setError('Token no válido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al restablecer la contraseña');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirigir a login después de 3 segundos
      setTimeout(() => {
        router.push('/auth/login?passwordReset=true');
      }, 3000);
    } catch (err) {
      setError('Error al procesar la solicitud. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
        <div className="container max-w-md">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center">
            <Loader2 className="animate-spin text-musgo mx-auto mb-6" size={48} />
            <h1 className="font-display text-2xl font-bold text-forest">
              Verificando enlace...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
        <div className="container max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center"
          >
            <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-error" size={32} />
            </div>

            <h1 className="font-display text-3xl font-bold text-forest mb-4">
              Token Inválido
            </h1>
            <p className="text-gray mb-8">
              El enlace de recuperación no es válido o ha expirado. Por favor, solicita un nuevo enlace.
            </p>

            <Link href="/auth/forgot-password">
              <Button variant="primary" size="lg" className="w-full">
                Solicitar Nuevo Enlace
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
        <div className="container max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={32} />
            </div>

            <h1 className="font-display text-3xl font-bold text-forest mb-4">
              {isInitializing ? 'Contraseña Creada' : 'Contraseña Restablecida'}
            </h1>
            <p className="text-gray mb-8">
              {isInitializing
                ? 'Tu contraseña se creó exitosamente. Ahora puedes iniciar sesión con tu email y contraseña, o seguir usando Google.'
                : 'Tu contraseña ha sido restablecida exitosamente. Serás redirigido al login en unos segundos.'}
            </p>

            <Link href="/auth/login">
              <Button variant="primary" size="lg" className="w-full">
                Ir al Login
              </Button>
            </Link>
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
            {isInitializing ? 'Crea tu Contraseña' : 'Restablecer Contraseña'}
          </h1>
          <p className="text-gray mb-8">
            {isInitializing
              ? 'Tu cuenta se creó con Google. Define una contraseña para también iniciar sesión con email y contraseña. Debe tener al menos 8 caracteres.'
              : 'Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.'}
          </p>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-forest mb-2">
                Nueva Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-forest mb-2">
                Confirmar Contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
                minLength={8}
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
                  {isInitializing ? 'Creando...' : 'Restableciendo...'}
                </>
              ) : (
                isInitializing ? 'Crear Contraseña' : 'Restablecer Contraseña'
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
          <div className="container max-w-md">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center">
              <Loader2 className="animate-spin text-musgo mx-auto mb-6" size={48} />
              <h1 className="font-display text-2xl font-bold text-forest">
                Cargando...
              </h1>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
