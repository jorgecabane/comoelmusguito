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
      
      // Computed values
      get itemCount() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      get subtotal() {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      // Actions
      addItem: (item: CartItem) => {
        const items = get().items;
        const existingItem = items.find(
          (i) => i.id === item.id && i.type === item.type
        );
        
        if (existingItem) {
          // Si ya existe, incrementar cantidad (respetando stock)
          const newQuantity = existingItem.quantity + item.quantity;
          const maxQuantity = item.maxQuantity || 999;
          
          if (newQuantity <= maxQuantity) {
            set({
              items: items.map((i) =>
                i.id === item.id && i.type === item.type
                  ? { ...i, quantity: newQuantity }
                  : i
              ),
              isOpen: true, // Abrir modal de confirmación
            });
          } else {
            // Stock insuficiente
            console.warn('Stock insuficiente');
            // Aquí podrías mostrar un toast o mensaje
          }
        } else {
          // Agregar nuevo item
          set({
            items: [...items, item],
            isOpen: true, // Abrir modal de confirmación
          });
        }
      },
      
      removeItem: (id: string, type: CartItemType) => {
        set({
          items: get().items.filter(
            (item) => !(item.id === id && item.type === type)
          ),
        });
      },
      
      updateQuantity: (id: string, type: CartItemType, quantity: number) => {
        if (quantity <= 0) {
          // Si la cantidad es 0 o negativa, eliminar el item
          get().removeItem(id, type);
          return;
        }
        
        set({
          items: get().items.map((item) => {
            if (item.id === id && item.type === type) {
              const maxQuantity = item.maxQuantity || 999;
              const newQuantity = Math.min(quantity, maxQuantity);
              return { ...item, quantity: newQuantity };
            }
            return item;
          }),
        });
      },
      
      clearCart: () => {
        set({ items: [], isOpen: false });
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
    }
  )
);

