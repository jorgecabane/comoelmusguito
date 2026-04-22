'use client';

import { cn } from '@/lib/utils/cn';

interface PaymentMethodSelectorProps {
  selectedGateway: 'flow' | 'paypal';
  onGatewayChange: (gateway: 'flow' | 'paypal') => void;
  flowAmount: string;
  flowCurrency: string;
  paypalAmount: string;
  paypalCurrency: string;
  disabled?: boolean;
}

const METHODS = {
  flow: {
    label: 'Tarjeta o transferencia',
    description: 'Debito, credito, Cuenta RUT, transferencia',
    badge: { text: 'Flow', bg: 'bg-[#1a237e]', fg: 'text-white' },
    switchTo: 'Tienes una tarjeta internacional? Pagar con PayPal',
    switchBack: 'Volver a pagar con Flow',
  },
  paypal: {
    label: 'PayPal',
    description: 'Paga con tu cuenta PayPal o tarjeta internacional',
    badge: { text: 'PP', bg: 'bg-[#003087]', fg: 'text-[#FFC439]' },
    switchTo: 'Prefieres pagar en pesos chilenos? Pagar con Flow',
    switchBack: 'Volver a pagar con PayPal',
  },
} as const;

function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200',
        selected ? 'border-musgo' : 'border-gray',
      )}
      aria-hidden="true"
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-musgo" />}
    </span>
  );
}

function MethodBadge({ text, bg, fg }: { text: string; bg: string; fg: string }) {
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold', bg, fg)}>
      {text}
    </span>
  );
}

export function PaymentMethodSelector({
  selectedGateway,
  onGatewayChange,
  flowAmount,
  flowCurrency,
  paypalAmount,
  paypalCurrency,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const otherGateway = selectedGateway === 'flow' ? 'paypal' : 'flow';
  const current = METHODS[selectedGateway];
  const other = METHODS[otherGateway];
  const amount = selectedGateway === 'flow' ? flowAmount : paypalAmount;
  const currency = selectedGateway === 'flow' ? flowCurrency : paypalCurrency;

  return (
    <div role="radiogroup" aria-label="Metodo de pago">
      {/* Selected method card */}
      <div
        role="radio"
        aria-checked="true"
        tabIndex={0}
        className={cn(
          'rounded-xl border-2 border-musgo p-4 shadow-[0_0_0_1px_theme(colors.musgo)] transition-all duration-200',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <div className="flex items-start gap-3">
          <RadioCircle selected />
          <div className="flex flex-1 items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MethodBadge {...current.badge} />
                <span className="font-medium text-forest">{current.label}</span>
              </div>
              <p className="text-sm text-gray">{current.description}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-musgo">{amount}</p>
              <p className="text-xs text-gray">{currency}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed other method (hidden) */}
      <div
        role="radio"
        aria-checked="false"
        className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 ease-out"
      />

      {/* Switch link */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onGatewayChange(otherGateway)}
        className="mt-3 text-sm text-tierra transition-colors hover:text-tierra-light hover:underline disabled:opacity-50"
      >
        {selectedGateway === 'flow'
          ? 'Tienes una tarjeta internacional? Pagar con PayPal'
          : 'Prefieres pagar en pesos chilenos? Pagar con Flow'}
        {' \u2192'}
      </button>
    </div>
  );
}
