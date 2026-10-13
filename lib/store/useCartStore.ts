/**
 * Zustand Store para el Carrito de Compras
 * Con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartState, CartItem, CartItemType } from '@/types/cart';

const DEFAULT_MAX_QUANTITY = 999;

/** Una línea del carrito = id + tipo (+ fecha, para talleres). Sin `date` coincide con cualquier fecha. */
const isLine = (item: CartItem, id: string, type: CartItemType, date?: string) =>
  item.id === id && item.type === type && (date === undefined || item.selectedDate?.date === date);

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      // Computed values (como propiedades normales que se actualizan)
      itemCount: 0,
      subtotal: 0,
      
      // Actions
      addItem: (item: CartItem) => {
        const items = get().items;
        const date = item.selectedDate?.date;
        const existingItem = items.find(
          (i) => isLine(i, item.id, item.type) && i.selectedDate?.date === date
        );

        // Respetar stock tanto al agregar como al fusionar
        const newQuantity = (existingItem?.quantity ?? 0) + item.quantity;
        if (newQuantity > (item.maxQuantity ?? DEFAULT_MAX_QUANTITY)) {
          console.warn('Stock insuficiente');
          return;
        }

        const newItems = existingItem
          ? items.map((i) => (i === existingItem ? { ...i, quantity: newQuantity } : i))
          : [...items, item];
        
        // Recalcular valores computados
        const itemCount = newItems.reduce((total, item) => total + item.quantity, 0);
        const subtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        set({
          items: newItems,
          itemCount,
          subtotal,
          isOpen: true,
        });
      },
      
      removeItem: (id: string, type: CartItemType, date?: string) => {
        const newItems = get().items.filter((item) => !isLine(item, id, type, date));
        
        const itemCount = newItems.reduce((total, item) => total + item.quantity, 0);
        const subtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        set({
          items: newItems,
          itemCount,
          subtotal,
        });
      },
      
      updateQuantity: (id: string, type: CartItemType, quantity: number, date?: string) => {
        if (quantity <= 0) {
          // Si la cantidad es 0 o negativa, eliminar el item
          get().removeItem(id, type, date);
          return;
        }
        
        const newItems = get().items.map((item) => {
          if (isLine(item, id, type, date)) {
            const maxQuantity = item.maxQuantity ?? DEFAULT_MAX_QUANTITY;
            const newQuantity = Math.min(quantity, maxQuantity);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
        
        const itemCount = newItems.reduce((total, item) => total + item.quantity, 0);
        const subtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        set({
          items: newItems,
          itemCount,
          subtotal,
        });
      },
      
      syncPrices: (serverItems) => {
        let changed = false;

        const newItems = get().items.map((item) => {
          const server = serverItems.find((s) => s.id === item.id && s.type === item.type);
          if (!server || (server.price === item.price && server.currency === item.currency)) {
            return item;
          }
          changed = true;
          return { ...item, price: server.price, currency: server.currency };
        });

        if (!changed) return false;

        set({
          items: newItems,
          subtotal: newItems.reduce((total, item) => total + item.price * item.quantity, 0),
        });

        return true;
      },

      clearCart: () => {
        set({ 
          items: [], 
          itemCount: 0,
          subtotal: 0,
          isOpen: false 
        });
      },
      
      openCart: () => {
        set({ isOpen: true });
      },
      
      closeCart: () => {
        set({ isOpen: false });
      },
      
      // Utilidades
      getItemByIdAndType: (id: string, type: CartItemType) => {
        return get().items.find((item) => item.id === id && item.type === type);
      },
      
      getItemsByType: (type: CartItemType) => {
        return get().items.filter((item) => item.type === type);
      },
    }),
    {
      name: 'comoelmusguito-cart', // Nombre en localStorage
      storage: createJSONStorage(() => localStorage),
      // Solo persistir items, no el estado isOpen
      partialize: (state) => ({ items: state.items }),
      // Recalcular valores computados al hidratar
      onRehydrateStorage: () => (state) => {
        if (state) {
          const items = state.items;
          state.itemCount = items.reduce((total, item) => total + item.quantity, 0);
          state.subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
        }
      },
    }
  )
);

