/**
 * Página de Checkout
 * Crea la orden de pago y redirige a Flow
 * Incluye opción de crear cuenta
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useCartStore } from '@/lib/store/useCartStore';
import { Button, Input } from '@/components/ui';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, removeItem } = useCartStore();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Si el usuario está logueado, usar su información
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setEmail(session.user.email || '');
      setCustomerName(session.user.name || '');
      setCreateAccount(false); // No mostrar opción de crear cuenta si ya está logueado
      
      // Obtener userId del usuario
      if (session.user.email) {
        fetch(`/api/auth/user-id?email=${encodeURIComponent(session.user.email)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.userId) {
              setUserId(data.userId);
            }
          })
          .catch((err) => {
            console.error('Error obteniendo userId:', err);
          });
      }
    }
  }, [session, status]);

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (items.length === 0) {
      router.push('/carrito');
    }
  }, [items, router]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return;
    }

    if (createAccount) {
      if (!password || password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }

    setLoading(true);

    try {
      // Si el usuario ya está logueado, usar su userId
      // Si no está logueado pero quiere crear cuenta, crear el usuario
      let finalUserId: string | undefined = userId; // Usar userId de sesión si existe
      
      if (!finalUserId && createAccount && password) {
        try {
          const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              name: customerName || undefined,
              password,
            }),
          });

          const registerData = await registerResponse.json();

          if (!registerResponse.ok) {
            throw new Error(registerData.error || 'Error al crear cuenta');
          }

          finalUserId = registerData.userId;

          // Hacer login automático
          await signIn('credentials', {
            email,
            password,
            redirect: false,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al crear cuenta');
          setLoading(false);
          return;
        }
      }

      // Enriquecer items con snapshot del producto (para guardar en la orden)
      const itemsWithSnapshot = await Promise.all(
        items.map(async (item) => {
          try {
            // Obtener detalles del producto desde la API
            const productResponse = await fetch(
              `/api/products/snapshot?id=${item.id}&type=${item.type}`
            );
            if (productResponse.ok) {
              const snapshot = await productResponse.json();
              return {
                ...item,
                snapshot: snapshot.data,
              };
            }
          } catch (error) {
            console.error(`Error obteniendo snapshot de ${item.id}:`, error);
          }
          // Si falla, al menos guardar la imagen que ya tenemos
          return {
            ...item,
            snapshot: {
              image: item.image,
              description: item.name, // Fallback
            },
          };
        })
      );

      // Crear orden de pago
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsWithSnapshot,
          email,
          customerName: customerName || undefined,
          userId: finalUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mensaje específico si hay productos sin stock
        if (data.outOfStock) {
          setError(data.error || 'Uno o más productos ya no están disponibles');
          setLoading(false);
          // Remover el item sin stock del carrito
          if (data.itemId) {
            const itemType = items.find(i => i.id === data.itemId)?.type || 'terrarium';
            removeItem(data.itemId, itemType);
            // Refrescar la página para actualizar el carrito
            router.refresh();
          }
          return;
        }
        throw new Error(data.error || 'Error al procesar el pago');
      }

      // Redirigir a Flow con el token en la URL
      if (data.paymentUrl && data.token) {
        const separator = data.paymentUrl.includes('?') ? '&' : '?';
        const urlWithToken = `${data.paymentUrl}${separator}token=${data.token}`;
        window.location.href = urlWithToken;
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', {
        callbackUrl: '/checkout',
      });
    } catch (err) {
      setError('Error al iniciar sesión con Google');
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
          {/* Mensaje si ya está logueado */}
          {status === 'authenticated' ? (
            <div className="bg-musgo/10 border border-musgo/20 rounded-lg p-4">
              <p className="text-sm text-forest">
                ✅ Estás logueado como <strong>{session?.user?.email}</strong>. Tu pedido se vinculará automáticamente a tu cuenta.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-forest mb-2"
                >
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="customerName"
                  className="block text-sm font-semibold text-forest mb-2"
                >
                  Nombre Completo (Opcional)
                </label>
                <Input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Juan Pérez"
                  disabled={loading}
                />
              </div>

              {/* Checkbox para crear cuenta - Solo mostrar si NO está logueado */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                    className="mt-1 w-5 h-5 text-musgo border-gray/30 rounded focus:ring-musgo focus:ring-2"
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <span className="block text-sm font-semibold text-forest group-hover:text-musgo transition-colors">
                      Crear cuenta para ver mis pedidos y acceder a cursos
                    </span>
                    <span className="block text-xs text-gray mt-1">
                      Podrás ver el historial de tus compras y acceder a tus cursos online
                    </span>
                  </div>
                </label>
              </div>
            </>
          )}

            {/* Campos de contraseña (solo si marca crear cuenta y NO está logueado) */}
            <AnimatePresence>
              {createAccount && status !== 'authenticated' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-2 border-t border-gray/20"
                >
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-forest mb-2"
                    >
                      Contraseña *
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required={createAccount}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-semibold text-forest mb-2"
                    >
                      Confirmar Contraseña *
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu contraseña"
                      required={createAccount}
                      disabled={loading}
                    />
                  </div>

                  {/* Opción Google OAuth */}
                  {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                    <div className="pt-2">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray/20"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray">o</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full mt-4"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Continuar con Google
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading || !email || !email.includes('@')}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Procesando...
              </>
            ) : (
              `Pagar ${total.toLocaleString('es-CL')} ${currency}`
            )}
          </Button>

          <p className="text-center text-xs text-gray">
            🔒 Pago seguro con Flow.cl. Tus datos están protegidos.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
