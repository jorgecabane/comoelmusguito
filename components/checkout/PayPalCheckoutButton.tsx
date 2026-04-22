'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface PayPalCheckoutButtonProps {
  orderId: string;
  total: number;
  currency: string;
  onProcessing: () => void;
  onSuccess: () => void;
  onCancel: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function PayPalCheckoutButton({
  orderId,
  total,
  currency,
  onProcessing,
  onSuccess,
  onCancel: onCancelCallback,
  onError,
  disabled = false,
}: PayPalCheckoutButtonProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '';

  async function createOrder(): Promise<string> {
    onProcessing();
    const res = await fetch('/api/checkout/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    if (!res.ok) {
      const msg = 'Error al crear la orden de PayPal';
      onError(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    return data.paypalOrderId;
  }

  async function handleApprove(data: { orderID: string }) {
    const res = await fetch('/api/checkout/paypal/capture-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paypalOrderId: data.orderID }),
    });

    if (!res.ok) {
      onError('Error al capturar el pago');
      return;
    }

    onSuccess();
  }

  async function handleCancel() {
    await fetch('/api/checkout/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    }).catch(() => {});
    onCancelCallback();
  }

  return (
    <div className={cn('min-h-[45px]', disabled && 'pointer-events-none opacity-50')}>
      {!sdkReady && (
        <div className="flex h-[45px] items-center justify-center">
          <div className="h-4 w-32 animate-pulse rounded bg-gray/20" />
        </div>
      )}

      <PayPalScriptProvider
        options={{
          clientId,
          currency,
          intent: 'capture',
        }}
      >
        <PayPalButtons
          style={{ layout: 'horizontal', tagline: false }}
          disabled={disabled}
          onInit={() => setSdkReady(true)}
          createOrder={createOrder}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onError={(err) => onError(typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Error desconocido de PayPal')}
        />
      </PayPalScriptProvider>
    </div>
  );
}
