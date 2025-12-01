/**
 * Utilidades para Flow.cl API
 * Firma de requests y validación
 */

import crypto from 'crypto';

/**
 * Firmar parámetros con SecretKey según documentación de Flow
 * 1. Ordenar parámetros alfabéticamente (excepto 's')
 * 2. Concatenar: nombre=valor&nombre2=valor2
 * 3. Firmar con SHA256 usando SecretKey
 */
export function signFlowRequest(
  params: Record<string, string | number>,
  secretKey: string
): string {
  // Filtrar y ordenar parámetros (excluir 's' que es la firma)
  const sortedParams = Object.entries(params)
    .filter(([key]) => key !== 's')
    .sort(([a], [b]) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

  // Concatenar: nombre=valor&nombre2=valor2
  // IMPORTANTE: 
  // - Convertir todos los valores a string
  // - NO codificar URLs (Flow espera los valores tal cual)
  // - Usar el valor exacto como está en el objeto
  const concatenated = sortedParams
    .map(([key, value]) => {
      const stringValue = String(value);
      return `${key}=${stringValue}`;
    })
    .join('&');

  // Debug: Log de la firma (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('Flow Signature Debug:', {
      sortedParams: sortedParams.map(([k, v]) => `${k}=${String(v)}`),
      concatenated,
      secretKeyLength: secretKey.length,
      secretKeyPreview: secretKey.substring(0, 10) + '...',
      signatureInputLength: (concatenated + secretKey).length,
      signatureInputPreview: (concatenated + secretKey).substring(0, 100) + '...',
    });
  }

  // Firmar con SHA256
  // IMPORTANTE: El secretKey se concatena directamente, sin encoding
  const signature = crypto
    .createHash('sha256')
    .update(concatenated + secretKey, 'utf8')
    .digest('hex');

  return signature;
}

/**
 * Validar firma de respuesta de Flow
 */
export function verifyFlowSignature(
  params: Record<string, string | number>,
  secretKey: string,
  receivedSignature: string
): boolean {
  const calculatedSignature = signFlowRequest(params, secretKey);
  return calculatedSignature === receivedSignature;
}

