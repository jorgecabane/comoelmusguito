/**
 * Página de Checkout
 * Layout 2 columnas (desktop): formulario izquierda, resumen + pago derecha
 * Mobile: resumen colapsable arriba, formulario, botón pago sticky abajo
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useCartStore } from '@/lib/store/useCartStore';
import { useCartPriceSync } from '@/lib/store/useCartPriceSync';
import { useCartHydrated } from '@/lib/store/useCartHydrated';
import { Button, Input } from '@/components/ui';
import {
  PaymentMethodSelector,
  PayPalCheckoutButton,
  InternationalItemsModal,
  AvailabilityErrorModal,
  type AvailabilityIssue,
} from '@/components/checkout';
import { canPurchaseInternationally } from '@/lib/utils/cart-validation';
import { getUserCountryClient } from '@/lib/utils/geolocation.client';
import { Loader2, ArrowLeft, Gift, ChevronDown, MapPin, Truck, Package, Info } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CHILE_REGIONS, getCommunesByRegion } from '@/lib/utils/chile-regions';

const PAYPAL_ENABLED = !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, removeItem } = useCartStore();
  const cartHydrated = useCartHydrated();
  const pricesUpdated = useCartPriceSync();
  const { data: session, status } = useSession();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contacto
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Regalo
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');

  // Despacho — preferencia única para todo el grupo despachable
  const [shippingGroupPreference, setShippingGroupPreference] = useState<'shipping' | 'pickup'>('pickup');
  const [shippingRegion, setShippingRegion] = useState('');
  const [shippingComuna, setShippingComuna] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingNumber, setShippingNumber] = useState('');
  const [shippingDetails, setShippingDetails] = useState('');
  const [shippingContactEmail, setShippingContactEmail] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingRut, setShippingRut] = useState('');

  // Mobile: resumen expandido
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Gateway selection
  const [selectedGateway, setSelectedGateway] = useState<'flow' | 'paypal'>('flow');
  const [checkoutState, setCheckoutState] = useState<
    'idle' | 'creating_order' | 'paypal_processing' | 'flow_redirecting' | 'polling' | 'confirmed' | 'error'
  >('idle');
  const [commerceOrderId, setCommerceOrderId] = useState<string | null>(null);
  const [paypalTotal, setPaypalTotal] = useState<number>(0);
  const [paypalCurrency, setPaypalCurrency] = useState<string>('USD');
  const [paypalQuoteLoading, setPaypalQuoteLoading] = useState(false);

  // International items modal
  const [showIntlModal, setShowIntlModal] = useState(false);
  // Availability error modal (item con problema de stock/fecha/disponibilidad)
  const [availabilityIssue, setAvailabilityIssue] = useState<AvailabilityIssue | null>(null);

  const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const isRecaptchaConfigured = !!RECAPTCHA_SITE_KEY;

  // Grupos de productos
  const shippableItems = useMemo(() => items.filter((i) => i.shippingAvailable === true), [items]);
  const nonShippableItems = useMemo(() => items.filter((i) => !i.shippingAvailable), [items]);
  const hasShippableItems = shippableItems.length > 0;
  const hasSelectedShipping = shippingGroupPreference === 'shipping' && hasShippableItems;

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = items[0]?.currency || 'CLP';
  const availableCommunes = shippingRegion ? getCommunesByRegion(shippingRegion) : [];

  // Pre-llenar desde sesión y último despacho anterior
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setEmail(session.user.email || '');
      setCustomerName(session.user.name || '');
      if (session.user.email) setShippingContactEmail(session.user.email);
      setCreateAccount(false);

      if (session.user.email) {
        fetch(`/api/auth/user-id?email=${encodeURIComponent(session.user.email)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.userId) {
              setUserId(data.userId);
              return fetch(`/api/checkout/last-shipping?userId=${encodeURIComponent(data.userId)}`);
            }
          })
          .then((res) => res?.json())
          .then((data) => {
            if (data?.shippingAddress) {
              const addr = data.shippingAddress;
              if (addr.region) setShippingRegion(addr.region);
              if (addr.comuna) setShippingComuna(addr.comuna);
              if (addr.address) setShippingAddress(addr.address);
              if (addr.number) setShippingNumber(addr.number);
              if (addr.details) setShippingDetails(addr.details);
              if (addr.contactEmail) setShippingContactEmail(addr.contactEmail);
              if (addr.phone) setShippingPhone(addr.phone);
              if (addr.rut) setShippingRut(addr.rut);
            }
          })
          .catch((err) => console.error('Error pre-llenando datos de despacho:', err));
      }
    }
  }, [session, status]);

  useEffect(() => {
    // Sin esperar la rehidratación, un load directo de /checkout rebota al carrito.
    if (cartHydrated && items.length === 0) router.push('/carrito');
  }, [cartHydrated, items, router]);

  // Auto-detect country for default gateway
  useEffect(() => {
    if (!PAYPAL_ENABLED) return;
    const country = getUserCountryClient();
    if (country !== 'CL') {
      setSelectedGateway('paypal');
    }
  }, []);

  // International items check when PayPal selected
  useEffect(() => {
    if (selectedGateway !== 'paypal' || !PAYPAL_ENABLED) return;
    const { ok } = canPurchaseInternationally(items);
    if (!ok && !isGift) {
      setShowIntlModal(true);
    }
  }, [selectedGateway, items, isGift]);

  // Cotizar total real para PayPal (refleja conversión CLP→USD del servidor)
  const paypalQuoteSignature = useMemo(
    () =>
      JSON.stringify(
        items.map((it) => ({ id: it.id, type: it.type, q: it.quantity, p: it.price, c: it.currency })),
      ),
    [items],
  );

  useEffect(() => {
    if (!PAYPAL_ENABLED || selectedGateway !== 'paypal' || items.length === 0) return;

    const controller = new AbortController();
    setPaypalQuoteLoading(true);
    const timer = setTimeout(() => {
      fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, gateway: 'paypal', isGift }),
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          setPaypalTotal(data.total);
          setPaypalCurrency(data.currency);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') console.error('quote error:', err);
        })
        .finally(() => setPaypalQuoteLoading(false));
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
      setPaypalQuoteLoading(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalQuoteSignature, selectedGateway, isGift]);

  if (items.length === 0) return null;

  const isSubmitDisabled =
    loading ||
    !email ||
    !email.includes('@') ||
    (status !== 'authenticated' && !customerName.trim()) ||
    (isGift && (!recipientEmail || !recipientEmail.includes('@'))) ||
    (hasSelectedShipping &&
      (!shippingRegion ||
        !shippingComuna ||
        !shippingAddress ||
        !shippingNumber ||
        !shippingContactEmail ||
        !shippingContactEmail.includes('@') ||
        !shippingPhone ||
        !shippingRut));

  /** Sync form validation. Returns error message or null if valid. */
  const validateForm = (): string | null => {
    if (!email || !email.includes('@')) return 'Por favor ingresa un email válido';
    if (status !== 'authenticated' && !customerName.trim()) return 'Por favor ingresa tu nombre completo';
    if (createAccount) {
      if (!password || password.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    }
    if (isGift) {
      if (!recipientEmail || !recipientEmail.includes('@')) return 'Por favor ingresa un email válido del destinatario';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return 'El email del destinatario no es válido';
      if (recipientEmail.toLowerCase() === email.toLowerCase()) return 'No puedes regalarte algo a ti mismo';
      if (giftMessage && giftMessage.length > 500) return 'El mensaje personalizado no puede exceder 500 caracteres';
    }
    if (hasSelectedShipping) {
      if (!shippingContactEmail || !shippingContactEmail.includes('@'))
        return 'Por favor ingresa un email de contacto válido para el despacho';
      if (!shippingPhone.trim()) return 'Por favor ingresa un número de teléfono para el despacho';
      if (!shippingRut.trim()) return 'Por favor ingresa el RUT para el despacho';
    }
    return null;
  };

  /**
   * Async: registra cuenta si corresponde y crea la orden vía POST /api/checkout
   * con el gateway dado. Devuelve el commerceOrderId.
   * Lanza si algo falla; el caller (botón PayPal o submit Flow) maneja el error.
   */
  const createCheckoutOrder = async (
    gateway: 'flow' | 'paypal',
  ): Promise<{ data: Record<string, unknown> }> => {
    let finalUserId: string | undefined = userId;

    if (!finalUserId && createAccount && password) {
      let recaptchaToken: string | undefined;
      if (isRecaptchaConfigured) {
        if (!executeRecaptcha) throw new Error('reCAPTCHA no está listo. Por favor recarga la página.');
        recaptchaToken = await executeRecaptcha('register');
        if (!recaptchaToken) throw new Error('Error generando verificación de seguridad. Intenta nuevamente.');
      }
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: customerName || undefined, password, recaptchaToken }),
      });
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(registerData.error || 'Error al crear cuenta');
      finalUserId = registerData.userId;
      await signIn('credentials', { email, password, redirect: false });
    }

    const itemsWithSnapshot = await Promise.all(
      items.map(async (item) => {
        const itemShippingPref = item.shippingAvailable ? shippingGroupPreference : undefined;
        try {
          const res = await fetch(`/api/products/snapshot?id=${item.id}&type=${item.type}`);
          if (res.ok) {
            const snapshot = await res.json();
            return { ...item, snapshot: snapshot.data, shippingPreference: itemShippingPref };
          }
        } catch {
          // fallback below
        }
        return {
          ...item,
          snapshot: { image: item.image, description: item.name },
          shippingPreference: itemShippingPref,
        };
      }),
    );

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: itemsWithSnapshot,
        email,
        customerName: customerName || undefined,
        userId: finalUserId,
        gateway,
        isGift: isGift || undefined,
        recipientEmail: isGift ? recipientEmail : undefined,
        recipientName: isGift ? recipientName : undefined,
        giftMessage: isGift ? giftMessage : undefined,
        requiresShipping: hasSelectedShipping || undefined,
        shippingAddress: hasSelectedShipping
          ? {
              region: shippingRegion,
              comuna: shippingComuna,
              address: shippingAddress,
              number: shippingNumber,
              details: shippingDetails || undefined,
              contactEmail: shippingContactEmail,
              phone: shippingPhone,
              rut: shippingRut,
            }
          : undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data.error || 'Error al procesar el pago';
      if (data.availabilityIssue) {
        const err = new Error(message) as Error & { availabilityIssue: AvailabilityIssue };
        err.availabilityIssue = {
          message,
          itemId: data.itemId,
          itemType: data.itemType,
          itemName: data.itemName,
        };
        throw err;
      }
      throw new Error(message);
    }
    return { data };
  };

  /** Returns the AvailabilityIssue payload if `err` is one of those tagged errors. */
  const getAvailabilityIssue = (err: unknown): AvailabilityIssue | null => {
    if (err && typeof err === 'object' && 'availabilityIssue' in err) {
      const tagged = (err as { availabilityIssue?: AvailabilityIssue }).availabilityIssue;
      return tagged ?? null;
    }
    return null;
  };

  /** PayPal SDK callback: crea la orden Sanity y devuelve el commerceOrderId. */
  const preparePayPalOrder = async (): Promise<string> => {
    setError(null);
    setAvailabilityIssue(null);
    try {
      const { data } = await createCheckoutOrder('paypal');
      setCommerceOrderId(data.commerceOrder as string);
      setPaypalTotal(data.total as number);
      setPaypalCurrency(data.currency as string);
      setCheckoutState('paypal_processing');
      return data.commerceOrder as string;
    } catch (err) {
      const issue = getAvailabilityIssue(err);
      if (issue) setAvailabilityIssue(issue);
      throw err;
    }
  };

  /** Submit del form Flow (PayPal usa el SDK directamente, no este handler). */
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    // Con PayPal seleccionado el flujo lo dispara el botón SDK; ignorar Enter en el form.
    if (selectedGateway === 'paypal') return;

    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setAvailabilityIssue(null);
    try {
      const { data } = await createCheckoutOrder('flow');
      if (data.paymentUrl && data.token) {
        setCheckoutState('flow_redirecting');
        const sep = (data.paymentUrl as string).includes('?') ? '&' : '?';
        window.location.href = `${data.paymentUrl}${sep}token=${data.token}`;
      } else if (data.paymentUrl) {
        setCheckoutState('flow_redirecting');
        window.location.href = data.paymentUrl as string;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err) {
      const issue = getAvailabilityIssue(err);
      if (issue) {
        setAvailabilityIssue(issue);
      } else {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/checkout' });
    } catch {
      setError('Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  // PayPal button callbacks
  const handlePayPalSuccess = () => {
    setCheckoutState('confirmed');
    setTimeout(() => {
      router.push(`/checkout/callback?order=${commerceOrderId}`);
    }, 1500);
  };

  const handlePayPalCancel = () => {
    setCheckoutState('idle');
    setError(null);
  };

  const handlePayPalError = (errorMessage: string) => {
    setCheckoutState('error');
    setError(errorMessage);
  };

  // CTA de pago. Definido como JSX inline (NO como componente local) para evitar
  // que cada render de CheckoutPage cree una nueva referencia de componente y
  // remonte el árbol PayPalScriptProvider/PayPalButtons. Si el SDK se remontea
  // mientras el popup está abierto, queda huérfano y se cierra silenciosamente
  // sin disparar onApprove/onCancel/onError.
  const renderPayCTA = (className = '') =>
    PAYPAL_ENABLED && selectedGateway === 'paypal' ? (
      <div className={className}>
        <PayPalCheckoutButton
          currency={paypalCurrency}
          validate={validateForm}
          prepareOrder={preparePayPalOrder}
          onSuccess={handlePayPalSuccess}
          onCancel={handlePayPalCancel}
          onError={handlePayPalError}
        />
      </div>
    ) : (
      <Button
        type="submit"
        form="checkout-form"
        variant="primary"
        size="lg"
        className={`w-full ${className}`}
        disabled={isSubmitDisabled || checkoutState !== 'idle'}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2" size={18} />
            Procesando...
          </>
        ) : (
          `Pagar $${total.toLocaleString('es-CL')} ${currency}`
        )}
      </Button>
    );

  return (
    <div className="min-h-screen bg-white pt-20">

      {/* Mobile: barra resumen colapsable — debajo del header global fijo (h-20 = 80px) */}
      <div className="lg:hidden sticky top-20 z-40 bg-cream/95 backdrop-blur-sm border-b border-gray/10">
        <button
          type="button"
          onClick={() => setSummaryExpanded(!summaryExpanded)}
          className="w-full px-5 py-3 flex items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-forest">
            <Package size={15} className="text-musgo" />
            {summaryExpanded ? 'Ocultar' : 'Ver'} resumen ({totalItems}{' '}
            {totalItems === 1 ? 'producto' : 'productos'})
            <ChevronDown
              size={13}
              className={`text-musgo transition-transform duration-200 ${summaryExpanded ? 'rotate-180' : ''}`}
            />
          </span>
          <span className="font-bold text-forest text-sm">
            ${total.toLocaleString('es-CL')} {currency}
          </span>
        </button>
        <AnimatePresence>
          {summaryExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 space-y-2.5">
                {items.map((item) => (
                  <div key={`${item.id}-${item.type}`} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray truncate">{item.name}</span>
                      <span className="text-xs bg-gray/15 rounded-full px-2 py-0.5 flex-shrink-0">
                        ×{item.quantity}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-forest ml-3 flex-shrink-0">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray/20 pt-2.5 flex justify-between font-bold text-forest">
                  <span>Total</span>
                  <span>
                    ${total.toLocaleString('es-CL')} {currency}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layout principal */}
      <form id="checkout-form" onSubmit={handleCheckout}>
        <div className="lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px]">
          {/* ── COLUMNA IZQUIERDA: Formulario ── */}
          <div className="px-5 py-8 lg:px-10 xl:px-16 lg:py-10 pb-32 lg:pb-12">
            <div className="max-w-[480px] mx-auto lg:ml-auto lg:mr-8 space-y-8">

              {/* Link volver */}
              <Link
                href="/carrito"
                className="inline-flex items-center gap-1.5 text-sm text-gray hover:text-forest transition-colors"
              >
                <ArrowLeft size={15} />
                Volver al carrito
              </Link>

              {pricesUpdated && (
                <div className="flex items-start gap-2 rounded-lg border border-ambar/30 bg-ambar/10 p-3 text-sm text-forest">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <span>Actualizamos los precios de tu pedido con los valores vigentes. Revisa el total antes de pagar.</span>
                </div>
              )}

              {/* SECCIÓN 1: Contacto */}
              <section>
                <h2 className="font-display text-base font-semibold text-forest mb-4 uppercase tracking-wide">
                  Contacto
                </h2>
                {status === 'authenticated' ? (
                  <div className="bg-musgo/10 border border-musgo/20 rounded-xl p-4">
                    <p className="text-sm text-forest">
                      ✅ Sesión iniciada como <strong>{session?.user?.email}</strong>
                    </p>
                    <p className="text-xs text-gray mt-1">Tu pedido se vinculará automáticamente a tu cuenta.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Correo electrónico *"
                      required
                      disabled={loading}
                    />
                    <Input
                      id="customerName"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nombre completo *"
                      required
                      disabled={loading}
                    />
                    <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={(e) => setCreateAccount(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-musgo border-gray/30 rounded focus:ring-musgo flex-shrink-0"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray group-hover:text-forest transition-colors">
                        Crear cuenta para ver mis pedidos y acceder a cursos
                      </span>
                    </label>

                    <AnimatePresence>
                      {createAccount && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden pt-1"
                        >
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Contraseña (mín. 6 caracteres) *"
                            required={createAccount}
                            disabled={loading}
                          />
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirmar contraseña *"
                            required={createAccount}
                            disabled={loading}
                          />
                          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                            <div className="pt-1">
                              <div className="flex items-center gap-3 my-3">
                                <div className="flex-1 border-t border-gray/20" />
                                <span className="text-xs text-gray">o</span>
                                <div className="flex-1 border-t border-gray/20" />
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                              >
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continuar con Google
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* SECCIÓN 2: Entrega (solo si hay productos despachables) */}
              {hasShippableItems && (
                <section className="border-t border-gray/10 pt-8">
                  <h2 className="font-display text-base font-semibold text-forest mb-1 uppercase tracking-wide">
                    Entrega
                  </h2>
                  <p className="text-sm text-gray mb-5">¿Cómo quieres recibir tus productos?</p>

                  {/* Grupo: productos con despacho disponible */}
                  <div className="rounded-xl border border-gray/15 overflow-hidden mb-4">
                    {/* Header del grupo */}
                    <div className="bg-cream/60 px-4 py-3 border-b border-gray/10">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Truck size={13} className="text-musgo" />
                        <span className="text-xs font-bold text-forest uppercase tracking-wider">
                          Con despacho disponible
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {shippableItems.map((item) => (
                          <p key={`${item.id}-${item.type}`} className="text-sm text-gray">
                            {item.name}{' '}
                            <span className="text-xs text-gray/50">×{item.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    {/* Toggle grupo */}
                    <div className="grid grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setShippingGroupPreference('pickup')}
                        className={`flex flex-col items-center gap-1.5 py-4 px-3 border-r border-gray/10 transition-all ${
                          shippingGroupPreference === 'pickup'
                            ? 'bg-musgo/10 text-forest'
                            : 'text-gray hover:bg-gray/5'
                        }`}
                      >
                        <MapPin
                          size={18}
                          className={shippingGroupPreference === 'pickup' ? 'text-musgo' : 'text-gray/40'}
                        />
                        <span className="text-sm font-semibold">Retiro en tienda</span>
                        <span className="text-xs text-gray/60">Sin costo</span>
                        {shippingGroupPreference === 'pickup' && (
                          <span className="text-[11px] font-bold text-musgo">✓ Seleccionado</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingGroupPreference('shipping')}
                        className={`flex flex-col items-center gap-1.5 py-4 px-3 transition-all ${
                          shippingGroupPreference === 'shipping'
                            ? 'bg-musgo/10 text-forest'
                            : 'text-gray hover:bg-gray/5'
                        }`}
                      >
                        <Truck
                          size={18}
                          className={shippingGroupPreference === 'shipping' ? 'text-musgo' : 'text-gray/40'}
                        />
                        <span className="text-sm font-semibold">Despacho a domicilio</span>
                        <span className="text-xs text-gray/60">Starken · a coordinar</span>
                        {shippingGroupPreference === 'shipping' && (
                          <span className="text-[11px] font-bold text-musgo">✓ Seleccionado</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Grupo: solo retiro (si hay productos sin despacho) */}
                  {nonShippableItems.length > 0 && (
                    <div className="rounded-xl border border-gray/10 px-4 py-3 bg-gray/[0.03]">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MapPin size={13} className="text-gray/50" />
                        <span className="text-xs font-bold text-gray/50 uppercase tracking-wider">
                          Solo retiro en tienda
                        </span>
                      </div>
                      {nonShippableItems.map((item) => (
                        <p key={`${item.id}-${item.type}`} className="text-sm text-gray">
                          {item.name}{' '}
                          <span className="text-xs text-gray/50">×{item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Info retiro (sin productos despachables) */}
              {!hasShippableItems && items.length > 0 && (
                <section className="border-t border-gray/10 pt-8">
                  <div className="flex items-center gap-2 bg-cream/50 rounded-xl px-4 py-3 border border-gray/10">
                    <MapPin size={15} className="text-gray/50 flex-shrink-0" />
                    <p className="text-sm text-gray">Todos los productos son de retiro en tienda</p>
                  </div>
                </section>
              )}

              {/* SECCIÓN 3: Dirección de despacho (aparece si se selecciona shipping) */}
              <AnimatePresence>
                {hasSelectedShipping && (
                  <motion.section
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-gray/10 pt-8"
                  >
                    <div className="space-y-4">
                      <div>
                        <h2 className="font-display text-base font-semibold text-forest mb-1 uppercase tracking-wide">
                          Dirección de despacho
                        </h2>
                        <p className="text-xs text-gray/70">
                          Solo dentro de Chile · <strong className="text-gray">Starken a cobrar en destino</strong> · Coordinaremos contigo después de la compra
                        </p>
                      </div>

                      {/* Contacto de entrega */}
                      <Input
                        id="shippingContactEmail"
                        type="email"
                        value={shippingContactEmail}
                        onChange={(e) => setShippingContactEmail(e.target.value)}
                        placeholder="Email de contacto *"
                        required={hasSelectedShipping}
                        disabled={loading}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          id="shippingPhone"
                          type="tel"
                          value={shippingPhone}
                          onChange={(e) => setShippingPhone(e.target.value)}
                          placeholder="Teléfono *"
                          required={hasSelectedShipping}
                          disabled={loading}
                        />
                        <Input
                          id="shippingRut"
                          type="text"
                          value={shippingRut}
                          onChange={(e) => setShippingRut(e.target.value)}
                          placeholder="RUT *"
                          required={hasSelectedShipping}
                          disabled={loading}
                        />
                      </div>

                      {/* Región y comuna */}
                      <select
                        id="shippingRegion"
                        value={shippingRegion}
                        onChange={(e) => {
                          setShippingRegion(e.target.value);
                          setShippingComuna('');
                        }}
                        required={hasSelectedShipping}
                        disabled={loading}
                        className="w-full px-4 py-3 rounded-md border-2 border-gray transition-all duration-200 font-sans text-base text-forest focus:outline-none focus:ring-2 focus:ring-musgo focus:ring-offset-2 focus:border-musgo disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray/10 bg-white"
                      >
                        <option value="">Región *</option>
                        {CHILE_REGIONS.map((region) => (
                          <option key={region.name} value={region.name}>
                            {region.name}
                          </option>
                        ))}
                      </select>

                      {shippingRegion && (
                        <select
                          id="shippingComuna"
                          value={shippingComuna}
                          onChange={(e) => setShippingComuna(e.target.value)}
                          required={hasSelectedShipping}
                          disabled={loading || !shippingRegion}
                          className="w-full px-4 py-3 rounded-md border-2 border-gray transition-all duration-200 font-sans text-base text-forest focus:outline-none focus:ring-2 focus:ring-musgo focus:ring-offset-2 focus:border-musgo disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray/10 bg-white"
                        >
                          <option value="">Comuna *</option>
                          {availableCommunes.map((comuna) => (
                            <option key={comuna} value={comuna}>
                              {comuna}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Calle y número */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Input
                            id="shippingAddress"
                            type="text"
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Calle / Avenida *"
                            required={hasSelectedShipping}
                            disabled={loading}
                          />
                        </div>
                        <Input
                          id="shippingNumber"
                          type="text"
                          value={shippingNumber}
                          onChange={(e) => setShippingNumber(e.target.value)}
                          placeholder="N° *"
                          required={hasSelectedShipping}
                          disabled={loading}
                        />
                      </div>

                      <Input
                        id="shippingDetails"
                        type="text"
                        value={shippingDetails}
                        onChange={(e) => setShippingDetails(e.target.value)}
                        placeholder="Depto, piso, referencias... (opcional)"
                        disabled={loading}
                      />
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              {/* SECCIÓN 4: Regalo */}
              <section className="border-t border-gray/10 pt-6">
                <label className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => {
                      setIsGift(e.target.checked);
                      if (!e.target.checked) {
                        setRecipientEmail('');
                        setRecipientName('');
                        setGiftMessage('');
                      }
                    }}
                    className="mt-0.5 w-4 h-4 text-musgo border-gray/30 rounded focus:ring-musgo flex-shrink-0"
                    disabled={loading}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Gift size={15} className="text-musgo" />
                      <span className="text-sm font-semibold text-forest group-hover:text-musgo transition-colors">
                        Comprar como regalo
                      </span>
                    </div>
                    <span className="text-xs text-gray">Envía este pedido como regalo a otra persona</span>
                  </div>
                </label>

                <AnimatePresence>
                  {isGift && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="Email del destinatario *"
                        required={isGift}
                        disabled={loading}
                      />
                      <Input
                        id="recipientName"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="Nombre del destinatario (opcional)"
                        disabled={loading}
                      />
                      <div>
                        <textarea
                          id="giftMessage"
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Mensaje personalizado... (opcional)"
                          maxLength={500}
                          rows={3}
                          disabled={loading}
                          className="w-full px-4 py-2.5 border border-gray/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-musgo resize-none disabled:opacity-50 text-sm"
                        />
                        <div className="flex justify-end mt-1">
                          <span className={`text-xs ${giftMessage.length >= 450 ? 'text-error' : 'text-gray/50'}`}>
                            {giftMessage.length}/500
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Error (solo mobile — en desktop se muestra en columna derecha) */}
              {error && (
                <div className="lg:hidden bg-error/10 border border-error/20 rounded-xl p-4">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Resumen + Pago (solo desktop) ── */}
          <div className="hidden lg:flex flex-col bg-[#f7f6f1] border-l border-gray/10 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
            <div className="p-8 flex flex-col flex-1 gap-6">
              <h3 className="font-display text-base font-semibold text-forest uppercase tracking-wide">
                Tu pedido
              </h3>

              {/* Productos agrupados */}
              <div className="space-y-5">
                {/* Grupo con despacho */}
                {shippableItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <Truck size={12} className="text-musgo" />
                      <span className="text-[11px] font-bold text-musgo uppercase tracking-wider">
                        Con despacho disponible
                      </span>
                    </div>
                    <div className="space-y-3">
                      {shippableItems.map((item) => (
                        <ProductRow
                          key={`${item.id}-${item.type}`}
                          item={item}
                          deliveryLabel={
                            shippingGroupPreference === 'shipping' ? '🚚 Despacho a domicilio' : '📍 Retiro en tienda'
                          }
                          deliveryColor={shippingGroupPreference === 'shipping' ? 'text-musgo' : 'text-gray/50'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Divisor */}
                {shippableItems.length > 0 && nonShippableItems.length > 0 && (
                  <div className="border-t border-gray/20" />
                )}

                {/* Grupo solo retiro */}
                {nonShippableItems.length > 0 && (
                  <div>
                    {shippableItems.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <MapPin size={12} className="text-gray/50" />
                        <span className="text-[11px] font-bold text-gray/50 uppercase tracking-wider">
                          Solo retiro en tienda
                        </span>
                      </div>
                    )}
                    <div className="space-y-3">
                      {nonShippableItems.map((item) => (
                        <ProductRow
                          key={`${item.id}-${item.type}`}
                          item={item}
                          deliveryLabel="📍 Retiro en tienda"
                          deliveryColor="text-gray/50"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Desglose de precios */}
              <div className="border-t border-gray/20 pt-4 space-y-2 mt-auto">
                <div className="flex justify-between text-sm text-gray">
                  <span>Subtotal</span>
                  <span>
                    ${total.toLocaleString('es-CL')} {currency}
                  </span>
                </div>
                {hasSelectedShipping && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray">Despacho</span>
                    <span className="text-forest font-medium">Por coordinar</span>
                  </div>
                )}
                <div className="border-t border-gray/20 pt-3 flex justify-between items-baseline">
                  <span className="font-display font-bold text-forest text-base">Total</span>
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold text-forest">
                      ${total.toLocaleString('es-CL')}
                    </span>
                    <span className="text-sm text-gray ml-1">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Error desktop */}
              {error && (
                <div className="bg-error/10 border border-error/20 rounded-xl p-3">
                  <p className="text-xs text-error">{error}</p>
                </div>
              )}

              {/* Selector de método de pago */}
              {PAYPAL_ENABLED && (
                <PaymentMethodSelector
                  selectedGateway={selectedGateway}
                  onGatewayChange={setSelectedGateway}
                  flowAmount={`$${total.toLocaleString('es-CL')}`}
                  flowCurrency="CLP"
                  paypalAmount={
                    paypalQuoteLoading || paypalTotal === 0
                      ? 'Calculando…'
                      : `$${paypalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  }
                  paypalCurrency={paypalCurrency}
                  disabled={loading || checkoutState !== 'idle'}
                />
              )}

              {/* Botón pagar desktop */}
              {renderPayCTA()}

              <p className="text-center text-xs text-gray/60">
                {selectedGateway === 'paypal' ? 'Pago seguro con PayPal' : 'Pago seguro con Flow.cl'}
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile: botón pagar sticky */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray/10 px-5 py-4">
        {PAYPAL_ENABLED && (
          <div className="mb-3">
            <PaymentMethodSelector
              selectedGateway={selectedGateway}
              onGatewayChange={setSelectedGateway}
              flowAmount={`$${total.toLocaleString('es-CL')}`}
              flowCurrency="CLP"
              paypalAmount={
                paypalQuoteLoading || paypalTotal === 0
                  ? 'Calculando…'
                  : `$${paypalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
              paypalCurrency={paypalCurrency}
              disabled={loading || checkoutState !== 'idle'}
            />
          </div>
        )}
        {renderPayCTA()}
      </div>

      {/* PayPal processing overlay */}
      {checkoutState === 'paypal_processing' && (
        <div className="fixed inset-0 z-40 bg-forest/30 backdrop-blur-[4px] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm mx-4">
            <Loader2 className="animate-spin mx-auto mb-4 text-musgo" size={32} />
            <p className="font-display text-lg font-semibold text-forest">Procesando pago</p>
            <p className="text-sm text-gray mt-2">Completa el pago en la ventana de PayPal...</p>
          </div>
        </div>
      )}

      {/* Payment confirmed overlay */}
      {checkoutState === 'confirmed' && (
        <div className="fixed inset-0 z-40 bg-forest/30 backdrop-blur-[4px] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-musgo/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-musgo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-display text-lg font-semibold text-forest">Pago confirmado</p>
            <p className="text-sm text-gray mt-2">Redirigiendo...</p>
          </div>
        </div>
      )}

      {/* International items modal */}
      <InternationalItemsModal
        open={showIntlModal}
        onClose={() => setShowIntlModal(false)}
        blockedItems={canPurchaseInternationally(items).blockedItems.map(i => ({ name: i.name, type: i.type }))}
        onMarkAsGift={() => {
          setIsGift(true);
          setShowIntlModal(false);
        }}
        onRemoveItems={() => {
          const { blockedItems } = canPurchaseInternationally(items);
          blockedItems.forEach(item => removeItem(item.id, item.type));
          setShowIntlModal(false);
        }}
      />

      {/* Availability error modal (item con problema de stock/fecha/disponibilidad) */}
      <AvailabilityErrorModal
        issue={availabilityIssue}
        onClose={() => setAvailabilityIssue(null)}
        onRemoveItem={() => {
          if (availabilityIssue?.itemId && availabilityIssue?.itemType) {
            removeItem(availabilityIssue.itemId, availabilityIssue.itemType as Parameters<typeof removeItem>[1]);
            router.refresh();
          }
          setAvailabilityIssue(null);
          setError(null);
        }}
      />
    </div>
  );
}

// Componente auxiliar para fila de producto en columna derecha
function ProductRow({
  item,
  deliveryLabel,
  deliveryColor,
}: {
  item: { id: string; type: string; name: string; image: string; price: number; quantity: number; currency: string };
  deliveryLabel: string;
  deliveryColor: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray/10 flex-shrink-0">
        {item.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        )}
        <span className="absolute -top-1 -right-1 bg-gray text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
          {item.quantity}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-forest font-medium leading-snug truncate">{item.name}</p>
        <p className={`text-xs mt-0.5 ${deliveryColor}`}>{deliveryLabel}</p>
      </div>
      <span className="text-sm font-semibold text-forest whitespace-nowrap">
        ${(item.price * item.quantity).toLocaleString('es-CL')}
      </span>
    </div>
  );
}
