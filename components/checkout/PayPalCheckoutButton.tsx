'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useMemo, useRef, useState } from 'react';

interface PayPalCheckoutButtonProps {
  /** Currency PayPal SDK loads with. Must match what `prepareOrder` returns. */
  currency: string;
  /**
   * Sync form validation. Return error message to abort the click, or null to proceed.
   * Runs synchronously inside SDK's `onClick`; cannot await.
   */
  validate: () => string | null;
  /**
   * Async: creates the Sanity commerce order if needed and returns its id.
   * Caller is responsible for idempotency (reuse same id while cart unchanged).
   */
  prepareOrder: () => Promise<string>;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export function PayPalCheckoutButton({
  currency,
  validate,
  prepareOrder,
  onSuccess,
  onCancel: onCancelCallback,
  onError,
}: PayPalCheckoutButtonProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const commerceOrderIdRef = useRef<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

  // Estabilizar identidad del options para evitar que el SDK se re-monte cada render
  // (cualquier remount mientras el popup está abierto lo deja huérfano y se cierra).
  const sdkOptions = useMemo(
    () => ({ clientId, currency, intent: 'capture' as const }),
    [clientId, currency],
  );

  async function createOrder(): Promise<string> {
    const commerceOrderId = await prepareOrder();
    commerceOrderIdRef.current = commerceOrderId;

    const res = await fetch('/api/checkout/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: commerceOrderId }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      console.error('[PayPal] createOrder failed', res.status, text);
      const msg = 'Error al crear la orden de PayPal';
      onError(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    return data.paypalOrderId;
  }

  async function handleApprove(data: { orderID: string }) {
    const commerceOrderId = commerceOrderIdRef.current;
    if (!commerceOrderId) {
      console.error('[PayPal] onApprove: missing commerceOrderId');
      onError('No se encontró el id de orden');
      return;
    }
    const res = await fetch('/api/checkout/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: commerceOrderId, paypalOrderId: data.orderID }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      console.error('[PayPal] capture failed', res.status, text);
      onError('Error al capturar el pago');
      return;
    }

    onSuccess();
  }

  async function handleCancel() {
    const commerceOrderId = commerceOrderIdRef.current;
    if (commerceOrderId) {
      await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: commerceOrderId }),
      }).catch(() => {});
    }
    onCancelCallback();
  }

  return (
    <div className="min-h-[45px]">
      {!sdkReady && (
        <div className="flex h-[45px] items-center justify-center">
          <div className="h-4 w-32 animate-pulse rounded bg-gray/20" />
        </div>
      )}

      <PayPalScriptProvider options={sdkOptions}>
        <PayPalButtons
          style={{ layout: 'horizontal', tagline: false }}
          onInit={() => setSdkReady(true)}
          onClick={(_data, actions) => {
            const error = validate();
            if (error) {
              console.warn('[PayPal] onClick: validation failed', error);
              onError(error);
              return actions.reject();
            }
            return actions.resolve();
          }}
          createOrder={createOrder}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onError={(err) => {
            console.error('[PayPal] onError fired', err);
            onError(
              typeof err === 'object' && err !== null && 'message' in err
                ? String((err as { message: unknown }).message)
                : 'Error desconocido de PayPal',
            );
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
