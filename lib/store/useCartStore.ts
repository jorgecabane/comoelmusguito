/**
 * Zustand Store para el Carrito de Compras
 * Con persistencia en localStorage
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartState, CartItem, CartItemType } from '@/types/cart';

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
        const existingItem = items.find(
          (i) => i.id === item.id && i.type === item.type
        );
        
        let newItems = items;
        
        if (existingItem) {
          // Si ya existe, incrementar cantidad (respetando stock)
          const newQuantity = existingItem.quantity + item.quantity;
          const maxQuantity = item.maxQuantity || 999;
          
          if (newQuantity <= maxQuantity) {
            newItems = items.map((i) =>
              i.id === item.id && i.type === item.type
                ? { ...i, quantity: newQuantity }
                : i
            );
          } else {
            // Stock insuficiente
            console.warn('Stock insuficiente');
            return;
          }
        } else {
          // Agregar nuevo item
          newItems = [...items, item];
        }
        
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
      
      removeItem: (id: string, type: CartItemType) => {
        const newItems = get().items.filter(
          (item) => !(item.id === id && item.type === type)
        );
        
        const itemCount = newItems.reduce((total, item) => total + item.quantity, 0);
        const subtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        set({
          items: newItems,
          itemCount,
          subtotal,
        });
      },
      
      updateQuantity: (id: string, type: CartItemType, quantity: number) => {
        if (quantity <= 0) {
          // Si la cantidad es 0 o negativa, eliminar el item
          get().removeItem(id, type);
          return;
        }
        
        const newItems = get().items.map((item) => {
          if (item.id === id && item.type === type) {
            const maxQuantity = item.maxQuantity || 999;
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

