/**
 * Página de Registro
 */

'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Button, Input } from '@/components/ui';
import { Loader2, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/mi-cuenta';
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  // Prellenar email y nombre desde query params (si vienen del callback)
  const emailParam = searchParams.get('email');
  const nameParam = searchParams.get('name');
  
  const [name, setName] = useState(nameParam || '');
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);

  // Verificar si reCAPTCHA está disponible y listo
  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isRecaptchaConfigured = !!RECAPTCHA_SITE_KEY;

  // Verificar cuando reCAPTCHA esté listo
  useEffect(() => {
    if (isRecaptchaConfigured && executeRecaptcha) {
      setRecaptchaReady(true);
      console.log('✅ reCAPTCHA está listo');
    } else if (isRecaptchaConfigured && !executeRecaptcha) {
      console.warn('⏳ Esperando a que reCAPTCHA se cargue...');
      // Intentar de nuevo después de un momento
      const timer = setTimeout(() => {
        if (executeRecaptcha) {
          setRecaptchaReady(true);
          console.log('✅ reCAPTCHA listo después de esperar');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [executeRecaptcha, isRecaptchaConfigured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Email válido requerido');
      return;
    }

    if (!password || password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      // Obtener token de reCAPTCHA si está configurado
      let recaptchaToken: string | undefined;
      
      if (isRecaptchaConfigured) {
        if (!executeRecaptcha) {
          console.error('❌ reCAPTCHA configurado pero executeRecaptcha no está disponible');
          setError('Error: reCAPTCHA no está listo. Por favor, recarga la página e intenta nuevamente.');
          setLoading(false);
          return;
        }

        try {
          console.log('🔒 Ejecutando reCAPTCHA con acción "register"...');
          recaptchaToken = await executeRecaptcha('register');
          
          if (!recaptchaToken) {
            throw new Error('Token de reCAPTCHA vacío');
          }
          
          console.log('✅ reCAPTCHA ejecutado exitosamente');
          console.log('📝 Token (primeros 30 chars):', recaptchaToken.substring(0, 30) + '...');
        } catch (recaptchaError: any) {
          console.error('❌ Error ejecutando reCAPTCHA:', recaptchaError);
          setError('Error en verificación de seguridad. Por favor, recarga la página e intenta nuevamente.');
          setLoading(false);
          return;
        }
      } else {
        console.log('ℹ️ reCAPTCHA no configurado, continuando sin verificación');
      }

      // Registrar usuario
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name.trim(),
          password,
          recaptchaToken,
        }),
      });

          const registerData = await registerResponse.json();

          if (!registerResponse.ok) {
            // Mensaje específico si el email ya existe
            if (registerData.existingUser) {
              setError(
                registerData.error + '. ' + (registerData.suggestion || '¿Quieres iniciar sesión?')
              );
            } else {
              setError(registerData.error || 'Error al registrar usuario');
            }
            setLoading(false);
            return;
          }

      // Si se envió email de verificación, mostrar mensaje
      if (registerData.emailVerificationSent) {
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Si el email ya está verificado (verificación deshabilitada), iniciar sesión automáticamente
      if (registerData.emailVerified) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Usuario creado exitosamente. Por favor, inicia sesión.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } else {
        // Si no se envió email pero tampoco está verificado, algo salió mal
        setError('Error al crear la cuenta. Por favor, intenta nuevamente.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error en registro:', err);
      setError('Error al registrar usuario. Por favor, intenta nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-bg to-surface flex items-center justify-center">
      <div className="container max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl p-8 md:p-12 shadow-natural-xl"
        >
          <h1 className="font-display text-3xl font-bold text-fg mb-2">
            Únete a nuestra comunidad 🌿
          </h1>
          <p className="text-muted mb-8">
            Crea tu cuenta para acceder a cursos, talleres y más
          </p>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-6 text-error text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/30 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="text-success mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-success mb-2">
                    ¡Cuenta creada exitosamente! 📧
                  </h3>
                  <p className="text-success text-sm mb-3">
                    Te hemos enviado un email de verificación a <strong>{email}</strong>. 
                    Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
                  </p>
                  <p className="text-success text-xs">
                    ¿No recibiste el email? Revisa tu carpeta de spam o{' '}
                    <Link href="/auth/login" className="underline font-medium">
                      inicia sesión aquí
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-fg mb-2">
                Nombre
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tu nombre"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-fg mb-2">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-fg mb-2">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                disabled={loading}
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-fg mb-2">
                Confirmar Contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repite tu contraseña"
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
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight size={20} />
                </>
              )}
            </Button>
          </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-brand hover:text-fg font-medium">
                Inicia sesión aquí
              </Link>
            </p>
            {/* Texto de privacidad reCAPTCHA (requerido si se oculta el badge) */}
            {isRecaptchaConfigured && (
              <p className="text-xs text-muted/60 mt-4">
                Este sitio está protegido por reCAPTCHA y se aplican la{' '}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Política de Privacidad
                </a>
                {' '}y los{' '}
                <a 
                  href="https://policies.google.com/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Términos de Servicio
                </a>
                {' '}de Google.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-bg to-surface flex items-center justify-center">
          <div className="container max-w-md">
            <div className="bg-surface rounded-2xl p-8 md:p-12 shadow-natural-xl text-center">
              <Loader2 className="animate-spin text-brand mx-auto mb-6" size={48} />
              <h1 className="font-display text-2xl font-bold text-fg">
                Cargando...
              </h1>
            </div>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

