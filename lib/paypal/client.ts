/**
 * PayPal REST API client
 * Handles OAuth2 auth, order creation, and payment capture
 */

import 'server-only'

import type {
  PayPalAccessToken,
  PayPalCaptureResult,
  PayPalCreateOrderRequest,
  PayPalOrder,
} from './types'

// In-memory token cache
let cachedToken: string | null = null
let tokenExpiresAt = 0

function getBaseUrl(): string {
  const url = process.env.PAYPAL_BASE_URL
  if (!url) throw new Error('PAYPAL_BASE_URL is not configured')
  return url
}

function getClientId(): string {
  const id = process.env.PAYPAL_CLIENT_ID
  if (!id) throw new Error('PAYPAL_CLIENT_ID is not configured')
  return id
}

function getClientSecret(): string {
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!secret) throw new Error('PAYPAL_CLIENT_SECRET is not configured')
  return secret
}

/**
 * Get an OAuth2 access token, reusing cached token until 5 min before expiry
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken
  }

  const credentials = Buffer.from(
    `${getClientId()}:${getClientSecret()}`
  ).toString('base64')

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('PayPal OAuth error:', text)
    throw new Error(`PayPal OAuth failed: ${response.status}`)
  }

  const data: PayPalAccessToken = await response.json()
  cachedToken = data.access_token
  // Expire 5 minutes early to avoid edge-case rejections
  tokenExpiresAt = now + (data.expires_in - 300) * 1000

  return cachedToken
}

export interface CreateOrderParams {
  orderId: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    currency: string
  }>
  total: number
  currency: string
}

/**
 * Create a PayPal order for checkout
 * Returns the PayPal order (use .id for the paypalOrderId, .links for approval URL)
 */
export async function createPayPalOrder(
  params: CreateOrderParams
): Promise<PayPalOrder> {
  const token = await getAccessToken()

  const items = params.items.map((item) => ({
    name: item.name,
    quantity: String(item.quantity),
    unit_amount: {
      currency_code: item.currency,
      value: item.unitPrice.toFixed(2),
    },
  }))

  const itemTotal = params.items
    .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    .toFixed(2)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const body: PayPalCreateOrderRequest = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.orderId,
        amount: {
          currency_code: params.currency,
          value: params.total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: params.currency,
              value: itemTotal,
            },
          },
        },
        items,
      },
    ],
    application_context: {
      brand_name: 'comoelmusguito',
      locale: 'es-CL',
      user_action: 'PAY_NOW',
      // Cursos / regalos digitales — PayPal no necesita dirección de envío.
      // Sin esto el sandbox aborta el popup si la cuenta buyer no tiene address.
      shipping_preference: 'NO_SHIPPING',
      landing_page: 'NO_PREFERENCE',
      return_url: `${baseUrl}/api/checkout/callback?order=${params.orderId}`,
      cancel_url: `${baseUrl}/checkout?cancelled=${params.orderId}`,
    },
  }

  const response = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error('PayPal create order error:', text)
    throw new Error(`PayPal create order failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Capture payment after buyer approves the PayPal order
 */
export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<PayPalCaptureResult> {
  const token = await getAccessToken()

  const response = await fetch(
    `${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.error('PayPal capture error:', text)
    throw new Error(`PayPal capture failed: ${response.status}`)
  }

  return response.json()
}
