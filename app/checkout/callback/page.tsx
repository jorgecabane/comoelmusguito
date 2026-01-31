/**
 * Página de Callback de Flow
 * Recibe el token después del pago y consulta el estado
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store/useCartStore';

type PaymentStatus = 'loading' | 'success' | 'error' | 'pending';

interface OrderItem {
  name: string;
  type: 'terrarium' | 'course' | 'workshop' | 'supply';
  quantity: number;
  price: number;
  currency: 'CLP' | 'USD';
  slug?: string;
}

function CheckoutCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const clearCart = useCartStore((state) => state.clearCart);
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [hasCourses, setHasCourses] = useState(false);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  // Información de regalo
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [giftMessage, setGiftMessage] = useState<string | null>(null);
  // Información de despacho
  const [requiresShipping, setRequiresShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<{
    region: string;
    comuna: string;
    address: string;
    number: string;
    details?: string;
  } | null>(null);
  
  const isLoggedIn = sessionStatus === 'authenticated' && session?.user;

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
          setMessage('¡Tu compra fue exitosa! Hemos recibido tu pago y estamos preparando todo para ti. Recibirás un email con los detalles de tu compra en los próximos minutos.');
          // Vaciar carrito cuando el pago es exitoso
          clearCart();
          // Obtener detalles de la orden para mostrar items
          if (data.commerceOrder) {
            fetchOrderDetails(data.commerceOrder);
          }
          
          // Guardar email y nombre para crear cuenta si es necesario
          if (data.customerEmail) {
            setCustomerEmail(data.customerEmail);
          }
          if (data.customerName) {
            setCustomerName(data.customerName);
          }
        } else if (data.paymentStatus === 3) {
          setStatus('error');
          setMessage('El pago no pudo ser procesado. No te preocupes, tu dinero está seguro. Por favor, intenta nuevamente o contáctanos si el problema persiste.');
          // NO vaciar carrito si el pago falla
        } else if (data.paymentStatus === 4) {
          setStatus('error');
          setMessage('El pago fue anulado. Si tienes alguna pregunta, no dudes en escribirnos.');
          // NO vaciar carrito si el pago fue anulado
        } else {
          setStatus('pending');
          setMessage('Tu pago está siendo procesado. Esto puede tomar unos minutos. Te notificaremos por email cuando se confirme.');
          // NO vaciar carrito cuando el pago está pendiente - esperar confirmación
          // El carrito se limpiará cuando el pago se confirme (status 2)
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
  }, [searchParams, clearCart]);

  // Función para obtener detalles de la orden
  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/checkout/order-details?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          setOrderItems(data.items);
          
          // Verificar si hay cursos
          const courses = data.items.filter((item: OrderItem) => item.type === 'course');
          if (courses.length > 0) {
            setHasCourses(true);
            // Obtener el slug del primer curso (o podríamos mostrar todos)
            if (courses[0].slug) {
              setCourseSlug(courses[0].slug);
            }
          }
        }
        if (data.customerEmail) {
          setCustomerEmail(data.customerEmail);
        }
        if (data.customerName) {
          setCustomerName(data.customerName);
        }
        // Información de regalo
        if (data.isGift) {
          setIsGift(true);
          setRecipientEmail(data.recipientEmail || null);
          setRecipientName(data.recipientName || null);
          setGiftMessage(data.giftMessage || null);
        }
        // Información de despacho
        if (data.requiresShipping) {
          setRequiresShipping(true);
          setShippingAddress(data.shippingAddress || null);
        }
      }
    } catch (error) {
      console.error('Error obteniendo detalles de la orden:', error);
    }
  };

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
                {isGift ? '¡Regalo Enviado Exitosamente! 🎁' : '¡Tu Compra Fue Exitosa! 🌿'}
              </h1>
              <p className="text-gray text-lg mb-6 leading-relaxed">{message}</p>
              
              {/* Badge de Regalo */}
              {isGift && (
                <div className="bg-cream border-2 border-musgo/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="text-musgo" size={20} />
                    <p className="font-semibold text-forest">Este pedido es un regalo</p>
                  </div>
                  <p className="text-xs text-gray mt-3">
                    El destinatario recibirá un email con los detalles del regalo y un código para canjearlo.
                  </p>
                </div>
              )}
              
              {/* Badge de Despacho */}
              {requiresShipping && (
                <div className="bg-amber-50 border-2 border-amber-300/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🚚</span>
                    <p className="font-semibold text-forest">Este pedido incluye despacho</p>
                  </div>
                  {shippingAddress && (
                    <div className="text-sm text-gray mt-2">
                      <p className="font-medium text-forest mb-1">Dirección de envío:</p>
                      <p>{shippingAddress.address} {shippingAddress.number}</p>
                      <p>{shippingAddress.comuna}, {shippingAddress.region}</p>
                      {shippingAddress.details && <p className="text-xs mt-1">{shippingAddress.details}</p>}
                    </div>
                  )}
                  <p className="text-xs text-amber-700 mt-3 font-medium">
                    ⚠️ Comoelmusguito te contactará para coordinar el costo y fecha de envío.
                  </p>
                </div>
              )}
              
              {orderId && (
                <div className="bg-cream rounded-xl p-4 mb-6">
                  <p className="text-sm text-gray mb-2">Número de orden</p>
                  <p className="font-mono font-semibold text-forest text-lg">{orderId}</p>
                </div>
              )}

              {/* Lista de productos comprados */}
              {orderItems.length > 0 && (
                <div className="bg-cream/50 rounded-xl p-6 mb-8 text-left">
                  <h3 className="font-display text-lg font-semibold text-forest mb-4">
                    Lo que compraste:
                  </h3>
                  <div className="space-y-3">
                    {orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center pb-3 border-b border-gray/10 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-forest">{item.name}</p>
                          <p className="text-sm text-gray">
                            {item.type === 'terrarium' && '🌿 Terrario'}
                            {item.type === 'course' && '🎓 Curso Online'}
                            {item.type === 'workshop' && '🤝 Taller Presencial'}
                            {item.type === 'supply' && '🛠️ Insumo'}
                            {' · '}
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-forest">
                            {new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: item.currency,
                            }).format(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <p className="text-gray text-sm">
                  📧 Revisa tu email para ver los detalles completos de tu compra
                </p>
                
                {/* Mensaje especial para cursos - Solo si NO es regalo */}
                {hasCourses && !isGift && (
                  <div className="bg-musgo/10 border border-musgo/20 rounded-lg p-4">
                    <p className="text-sm font-semibold text-forest mb-2">
                      🎓 Para acceder a tu curso online:
                    </p>
                    {!isLoggedIn && (
                      <>
                        <p className="text-sm text-gray mb-3">
                          {courseSlug ? (
                            <>
                              Necesitas crear una cuenta para ver tu curso y seguir tu progreso.
                            </>
                          ) : (
                            <>
                              Necesitas crear una cuenta para acceder a tus cursos.
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray/60 mb-3">
                          Al crear tu cuenta con el mismo email ({customerEmail || 'tu email'}), tu curso se vinculará automáticamente.
                        </p>
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      {isLoggedIn ? (
                        <Link href="/mi-cuenta?filter=courses">
                          <Button variant="primary" size="sm" className="w-full sm:w-auto">
                            Ver mi Curso
                          </Button>
                        </Link>
                      ) : (
                        <>
                          {courseSlug && (
                            <Link href={`/cursos/${courseSlug}`}>
                              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                                Ver mi Curso
                              </Button>
                            </Link>
                          )}
                          <Link
                            href={`/auth/register${customerEmail ? `?email=${encodeURIComponent(customerEmail)}${customerName ? `&name=${encodeURIComponent(customerName)}` : ''}` : ''}`}
                          >
                            <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                              Crear mi Cuenta
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button variant="primary" size="lg">
                    Seguir Explorando
                    <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link href="/mi-cuenta">
                  <Button variant="secondary" size="lg">
                    Ver Mi Cuenta
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
                Algo Salió Mal
              </h1>
              <p className="text-gray text-lg mb-6 leading-relaxed">{message}</p>
              
              <div className="bg-cream/50 rounded-xl p-6 mb-8 text-left">
                <p className="text-sm text-gray mb-2">💡 ¿Necesitas ayuda?</p>
                <p className="text-sm text-gray">
                  Si el problema persiste, escríbenos y te ayudaremos a completar tu compra.
                </p>
              </div>

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
                Procesando tu Pago
              </h1>
              <p className="text-gray text-lg mb-6 leading-relaxed">{message}</p>
              
              {orderId && (
                <div className="bg-cream rounded-xl p-4 mb-8">
                  <p className="text-sm text-gray mb-2">Número de orden</p>
                  <p className="font-mono font-semibold text-forest text-lg">{orderId}</p>
                </div>
              )}

              <div className="bg-cream/50 rounded-xl p-6 mb-8">
                <p className="text-sm text-gray text-center">
                  ⏳ Esto puede tomar unos minutos. Te notificaremos por email cuando se confirme.
                </p>
              </div>

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

export default function CheckoutCallbackPage() {
  return (
    <Suspense fallback={
      <div className="pt-32 pb-16 min-h-screen bg-gradient-to-br from-cream to-white flex items-center justify-center">
        <div className="container max-w-2xl">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-natural-xl text-center">
            <Loader2 className="animate-spin text-musgo mx-auto mb-6" size={64} />
            <h1 className="font-display text-3xl font-bold text-forest mb-4">
              Cargando...
            </h1>
          </div>
        </div>
      </div>
    }>
      <CheckoutCallbackContent />
    </Suspense>
  );
}

