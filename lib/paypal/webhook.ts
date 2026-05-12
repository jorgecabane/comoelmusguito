/**
 * PayPal webhook signature verification
 * Uses PayPal's postback verification endpoint
 */

import 'server-only'

import type { PayPalWebhookEvent, PayPalWebhookHeaders } from './types'

function getBaseUrl(): string {
  const url = process.env.PAYPAL_BASE_URL
  if (!url) throw new Error('PAYPAL_BASE_URL is not configured')
  return url
}

function getWebhookId(): string {
  const id = process.env.PAYPAL_WEBHOOK_ID
  if (!id) throw new Error('PAYPAL_WEBHOOK_ID is not configured')
  return id
}

/**
 * Get a fresh access token for the verification call.
 * Separate from client.ts to keep the webhook module self-contained.
 */
async function getAccessTokenForVerification(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64'
  )

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`PayPal OAuth failed: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Verify a PayPal webhook signature using PayPal's verification endpoint.
 * Returns true if the webhook is authentic, false otherwise.
 */
export async function verifyPayPalWebhook(
  headers: PayPalWebhookHeaders,
  body: PayPalWebhookEvent
): Promise<boolean> {
  try {
    const accessToken = await getAccessTokenForVerification()

    const verifyPayload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: getWebhookId(),
      webhook_event: body,
    }

    const response = await fetch(
      `${getBaseUrl()}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyPayload),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('PayPal webhook verification request failed:', text)
      return false
    }

    const result = await response.json()
    return result.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('PayPal webhook verification error:', error)
    return false
  }
}
