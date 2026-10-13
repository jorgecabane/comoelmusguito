'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { useDialogFocus } from '@/lib/hooks/useDialogFocus';

export interface AvailabilityIssue {
  message: string;
  itemId?: string;
  itemType?: string;
  itemName?: string;
}

interface AvailabilityErrorModalProps {
  issue: AvailabilityIssue | null;
  onClose: () => void;
  onRemoveItem: () => void;
}

export function AvailabilityErrorModal({ issue, onClose, onRemoveItem }: AvailabilityErrorModalProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>(!!issue, onClose);

  useEffect(() => {
    if (!issue) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [issue]);

  const canRemove = !!(issue?.itemId && issue?.itemType);

  return (
    <AnimatePresence>
      {issue && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          aria-labelledby="availability-error-title"
        >
          <motion.div
            className="mx-4 max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="availability-error-title" className="mb-3 font-display text-xl font-semibold text-forest">No pudimos procesar tu compra</h2>

            <p className="mb-5 text-sm leading-relaxed text-gray">{issue.message}</p>

            <div className="flex flex-col gap-3">
              {canRemove && (
                <Button variant="primary" onClick={onRemoveItem} className="w-full">
                  Quitar {issue.itemName ? `"${issue.itemName}"` : 'producto'} del carrito
                </Button>
              )}

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
