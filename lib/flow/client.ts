/**
 * Cliente para Flow.cl API
 * Maneja creación de órdenes de pago y consulta de estado
 */

import 'server-only';
import crypto from 'crypto';

const FLOW_API_BASE = process.env.FLOW_ENV === 'production'
  ? 'https://www.flow.cl/api'
  : 'https://sandbox.flow.cl/api';

// Leer variables de entorno en runtime (no en tiempo de módulo)
function getFlowApiKey(): string {
  const key = process.env.FLOW_API_KEY;
  if (!key) {
    throw new Error('FLOW_API_KEY no está configurada en .env.local');
  }
  return key;
}

function getFlowSecretKey(): string {
  const key = process.env.FLOW_SECRET_KEY;
  if (!key) {
    throw new Error('FLOW_SECRET_KEY no está configurada en .env.local');
  }
  return key;
}

export interface FlowPaymentItem {
  name: string;
  amount: number;
  quantity: number;
}

export interface CreatePaymentOrderParams {
  commerceOrder: string; // ID único de la orden (ej: "ORD-12345")
  subject: string; // Descripción del pago
  currency: 'CLP' | 'USD';
  amount: number; // Monto total
  email: string; // Email del cliente
  urlConfirmation?: string; // URL de confirmación (webhook)
  urlReturn: string; // URL de retorno después del pago
  paymentMethod?: number; // Método de pago (opcional, 1=Webpay, 9=Todos)
  items?: FlowPaymentItem[]; // Items del pedido (opcional)
}

export interface FlowPaymentResponse {
  token?: string; // Token de la orden (para consultar estado)
  url?: string; // URL a la que redirigir al usuario
  flowOrder?: string; // Número de orden Flow
  status?: number; // Estado del pago
  message?: string; // Mensaje de error o confirmación
}

export interface PaymentStatusResponse {
  status: number; // 1=Pendiente, 2=Pagado, 3=Rechazado, 4=Anulado
  amount: number;
  currency: string;
  commerceOrder: string;
  flowOrder: string;
  paymentDate?: string;
  payer?: string;
  paymentData?: {
    cardNumber?: string;
    cardType?: string;
  };
}

/**
 * Crear orden de pago en Flow
 * Retorna la URL a la que redirigir al usuario
 */
export async function createPaymentOrder(
  params: CreatePaymentOrderParams
): Promise<FlowPaymentResponse> {
  // Leer variables de entorno en runtime
  const FLOW_API_KEY = getFlowApiKey();
  const FLOW_SECRET_KEY = getFlowSecretKey();

  const requestParams: Record<string, string | number> = {
    apiKey: FLOW_API_KEY,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: params.currency,
    amount: params.amount,
    email: params.email,
    urlReturn: params.urlReturn,
  };

  // Agregar parámetros opcionales
  if (params.urlConfirmation) {
    requestParams.urlConfirmation = params.urlConfirmation;
  }
  if (params.paymentMethod) {
    requestParams.paymentMethod = params.paymentMethod;
  }

  // IMPORTANTE: Según la documentación de Flow, la firma se calcula con valores SIN codificar
  // Ordenar parámetros alfabéticamente (excepto 's')
  const sortedParams = Object.entries(requestParams)
    .filter(([key]) => key !== 's')
    .sort(([a], [b]) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  
  // Construir string para firma con valores SIN codificar
  const signatureString = sortedParams
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  
  // Calcular firma con HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', FLOW_SECRET_KEY)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  // Agregar firma al request
  requestParams.s = signature;
  
  // Construir body final (URLSearchParams codificará automáticamente los valores al enviar)
  const formData = new URLSearchParams();
  Object.entries(requestParams).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  const requestBody = formData.toString();

  // Debug: Log del request completo
  console.log('Flow API Request:', {
    url: `${FLOW_API_BASE}/payment/create`,
    apiKey: FLOW_API_KEY,
    apiKeyLength: FLOW_API_KEY.length,
    secretKeyLength: FLOW_SECRET_KEY.length,
    signature: signature.substring(0, 20) + '...',
    requestBody,
    params: Object.keys(requestParams),
  });

  try {
    const response = await fetch(`${FLOW_API_BASE}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    const data = await response.json();

    // Debug: Log de la respuesta
    console.log('Flow API Response:', {
      status: response.status,
      data,
    });

    if (!response.ok || data.status === 0) {
      throw new Error(data.message || 'Error al crear orden de pago en Flow');
    }

    return {
      token: data.token,
      url: data.url,
      flowOrder: data.flowOrder,
      status: data.status,
    };
  } catch (error) {
    console.error('Error creando orden de pago en Flow:', error);
    throw error;
  }
}

/**
 * Consultar estado de un pago usando el token
 */
export async function getPaymentStatus(
  token: string
): Promise<PaymentStatusResponse> {
  const FLOW_API_KEY = getFlowApiKey();
  const FLOW_SECRET_KEY = getFlowSecretKey();

  const requestParams: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    token,
  };

  // Calcular firma con valores SIN codificar
  const sortedParams = Object.entries(requestParams)
    .filter(([key]) => key !== 's')
    .sort(([a], [b]) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  
  const signatureString = sortedParams
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', FLOW_SECRET_KEY)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  requestParams.s = signature;

  // Convertir a query string
  const queryString = new URLSearchParams(requestParams).toString();

  try {
    const response = await fetch(
      `${FLOW_API_BASE}/payment/getStatus?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.status === 0) {
      throw new Error(data.message || 'Error al consultar estado del pago');
    }

    return {
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      commerceOrder: data.commerceOrder,
      flowOrder: data.flowOrder,
      paymentDate: data.paymentDate,
      payer: data.payer,
      paymentData: data.paymentData,
    };
  } catch (error) {
    console.error('Error consultando estado de pago en Flow:', error);
    throw error;
  }
}

/**
 * Consultar estado de un pago usando el commerceOrder
 */
export async function getPaymentStatusByOrder(
  commerceOrder: string
): Promise<PaymentStatusResponse> {
  const FLOW_API_KEY = getFlowApiKey();
  const FLOW_SECRET_KEY = getFlowSecretKey();

  const requestParams: Record<string, string> = {
    apiKey: FLOW_API_KEY,
    commerceOrder,
  };

  // Calcular firma con valores SIN codificar
  const sortedParams = Object.entries(requestParams)
    .filter(([key]) => key !== 's')
    .sort(([a], [b]) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
  
  const signatureString = sortedParams
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');
  
  const signature = crypto
    .createHmac('sha256', FLOW_SECRET_KEY)
    .update(signatureString, 'utf8')
    .digest('hex');
  
  requestParams.s = signature;

  // Convertir a query string
  const queryString = new URLSearchParams(requestParams).toString();

  try {
    const response = await fetch(
      `${FLOW_API_BASE}/payment/getStatusByCommerceId?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.status === 0) {
      throw new Error(data.message || 'Error al consultar estado del pago');
    }

    return {
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      commerceOrder: data.commerceOrder,
      flowOrder: data.flowOrder,
      paymentDate: data.paymentDate,
      payer: data.payer,
      paymentData: data.paymentData,
    };
  } catch (error) {
    console.error('Error consultando estado de pago en Flow:', error);
    throw error;
  }
}

