/**
 * Componente: Formulario de Newsletter
 * Con integración de reCAPTCHA
 */

'use client';

import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { Button, Input } from '@/components/ui';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface NewsletterFormProps {
  source?: 'footer-home' | 'footer-general' | 'contact-page' | 'other';
  variant?: 'footer' | 'inline';
}

export function NewsletterForm({ source = 'footer-home', variant = 'footer' }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isRecaptchaConfigured = !!RECAPTCHA_SITE_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email válido');
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
          recaptchaToken = await executeRecaptcha('newsletter_subscribe');
          if (!recaptchaToken) {
            setError('Error al verificar seguridad. Por favor, intenta nuevamente.');
            setLoading(false);
            return;
          }
        } catch (recaptchaError) {
          console.error('Error ejecutando reCAPTCHA:', recaptchaError);
          setError('Error al verificar seguridad. Por favor, intenta nuevamente.');
          setLoading(false);
          return;
        }
      }

      // Enviar suscripción
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al suscribirse');
      }

      setSuccess(true);
      setEmail('');

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = variant === 'footer'
    ? 'flex-1 bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50 focus:border-cream/40 focus:ring-cream/20'
    : 'flex-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || success}
          required
          className={inputClassName}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={loading || success}
          icon={loading ? <Loader2 className="animate-spin" size={20} /> : undefined}
        >
          {loading ? 'Suscribiendo...' : 'Suscribirme'}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm">
          <AlertCircle className="text-error shrink-0 mt-0.5" size={16} />
          <p className={`${variant === 'footer' ? 'text-cream/80' : 'text-error'}`}>
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="text-vida shrink-0 mt-0.5" size={16} />
          <p className={variant === 'footer' ? 'text-cream/80' : 'text-vida'}>
            ¡Te has suscrito exitosamente! Revisa tu email para confirmar.
          </p>
        </div>
      )}

      {variant === 'footer' && (
        <p className="text-sm text-cream/60">
          Sin spam. Solo contenido útil y hermosos terrarios 💚
        </p>
      )}
    </form>
  );
}

