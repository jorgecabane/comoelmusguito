/**
 * Botón para Agregar al Carrito
 * Componente reutilizable para todos los tipos de productos
 */

'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCartStore } from '@/lib/store/useCartStore';
import type { CartItem } from '@/types/cart';

interface AddToCartButtonProps {
  item: CartItem;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AddToCartButton({
  item,
  disabled,
  className,
  children,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem(item);
  };

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={handleAddToCart}
      disabled={disabled || !item.inStock}
      icon={<ShoppingCart size={20} />}
      className={className}
    >
      {children || (item.inStock ? 'Agregar al Carrito' : 'Agotado')}
    </Button>
  );
}

