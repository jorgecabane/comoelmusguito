/**
 * Zustand Store - Carrito de Compras
 * Estado global del carrito con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartStore } from '@/types/cart';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // Agregar item al carrito
      addItem: (newItem) => {
        const items = get().items;
        
        // Para talleres, verificar si existe con la misma fecha
        if (newItem.type === 'workshop' && newItem.selectedDate) {
          const existingItem = items.find(
            (item) =>
              item.productId === newItem.productId &&
              item.selectedDate === newItem.selectedDate
          );

          if (existingItem) {
            // Incrementar cantidad si no excede el stock
            const newQuantity = existingItem.quantity + 1;
            if (newItem.maxStock && newQuantity > newItem.maxStock) {
              console.warn('Stock máximo alcanzado');
              return;
            }
            
            set({
              items: items.map((item) =>
                item.id === existingItem.id
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
            });
            return;
          }
        } else {
          // Para terrarios y cursos, verificar solo por productId
          const existingItem = items.find(
            (item) => item.productId === newItem.productId
          );

          if (existingItem) {
            // Cursos: solo uno por producto
            if (newItem.type === 'course') {
              console.warn('Este curso ya está en tu carrito');
              return;
            }

            // Terrarios: incrementar cantidad
            const newQuantity = existingItem.quantity + 1;
            if (newItem.maxStock && newQuantity > newItem.maxStock) {
              console.warn('Stock máximo alcanzado');
              return;
            }

            set({
              items: items.map((item) =>
                item.id === existingItem.id
                  ? { ...item, quantity: newQuantity }
                  : item
              ),
            });
            return;
          }
        }

        // Agregar nuevo item
        const cartItem: CartItem = {
          ...newItem,
          id: `${newItem.productId}-${Date.now()}`, // ID único
          quantity: 1,
        };

        set({ items: [...items, cartItem] });
      },

      // Remover item del carrito
      removeItem: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) });
      },

      // Actualizar cantidad
      updateQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId);
          return;
        }

        set({
          items: get().items.map((item) => {
            if (item.id === itemId) {
              // Validar stock máximo
              if (item.maxStock && quantity > item.maxStock) {
                return { ...item, quantity: item.maxStock };
              }
              return { ...item, quantity };
            }
            return item;
          }),
        });
      },

      // Limpiar carrito
      clearCart: () => {
        set({ items: [] });
      },

      // Toggle drawer del carrito
      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      // Total de items (suma de cantidades)
      totalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Total en precio
      totalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      // Items agrupados por moneda
      itemsGroupedByCurrency: () => {
        const items = get().items;
        return {
          CLP: items.filter((item) => item.currency === 'CLP'),
          USD: items.filter((item) => item.currency === 'USD'),
        };
      },
    }),
    {
      name: 'comoelmusguito-cart', // Nombre en localStorage
      version: 1,
    }
  )
);

// Helper para calcular total por moneda
export const calculateTotalByCurrency = (items: CartItem[], currency: 'CLP' | 'USD') => {
  return items
    .filter((item) => item.currency === currency)
    .reduce((total, item) => total + item.price * item.quantity, 0);
};

