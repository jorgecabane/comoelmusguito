/**
 * PayPal REST API type definitions
 */

export interface PayPalAccessToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface PayPalOrderItem {
  name: string
  quantity: string
  unit_amount: {
    currency_code: string
    value: string
  }
}

export interface PayPalApplicationContext {
  return_url?: string
  cancel_url?: string
  brand_name?: string
  locale?: string
  user_action?: 'CONTINUE' | 'PAY_NOW'
  shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS'
  landing_page?: 'LOGIN' | 'GUEST_CHECKOUT' | 'NO_PREFERENCE'
}

export interface PayPalCreateOrderRequest {
  intent: 'CAPTURE'
  purchase_units: Array<{
    reference_id?: string
    description?: string
    amount: {
      currency_code: string
      value: string
      breakdown?: {
        item_total: {
          currency_code: string
          value: string
        }
      }
    }
    items?: PayPalOrderItem[]
  }>
  application_context?: PayPalApplicationContext
}

export interface PayPalOrder {
  id: string
  status:
    | 'CREATED'
    | 'SAVED'
    | 'APPROVED'
    | 'VOIDED'
    | 'COMPLETED'
    | 'PAYER_ACTION_REQUIRED'
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

export interface PayPalCaptureResult {
  id: string
  status:
    | 'COMPLETED'
    | 'DECLINED'
    | 'PARTIALLY_REFUNDED'
    | 'PENDING'
    | 'REFUNDED'
    | 'FAILED'
  purchase_units: Array<{
    reference_id: string
    payments: {
      captures: Array<{
        id: string
        status: string
        amount: {
          currency_code: string
          value: string
        }
        create_time: string
      }>
    }
  }>
}

export interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource_type: string
  resource: Record<string, unknown>
  create_time: string
  summary: string
}

export interface PayPalWebhookHeaders {
  'paypal-auth-algo': string
  'paypal-cert-url': string
  'paypal-transmission-id': string
  'paypal-transmission-sig': string
  'paypal-transmission-time': string
}
