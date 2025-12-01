/**
 * Página de Checkout
 * Crea la orden de pago y redirige a Flow
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/useCartStore';
import { Button } from '@/components/ui';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (items.length === 0) {
      router.push('/carrito');
    }
  }, [items, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          email,
          customerName: customerName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Redirigir a Flow con el token en la URL
      if (data.paymentUrl && data.token) {
        // Construir URL con el token: url + "?token=" + token
        const separator = data.paymentUrl.includes('?') ? '&' : '?';
        const urlWithToken = `${data.paymentUrl}${separator}token=${data.token}`;
        window.location.href = urlWithToken;
      } else if (data.paymentUrl) {
        // Fallback: usar la URL tal cual si no hay token
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null; // El useEffect redirigirá
  }

  // Calcular total
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const currency = items[0]?.currency || 'CLP';

  return (
    <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/carrito"
            className="inline-flex items-center gap-2 text-gray hover:text-musgo transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Volver al carrito
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-forest mb-4">
            Finalizar Compra
          </h1>
          <p className="text-gray">
            Completa tus datos para proceder con el pago seguro
          </p>
        </div>

        {/* Resumen del pedido */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-natural-md mb-6"
        >
          <h2 className="font-display text-xl font-semibold text-forest mb-4">
            Resumen del Pedido
          </h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div
                key={`${item.id}-${item.type}`}
                className="flex justify-between text-gray"
              >
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span className="font-semibold">
                  ${(item.price * item.quantity).toLocaleString('es-CL')} {item.currency}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray/20 flex justify-between items-baseline">
            <span className="font-display text-xl font-semibold text-forest">
              Total
            </span>
            <span className="font-display text-2xl font-bold text-forest">
              ${total.toLocaleString('es-CL')} {currency}
            </span>
          </div>
        </motion.div>

        {/* Formulario */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleCheckout}
          className="bg-white rounded-2xl p-6 md:p-8 shadow-natural-md space-y-6"
        >
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-semibold text-forest mb-2"
            >
              Nombre Completo (Opcional)
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray/20 focus:outline-none focus:ring-2 focus:ring-musgo focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-forest mb-2"
            >
              Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray/20 focus:outline-none focus:ring-2 focus:ring-musgo focus:border-transparent"
              placeholder="tu@email.com"
            />
            <p className="text-sm text-gray mt-2">
              Te enviaremos la confirmación de tu compra a este email
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || !email}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Procesando...
              </>
            ) : (
              'Continuar al Pago'
            )}
          </Button>

          <div className="text-center text-sm text-gray">
            <p>🔒 Pago seguro procesado por Flow</p>
            <p className="mt-2">
              Serás redirigido a Flow para completar el pago de forma segura
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}

