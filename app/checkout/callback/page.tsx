/**
 * Página de Callback de Flow
 * Recibe el token después del pago y consulta el estado
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type PaymentStatus = 'loading' | 'success' | 'error' | 'pending';

export default function CheckoutCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const order = searchParams.get('order');

    if (order) {
      setOrderId(order);
    }

    if (!token && !order) {
      setStatus('error');
      setMessage('No se recibió información del pago');
      return;
    }

    // Consultar estado del pago
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch('/api/checkout/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token || undefined,
            orderId: order || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al consultar estado del pago');
        }

        // Estados de Flow: 1=Pendiente, 2=Pagado, 3=Rechazado, 4=Anulado
        if (data.paymentStatus === 2) {
          setStatus('success');
          setMessage('¡Pago confirmado! Recibirás un email con los detalles de tu compra.');
        } else if (data.paymentStatus === 3) {
          setStatus('error');
          setMessage('El pago fue rechazado. Por favor, intenta nuevamente.');
        } else if (data.paymentStatus === 4) {
          setStatus('error');
          setMessage('El pago fue anulado.');
        } else {
          setStatus('pending');
          setMessage('Tu pago está siendo procesado. Te notificaremos cuando se confirme.');
        }
      } catch (error) {
        console.error('Error consultando estado:', error);
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Error al verificar el estado del pago. Por favor, contacta a soporte.'
        );
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center"
        >
          {status === 'loading' && (
            <>
              <Loader2 className="animate-spin text-musgo mx-auto mb-6" size={64} />
              <h1 className="font-display text-3xl font-bold text-forest mb-4">
                Verificando pago...
              </h1>
              <p className="text-gray">
                Estamos confirmando el estado de tu pago
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-vida/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="text-vida" size={48} />
                </div>
              </motion.div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-forest mb-4">
                ¡Pago Confirmado! 🌱
              </h1>
              <p className="text-gray text-lg mb-8">{message}</p>
              {orderId && (
                <p className="text-sm text-gray mb-8">
                  Número de orden: <span className="font-mono font-semibold">{orderId}</span>
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="primary" size="lg">
                    Volver al Inicio
                    <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link href="/cursos">
                  <Button variant="secondary" size="lg">
                    Ver Mis Cursos
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-error/20 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="text-error" size={48} />
                </div>
              </motion.div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-forest mb-4">
                Error en el Pago
              </h1>
              <p className="text-gray text-lg mb-8">{message}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/carrito">
                  <Button variant="primary" size="lg">
                    Intentar Nuevamente
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary" size="lg">
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <Loader2 className="animate-spin text-musgo mx-auto mb-6" size={64} />
              <h1 className="font-display text-3xl font-bold text-forest mb-4">
                Pago en Proceso
              </h1>
              <p className="text-gray text-lg mb-8">{message}</p>
              {orderId && (
                <p className="text-sm text-gray mb-8">
                  Número de orden: <span className="font-mono font-semibold">{orderId}</span>
                </p>
              )}
              <Link href="/">
                <Button variant="secondary" size="lg">
                  Volver al Inicio
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

