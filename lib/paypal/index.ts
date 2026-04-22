/**
 * PayPal Integration
 * REST API client for order creation, capture, and webhook verification
 */

export { createPayPalOrder, capturePayPalOrder } from './client'
export type { CreateOrderParams } from './client'
export { verifyPayPalWebhook } from './webhook'
export * from './types'
