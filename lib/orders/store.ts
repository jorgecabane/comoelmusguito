/**
 * Almacenamiento de Órdenes
 * Sistema simple para guardar y recuperar información de órdenes
 * 
 * Para MVP: Usa Map en memoria
 * Para Producción: Migrar a base de datos (Sanity, PostgreSQL, etc.)
 */

import 'server-only';
import type { CartItem } from '@/types/cart';

export interface OrderData {
  orderId: string;
  flowOrder?: string;
  customerEmail: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  currency: string;
  createdAt: string;
  paymentStatus?: number;
  paymentDate?: string;
}

// Cache en memoria (en producción usar Redis o DB)
const ordersCache = new Map<string, OrderData>();

/**
 * Guardar orden
 */
export function saveOrder(order: OrderData): void {
  ordersCache.set(order.orderId, order);
  
  // Limpiar órdenes antiguas (más de 7 días)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const [orderId, orderData] of ordersCache.entries()) {
    if (new Date(orderData.createdAt).getTime() < sevenDaysAgo) {
      ordersCache.delete(orderId);
    }
  }
}

/**
 * Obtener orden por ID
 */
export function getOrder(orderId: string): OrderData | undefined {
  return ordersCache.get(orderId);
}

/**
 * Actualizar estado de pago de una orden
 */
export function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: number,
  paymentDate?: string,
  flowOrder?: string
): void {
  const order = ordersCache.get(orderId);
  if (order) {
    order.paymentStatus = paymentStatus;
    if (paymentDate) order.paymentDate = paymentDate;
    if (flowOrder) order.flowOrder = flowOrder;
    ordersCache.set(orderId, order);
  }
}

