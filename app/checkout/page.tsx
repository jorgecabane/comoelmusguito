/**
 * Página de Checkout
 * Crea la orden de pago y redirige a Flow
 * Incluye opción de crear cuenta
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useCartStore } from '@/lib/store/useCartStore';
import { Button, Input } from '@/components/ui';
import { Loader2, ArrowLeft, Gift } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CHILE_REGIONS, getCommunesByRegion } from '@/lib/utils/chile-regions';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, removeItem } = useCartStore();
  const { data: session, status } = useSession();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);
  // Estados de Regalo
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  // Estados de Despacho
  // Preferencias de envío por producto: 'shipping' | 'pickup' | undefined
  // Key: `${item.id}-${item.type}`
  const [itemShippingPreferences, setItemShippingPreferences] = useState<Record<string, 'shipping' | 'pickup'>>({});
  const [shippingRegion, setShippingRegion] = useState('');
  const [shippingComuna, setShippingComuna] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingNumber, setShippingNumber] = useState('');
  const [shippingDetails, setShippingDetails] = useState('');
  
  // Verificar si reCAPTCHA está configurado
  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isRecaptchaConfigured = !!RECAPTCHA_SITE_KEY;

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

    // Validaciones de regalo
    if (isGift) {
      if (!recipientEmail || !recipientEmail.includes('@')) {
        setError('Por favor ingresa un email válido del destinatario');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        setError('El email del destinatario no es válido');
        return;
      }
      if (recipientEmail.toLowerCase() === email.toLowerCase()) {
        setError('No puedes regalarte algo a ti mismo');
        return;
      }
      if (giftMessage && giftMessage.length > 500) {
        setError('El mensaje personalizado no puede exceder 500 caracteres');
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
          // Obtener token de reCAPTCHA si está configurado
          let recaptchaToken: string | undefined;
          
          if (isRecaptchaConfigured) {
            if (!executeRecaptcha) {
              setError('Error: reCAPTCHA no está listo. Por favor, recarga la página e intenta nuevamente.');
              setLoading(false);
              return;
            }

            try {
              recaptchaToken = await executeRecaptcha('register');
              
              if (!recaptchaToken) {
                setError('Error generando verificación de seguridad. Por favor, intenta nuevamente.');
                setLoading(false);
                return;
              }
            } catch (recaptchaError) {
              console.error('Error ejecutando reCAPTCHA:', recaptchaError);
              setError('Error generando verificación de seguridad. Por favor, intenta nuevamente.');
              setLoading(false);
              return;
            }
          }
          
          const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              name: customerName || undefined,
              password,
              recaptchaToken, // Incluir token si está disponible
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
      // También agregar preferencia de envío si aplica
      const itemsWithSnapshot = await Promise.all(
        items.map(async (item) => {
          const itemKey = `${item.id}-${item.type}`;
          const shippingPreference = itemShippingPreferences[itemKey];
          
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
                // Agregar preferencia de envío si el producto es despachable
                shippingPreference: item.shippingAvailable ? shippingPreference : undefined,
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
            // Agregar preferencia de envío si el producto es despachable
            shippingPreference: item.shippingAvailable ? shippingPreference : undefined,
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
          // Campos de regalo
          isGift: isGift || undefined,
          recipientEmail: isGift ? recipientEmail : undefined,
          recipientName: isGift ? recipientName : undefined,
          giftMessage: isGift ? giftMessage : undefined,
          // Campos de despacho
          requiresShipping: hasSelectedShipping || undefined,
          shippingAddress: hasSelectedShipping ? {
            region: shippingRegion,
            comuna: shippingComuna,
            address: shippingAddress,
            number: shippingNumber,
            details: shippingDetails || undefined,
          } : undefined,
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
  
  // Detectar productos que pueden enviarse (tienen shippingAvailable === true)
  const shippableItems = items.filter((item) => item.shippingAvailable === true);
  
  // Detectar si hay productos con preferencia de envío seleccionada
  const hasSelectedShipping = Object.values(itemShippingPreferences).some((pref) => pref === 'shipping');
  
  // Inicializar preferencias por defecto para productos despachables
  useEffect(() => {
    const newPreferences: Record<string, 'shipping' | 'pickup'> = {};
    shippableItems.forEach((item) => {
      const key = `${item.id}-${item.type}`;
      // Si no tiene preferencia, usar 'pickup' por defecto (retiro en local)
      if (!itemShippingPreferences[key]) {
        newPreferences[key] = 'pickup';
      }
    });
    if (Object.keys(newPreferences).length > 0) {
      setItemShippingPreferences((prev) => ({ ...prev, ...newPreferences }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]); // Solo cuando cambian los items

  const availableCommunes = shippingRegion ? getCommunesByRegion(shippingRegion) : [];
  
  // Función para actualizar preferencia de envío de un producto
  const updateItemShippingPreference = (itemId: string, itemType: string, preference: 'shipping' | 'pickup') => {
    const key = `${itemId}-${itemType}`;
    setItemShippingPreferences((prev) => ({
      ...prev,
      [key]: preference,
    }));
    // Si cambia a pickup, limpiar dirección si no hay otros productos con envío
    if (preference === 'pickup') {
      const otherHasShipping = Object.entries(itemShippingPreferences).some(
        ([k, v]) => k !== key && v === 'shipping'
      );
      if (!otherHasShipping) {
        setShippingRegion('');
        setShippingComuna('');
        setShippingAddress('');
        setShippingNumber('');
        setShippingDetails('');
      }
    }
  };

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
          <div className="space-y-4 mb-4">
            {items.map((item) => {
              const itemKey = `${item.id}-${item.type}`;
              const isShippable = item.shippingAvailable === true;
              const shippingPreference = itemShippingPreferences[itemKey] || (isShippable ? 'pickup' : undefined);
              
              return (
                <div
                  key={itemKey}
                  className="pb-3 border-b border-gray/10 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <span className="text-gray font-medium">
                        {item.name} x{item.quantity}
                      </span>
                    </div>
                    <span className="font-semibold text-gray">
                      ${(item.price * item.quantity).toLocaleString('es-CL')} {item.currency}
                    </span>
                  </div>
                  
                  {/* Selector de envío/retiro para productos despachables */}
                  {isShippable && (
                    <div className="mt-3 pt-3 border-t border-gray/10">
                      <label className="block text-xs font-semibold text-forest mb-2">
                        ¿Cómo quieres recibir este producto?
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => updateItemShippingPreference(item.id, item.type, 'pickup')}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                            shippingPreference === 'pickup'
                              ? 'border-musgo bg-musgo/10 text-forest'
                              : 'border-gray/30 text-gray hover:border-musgo/50'
                          }`}
                        >
                          📍 Retiro en local
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItemShippingPreference(item.id, item.type, 'shipping')}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                            shippingPreference === 'shipping'
                              ? 'border-musgo bg-musgo/10 text-forest'
                              : 'border-gray/30 text-gray hover:border-musgo/50'
                          }`}
                        >
                          🚚 Envío a domicilio
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {hasSelectedShipping && (
            <div className="pt-3 border-t border-gray/20 mb-3">
              <div className="flex justify-between items-baseline text-gray">
                <span className="text-sm">Costo delivery:</span>
                <span className="text-sm font-semibold">Por coordinar</span>
              </div>
              <p className="text-xs text-gray mt-1">
                Solo disponible para despacho dentro de Chile. Comoelmusguito te contactará después de la compra para coordinar el costo y fecha de envío.
              </p>
            </div>
          )}
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

          {/* Sección de Regalo */}
          <div className="pt-4 border-t border-gray/20">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => {
                  setIsGift(e.target.checked);
                  if (!e.target.checked) {
                    // Limpiar campos si se desmarca
                    setRecipientEmail('');
                    setRecipientName('');
                    setGiftMessage('');
                  }
                }}
                className="mt-1 w-5 h-5 text-musgo border-gray/30 rounded focus:ring-musgo focus:ring-2"
                disabled={loading}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-musgo" />
                  <span className="block text-sm font-semibold text-forest group-hover:text-musgo transition-colors">
                    Comprar como regalo
                  </span>
                </div>
                <span className="block text-xs text-gray mt-1">
                  Envía este pedido como regalo a otra persona
                </span>
              </div>
            </label>
          </div>

          {/* Campos de Regalo */}
          <AnimatePresence>
            {isGift && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t border-gray/20 bg-cream/30 rounded-lg p-4"
              >
                <div>
                  <label
                    htmlFor="recipientEmail"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Email del Destinatario *
                  </label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="destinatario@email.com"
                    required={isGift}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray mt-1">
                    El destinatario recibirá un email con los detalles del regalo
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="recipientName"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Nombre del Destinatario (Opcional)
                  </label>
                  <Input
                    id="recipientName"
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="María González"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="giftMessage"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Mensaje Personalizado (Opcional)
                  </label>
                  <textarea
                    id="giftMessage"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="¡Feliz cumpleaños! Espero que disfrutes este regalo..."
                    maxLength={500}
                    rows={4}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-musgo focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray">
                      El mensaje aparecerá en el email del destinatario
                    </p>
                    <span className={`text-xs ${giftMessage.length >= 450 ? 'text-error' : 'text-gray'}`}>
                      {giftMessage.length}/500
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sección de Dirección de Despacho */}
          <AnimatePresence>
            {hasSelectedShipping && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-gray/20 space-y-4"
              >
                <div className="bg-musgo/10 border border-musgo/20 rounded-lg p-4 mb-4">
                  <h3 className="font-display text-lg font-semibold text-forest mb-2">
                    🚚 Dirección de Despacho
                  </h3>
                  <p className="text-sm text-gray">
                    Los productos con despacho disponible solo se envían dentro de Chile. Comoelmusguito te contactará después de la compra para coordinar el costo y fecha de envío.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="shippingRegion"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Región *
                  </label>
                  <select
                    id="shippingRegion"
                    value={shippingRegion}
                    onChange={(e) => {
                      setShippingRegion(e.target.value);
                      setShippingComuna(''); // Reset comuna cuando cambia región
                    }}
                    required={hasSelectedShipping}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-musgo focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona una región</option>
                    {CHILE_REGIONS.map((region) => (
                      <option key={region.name} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {shippingRegion && (
                  <div>
                    <label
                      htmlFor="shippingComuna"
                      className="block text-sm font-semibold text-forest mb-2"
                    >
                      Comuna *
                    </label>
                    <select
                      id="shippingComuna"
                      value={shippingComuna}
                      onChange={(e) => setShippingComuna(e.target.value)}
                      required={hasSelectedShipping}
                      disabled={loading || !shippingRegion}
                      className="w-full px-4 py-2 border border-gray/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-musgo focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecciona una comuna</option>
                      {availableCommunes.map((comuna) => (
                        <option key={comuna} value={comuna}>
                          {comuna}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="shippingAddress"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Dirección *
                  </label>
                  <Input
                    id="shippingAddress"
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Calle, Avenida, Pasaje, etc."
                    required={hasSelectedShipping}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="shippingNumber"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Número *
                  </label>
                  <Input
                    id="shippingNumber"
                    type="text"
                    value={shippingNumber}
                    onChange={(e) => setShippingNumber(e.target.value)}
                    placeholder="123"
                    required={hasSelectedShipping}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="shippingDetails"
                    className="block text-sm font-semibold text-forest mb-2"
                  >
                    Detalles Adicionales (Opcional)
                  </label>
                  <textarea
                    id="shippingDetails"
                    value={shippingDetails}
                    onChange={(e) => setShippingDetails(e.target.value)}
                    placeholder="Depto, casa, referencias, etc."
                    rows={3}
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-musgo focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
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
            disabled={
              loading ||
              !email ||
              !email.includes('@') ||
              (isGift && (!recipientEmail || !recipientEmail.includes('@'))) ||
              (hasSelectedShipping && (!shippingRegion || !shippingComuna || !shippingAddress || !shippingNumber))
            }
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
