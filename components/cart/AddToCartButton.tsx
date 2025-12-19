/**
 * Botón para Agregar al Carrito
 * Componente reutilizable para todos los tipos de productos
 */

'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
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
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    // Validar stock antes de agregar (solo para terrarios)
    if (item.type === 'terrarium') {
      setIsValidating(true);
      setError(null);

      try {
        const response = await fetch('/api/cart/validate-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: item.id,
            itemType: item.type,
            quantity: item.quantity || 1,
          }),
        });

        const data = await response.json();

        if (!data.available) {
          setError(data.message || 'Stock no disponible');
          setIsValidating(false);
          return;
        }

        // Stock disponible, agregar al carrito
        addItem(item);
        setIsValidating(false);
      } catch (err) {
        setError('Error validando stock. Por favor, intenta nuevamente.');
        setIsValidating(false);
      }
    } else {
      // Para cursos y talleres, agregar directamente
      addItem(item);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="bg-error/10 border border-error/20 rounded-lg p-2 text-error text-sm">
          {error}
        </div>
      )}
      <Button
        variant="primary"
        size="lg"
        onClick={handleAddToCart}
        disabled={disabled || !item.inStock || isValidating}
        icon={isValidating ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
        className={className}
      >
        {isValidating
          ? 'Validando...'
          : children || (item.inStock ? 'Agregar al Carrito' : 'Agotado')}
      </Button>
    </div>
  );
}

