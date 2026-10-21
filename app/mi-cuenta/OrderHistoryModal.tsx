/**
 * Modal de Historial de Pedidos
 * Muestra todas las órdenes confirmadas en formato lista
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import { formatDateShort, formatCurrency } from '@/lib/sanity/utils';
import { OrderItemDetail } from '@/components/orders/OrderItemDetail';
import type { SanityOrder } from '@/lib/sanity/orders';
import { useDialogFocus } from '@/lib/hooks/useDialogFocus';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: SanityOrder[];
  giftsSent?: SanityOrder[];
}

export function OrderHistoryModal({ isOpen, onClose, orders, giftsSent = [] }: OrderHistoryModalProps) {
  // Combinar órdenes normales y regalos enviados
  const allOrders = [...orders, ...giftsSent].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-scrim/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-history-title"
            tabIndex={-1}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] bg-surface rounded-2xl shadow-natural-xl overflow-hidden m-2 md:m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 flex items-center justify-between z-10">
              <h2 id="order-history-title" className="font-display text-2xl font-bold text-fg">
                Historial de Pedidos
              </h2>
              <button
                onClick={onClose}
                className="text-muted hover:text-fg transition-colors p-2 hover:bg-bg rounded-lg"
                aria-label="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
              {allOrders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted">Aún no tienes pedidos confirmados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allOrders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-bg/30 rounded-xl p-6 border border-line hover:border-brand/30 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-xl font-semibold text-fg">
                              Orden {order.orderId}
                            </h3>
                            {order.isGift && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 text-xs font-medium">
                                <Gift size={12} />
                                Regalo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted">
                            {formatDateShort(order.createdAt)}
                            {order.paymentDate && (
                              <span className="ml-2">
                                • Pagado: {formatDateShort(order.paymentDate)}
                              </span>
                            )}
                          </p>
                          {order.isGift && order.recipientEmail && (
                            <p className="text-sm text-brand mt-1">
                              🎁 Regalado a: {order.recipientName || order.recipientEmail}
                            </p>
                          )}
                          {order.flowOrder && (
                            <p className="text-xs text-muted/60 mt-1">
                              Flow: {order.flowOrder}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-display text-2xl font-bold text-fg mb-2">
                            {formatCurrency(order.total, order.currency)}
                          </div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-tint/20 text-brand text-xs font-medium">
                            ✅ Confirmado
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-line space-y-2">
                        {order.items.map((item, idx) => (
                          <OrderItemDetail
                            key={idx}
                            item={item}
                            orderId={order.orderId}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
