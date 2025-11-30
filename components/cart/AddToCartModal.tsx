/**
 * Modal de Confirmación al Agregar al Carrito
 * Aparece cuando se agrega un producto con animación
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCartStore } from '@/lib/store/useCartStore';
import Image from 'next/image';
import Link from 'next/link';

export function AddToCartModal() {
  const { isOpen, closeCart, items } = useCartStore();
  
  // Obtener el último item agregado
  const lastItem = items[items.length - 1];

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      // Auto-cerrar después de 5 segundos
      const timer = setTimeout(() => closeCart(), 5000);
      return () => {
        window.removeEventListener('keydown', handleEsc);
        clearTimeout(timer);
      };
    }
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && lastItem && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-forest/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-natural-xl p-6 md:p-8 m-4 relative overflow-hidden">
              {/* Botón cerrar */}
              <button
                onClick={closeCart}
                className="absolute top-4 right-4 text-gray hover:text-forest transition-colors"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>

              {/* Animación de planta creciendo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="text-6xl text-center mb-4"
              >
                🌱
              </motion.div>

              {/* Mensaje */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
              >
                <h2 className="font-display text-2xl font-bold text-forest mb-2">
                  ¡Producto Agregado!
                </h2>
                <p className="text-gray">
                  Se agregó al carrito exitosamente
                </p>
              </motion.div>

              {/* Producto agregado */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 p-4 bg-cream rounded-xl mb-6"
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={lastItem.image}
                    alt={lastItem.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-forest truncate">
                    {lastItem.name}
                  </h3>
                  <p className="text-sm text-gray">
                    Cantidad: {lastItem.quantity}
                  </p>
                  <p className="text-musgo font-semibold mt-1">
                    ${lastItem.price.toLocaleString('es-CL')} {lastItem.currency}
                  </p>
                </div>
              </motion.div>

              {/* Botones */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button
                  variant="secondary"
                  onClick={closeCart}
                  className="flex-1"
                >
                  Seguir Comprando
                </Button>
                <Link href="/carrito" className="flex-1" onClick={closeCart}>
                  <Button
                    variant="primary"
                    className="w-full"
                    icon={<ShoppingBag size={18} />}
                  >
                    Ver Carrito
                  </Button>
                </Link>
              </motion.div>

              {/* Decoración de fondo */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-vida/5 rounded-full blur-3xl" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-musgo/5 rounded-full blur-3xl" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
