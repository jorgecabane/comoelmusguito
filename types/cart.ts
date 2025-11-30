/**
 * Tipos TypeScript para el Carrito de Compras
 */

// Tipo de producto que se puede agregar al carrito
export type CartItemType = 'terrarium' | 'course' | 'workshop';

// Información específica de taller (con fecha seleccionada)
export interface WorkshopDateInfo {
  date: string; // ISO datetime
  spotsAvailable: number;
  price: number;
}

// Item individual en el carrito
export interface CartItem {
  id: string; // ID del producto en Sanity
  type: CartItemType;
  name: string;
  slug: string;
  image: string; // URL de la imagen
  price: number;
  currency: 'CLP' | 'USD';
  quantity: number;
  
  // Campos opcionales según tipo
  size?: string; // Para terrarios
  selectedDate?: WorkshopDateInfo; // Para talleres
  duration?: number; // Para cursos (horas)
  
  // Validaciones
  maxQuantity?: number; // Stock máximo disponible
  inStock: boolean;
}

// Estado del carrito
export interface CartState {
  items: CartItem[];
  isOpen: boolean; // Para modal de confirmación
  
  // Computed values
  itemCount: number;
  subtotal: number;
  
  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string, type: CartItemType) => void;
  updateQuantity: (id: string, type: CartItemType, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  
  // Utilidades
  getItemByIdAndType: (id: string, type: CartItemType) => CartItem | undefined;
  getItemsByType: (type: CartItemType) => CartItem[];
}

// Para el modal de confirmación
export interface AddToCartConfirmation {
  show: boolean;
  item: CartItem | null;
}
