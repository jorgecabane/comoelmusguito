'use client';

import { useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui';

interface InternationalItemsModalProps {
  open: boolean;
  onClose: () => void;
  blockedItems: Array<{ name: string; type: string }>;
  onMarkAsGift: () => void;
  onRemoveItems: () => void;
}

function formatItemNames(items: Array<{ name: string }>): string {
  if (items.length === 1) return `"${items[0].name}"`;
  const last = items[items.length - 1];
  const rest = items.slice(0, -1).map((i) => `"${i.name}"`);
  return `${rest.join(', ')} y "${last.name}"`;
}

export function InternationalItemsModal({
  open,
  onClose,
  blockedItems,
  onMarkAsGift,
  onRemoveItems,
}: InternationalItemsModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Productos solo disponibles en Chile"
        >
          <motion.div
            className="mx-4 max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 font-display text-xl font-semibold text-forest">
              Algunos productos solo se venden en Chile
            </h2>

            <p className="mb-5 text-sm leading-relaxed text-gray">
              {formatItemNames(blockedItems)} requieren entrega o asistencia
              presencial en Chile.
            </p>

            <div className="flex flex-col gap-3">
              <Button variant="primary" onClick={onMarkAsGift} className="w-full">
                Es un regalo para alguien en Chile
              </Button>

              <Button variant="secondary" onClick={onRemoveItems} className="w-full">
                Quitar del carrito
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray transition-colors hover:text-forest hover:underline"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
