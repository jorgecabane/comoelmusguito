/**
 * Validaciones de carrito para compras internacionales
 */

import type { CartItem } from '@/types/cart';

/** Tipos de producto que requieren presencia física o envío en Chile */
const PHYSICAL_ITEM_TYPES = ['terrarium', 'workshop', 'supply'] as const;

/**
 * Verifica si un item es físico/presencial (no se puede comprar desde el extranjero sin regalo)
 */
export function isPhysicalItem(item: CartItem): boolean {
  return (PHYSICAL_ITEM_TYPES as readonly string[]).includes(item.type);
}

/**
 * Evalúa si un carrito puede comprarse internacionalmente.
 * Retorna los items bloqueados que son físicos/presenciales.
 */
export function canPurchaseInternationally(items: CartItem[]): {
  ok: boolean;
  blockedItems: CartItem[];
  digitalItems: CartItem[];
} {
  const blockedItems = items.filter(isPhysicalItem);
  const digitalItems = items.filter((item) => !isPhysicalItem(item));

  return {
    ok: blockedItems.length === 0,
    blockedItems,
    digitalItems,
  };
}

/**
 * Verifica si el carrito contiene solo cursos online (requerido para PayPal sin regalo)
 */
export function isDigitalOnlyCart(items: CartItem[]): boolean {
  return items.every((item) => item.type === 'course');
}
