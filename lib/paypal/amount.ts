/**
 * Verifies a PayPal amount matches an order, using the same 2-decimal
 * formatting createPayPalOrder sends (so "45.5" and "45.50" are equal).
 */
export function amountMatchesOrder(
  amount: { currency_code?: string; value?: string } | undefined,
  order: { total: number; currency: string }
): boolean {
  if (!amount?.value) return false
  return (
    amount.currency_code === order.currency &&
    Number(amount.value).toFixed(2) === order.total.toFixed(2)
  )
}
