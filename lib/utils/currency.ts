/**
 * Utilidades de Conversión de Monedas
 * Convierte entre CLP y USD usando API externa
 */

import 'server-only';

// Cache de tasa de cambio (actualizar cada hora)
let exchangeRateCache: {
  rate: number | null;
  timestamp: number;
} = {
  rate: null,
  timestamp: 0,
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hora en milisegundos

/**
 * Obtener tasa de cambio USD → CLP
 * Usa ExchangeRate-API (gratis hasta 1,500 requests/mes)
 * @returns Tasa de cambio (ej: 950 = 1 USD = 950 CLP)
 */
export async function getUSDToCLPRate(): Promise<number> {
  // Verificar cache
  const now = Date.now();
  if (exchangeRateCache.rate && (now - exchangeRateCache.timestamp) < CACHE_DURATION) {
    return exchangeRateCache.rate;
  }

  try {
    // Usar ExchangeRate-API (gratis, no requiere API key para uso básico)
    // Alternativa: exchangerate-api.com
    const response = await fetch(
      'https://api.exchangerate-api.com/v4/latest/USD',
      {
        next: { revalidate: 3600 }, // Cache por 1 hora
      }
    );

    if (!response.ok) {
      throw new Error('Error obteniendo tasa de cambio');
    }

    const data = await response.json();
    const rate = data.rates?.CLP;

    if (!rate || typeof rate !== 'number') {
      throw new Error('Tasa de cambio no válida');
    }

    // Actualizar cache
    exchangeRateCache = {
      rate,
      timestamp: now,
    };

    return rate;
  } catch (error) {
    console.error('Error obteniendo tasa de cambio:', error);
    
    // Fallback: usar tasa aproximada (actualizar manualmente si es necesario)
    const fallbackRate = 950; // Tasa aproximada USD → CLP
    console.warn(`Usando tasa de cambio fallback: ${fallbackRate}`);
    
    return fallbackRate;
  }
}

/**
 * Convertir USD a CLP
 * @param usdAmount Cantidad en USD
 * @returns Cantidad en CLP
 */
export async function convertUSDToCLP(usdAmount: number): Promise<number> {
  const rate = await getUSDToCLPRate();
  return Math.round(usdAmount * rate);
}

/**
 * Convertir CLP a USD
 * @param clpAmount Cantidad en CLP
 * @returns Cantidad en USD (redondeado a 2 decimales)
 */
export async function convertCLPToUSD(clpAmount: number): Promise<number> {
  const rate = await getUSDToCLPRate();
  return Math.round((clpAmount / rate) * 100) / 100;
}

/**
 * Formatear precio según moneda
 * @param amount Cantidad
 * @param currency Moneda ('CLP' | 'USD')
 * @returns Precio formateado (ej: "$50.000 CLP" o "$29 USD")
 */
export function formatPrice(amount: number, currency: 'CLP' | 'USD'): string {
  if (currency === 'CLP') {
    return `$${amount.toLocaleString('es-CL')} CLP`;
  } else {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  }
}

/**
 * Obtener precio en la moneda del usuario
 * Si el producto está en USD y el usuario está en Chile, convierte a CLP
 * Si el producto está en CLP y el usuario está fuera, muestra en CLP (o convierte si es necesario)
 */
export async function getPriceForUser(
  priceCLP: number,
  priceUSD: number | null,
  userCurrency: 'CLP' | 'USD'
): Promise<{ amount: number; currency: 'CLP' | 'USD'; originalCurrency: 'CLP' | 'USD' }> {
  // Si el usuario está en Chile, siempre usar CLP
  if (userCurrency === 'CLP') {
    // Si el producto tiene precio en CLP, usarlo
    if (priceCLP > 0) {
      return { amount: priceCLP, currency: 'CLP', originalCurrency: 'CLP' };
    }
    // Si solo tiene precio en USD, convertir a CLP
    if (priceUSD && priceUSD > 0) {
      const converted = await convertUSDToCLP(priceUSD);
      return { amount: converted, currency: 'CLP', originalCurrency: 'USD' };
    }
  }

  // Si el usuario está fuera de Chile, preferir USD
  if (userCurrency === 'USD') {
    // Si el producto tiene precio en USD, usarlo
    if (priceUSD && priceUSD > 0) {
      return { amount: priceUSD, currency: 'USD', originalCurrency: 'USD' };
    }
    // Si solo tiene precio en CLP, convertir a USD
    if (priceCLP > 0) {
      const converted = await convertCLPToUSD(priceCLP);
      return { amount: converted, currency: 'USD', originalCurrency: 'CLP' };
    }
  }

  // Fallback: usar CLP
  return { amount: priceCLP || 0, currency: 'CLP', originalCurrency: 'CLP' };
}

