/**
 * Modal para canjear regalo con token
 */

'use client';

import { useState } from 'react';
import { X, Gift, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { motion } from 'framer-motion';
import { useDialogFocus } from '@/lib/hooks/useDialogFocus';

interface RedeemGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RedeemGiftModal({ isOpen, onClose, onSuccess }: RedeemGiftModalProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const dialogRef = useDialogFocus<HTMLDivElement>(isOpen, onClose);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token.trim()) {
      setError('Por favor ingresa el token de regalo');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/gifts/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al canjear el regalo');
      }

      setSuccess(true);
      setSuccessMessage(data.message || '¡Regalo canjeado exitosamente!');
      
      // Si hay errores parciales, mostrarlos
      if (data.errors && data.errors.length > 0) {
        setSuccessMessage(
          `${data.message}\n\nNota: ${data.errors.join(', ')}`
        );
      }

      // Limpiar token después de 2 segundos y cerrar
      setTimeout(() => {
        setToken('');
        setSuccess(false);
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="redeem-gift-title"
        tabIndex={-1}
        className="bg-surface rounded-2xl shadow-natural-xl max-w-md w-full p-6 md:p-8 relative"
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-fg transition-colors"
          disabled={loading}
          aria-label="Cerrar"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand/10 p-3 rounded-full">
            <Gift className="text-brand" size={24} />
          </div>
          <div>
            <h2 id="redeem-gift-title" className="font-display text-2xl font-bold text-fg">
              Canjear Regalo
            </h2>
            <p className="text-sm text-muted">
              Ingresa el token que recibiste por email
            </p>
          </div>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <CheckCircle className="mx-auto mb-4 text-brand" size={48} />
            <p className="text-fg font-medium whitespace-pre-line">
              {successMessage}
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label
                htmlFor="giftToken"
                className="block text-sm font-semibold text-fg mb-2"
              >
                Token de Regalo
              </label>
              <Input
                id="giftToken"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="GIFT-XXXXX-XXXXXXXX"
                disabled={loading}
                className="font-mono"
                data-autofocus
              />
              <p className="text-xs text-muted mt-2">
                El token fue enviado al email del destinatario cuando se confirmó el pago
              </p>
            </div>

            {error && (
              <div role="alert" className="bg-error/10 border border-error/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="text-error mt-0.5 flex-shrink-0" size={18} />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !token.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Canjeando...
                  </>
                ) : (
                  'Canjear Regalo'
                )}
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
