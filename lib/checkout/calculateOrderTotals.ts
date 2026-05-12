/**
 * Validación de items de carrito + cálculo de totales para checkout.
 * Compartido por POST /api/checkout (que persiste) y POST /api/checkout/quote (stateless).
 */

import 'server-only';

import { getTerrariumById, getCourseById, getWorkshopById, getSupplyById } from '@/lib/sanity/fetch';
import { checkTerrariumStock, checkWorkshopSpots, checkSupplyStock } from '@/lib/sanity/inventory';
import { getCoursePrice } from '@/lib/sanity/utils';
import { convertCLPToUSD, convertUSDToCLP } from '@/lib/utils/currency';
import type { CartItem } from '@/types/cart';

const PRICE_TOLERANCE = 1;

export class CheckoutValidationError extends Error {
  status: number;
  /** Error attributable to a specific item (stock, dates, availability). */
  availabilityIssue?: boolean;
  /** Kept for backwards-compat with frontends; subset of availabilityIssue. */
  outOfStock?: boolean;
  itemId?: string;
  itemType?: string;
  itemName?: string;

  constructor(
    status: number,
    message: string,
    extra?: {
      availabilityIssue?: boolean;
      outOfStock?: boolean;
      itemId?: string;
      itemType?: string;
      itemName?: string;
    },
  ) {
    super(message);
    this.status = status;
    this.availabilityIssue = extra?.availabilityIssue ?? extra?.outOfStock;
    this.outOfStock = extra?.outOfStock;
    this.itemId = extra?.itemId;
    this.itemType = extra?.itemType;
    this.itemName = extra?.itemName;
  }
}

interface CalculateOrderTotalsParams {
  items: CartItem[];
  gateway: 'flow' | 'paypal';
  isGift: boolean;
  userCurrency: 'CLP' | 'USD';
  /** Skip product `published`/`inStock` flags + stock/spots checks. Used by /quote. */
  skipAvailabilityChecks?: boolean;
}

interface CalculateOrderTotalsResult {
  validatedItems: CartItem[];
  total: number;
  currency: 'CLP' | 'USD';
}

export async function calculateOrderTotals(
  params: CalculateOrderTotalsParams,
): Promise<CalculateOrderTotalsResult> {
  const { items, gateway, isGift, userCurrency, skipAvailabilityChecks = false } = params;

  const validatedItems: CartItem[] = [];

  for (const item of items) {
    const { validatedPrice, validatedCurrency } = await validateItem(item, userCurrency, skipAvailabilityChecks);

    // Price tolerance es un anti-tampering para órdenes reales. El quote sólo calcula
    // el total con precios del servidor, así que no importa lo que mande el cliente.
    if (!skipAvailabilityChecks) {
      const priceDiff = Math.abs(item.price - validatedPrice);
      if (priceDiff > PRICE_TOLERANCE) {
        console.error('Intento de manipulación de precio detectado:', {
          itemId: item.id,
          itemName: item.name,
          precioCliente: item.price,
          precioReal: validatedPrice,
          diferencia: priceDiff,
        });
        throw new CheckoutValidationError(400, `Precio inválido para "${item.name}". Por favor, recarga la página.`);
      }
    }

    validatedItems.push({ ...item, price: validatedPrice, currency: validatedCurrency });
  }

  if (gateway === 'paypal') {
    const hasPhysicalItems = validatedItems.some((it) => it.type !== 'course');
    if (hasPhysicalItems && !isGift) {
      throw new CheckoutValidationError(
        400,
        'PayPal solo está disponible para cursos online. Los productos físicos requieren Flow.',
      );
    }

    // PayPal no soporta CLP. Convertir cada item a USD antes de totalizar
    // para que item_total y amount.value coincidan al construir la orden.
    for (const it of validatedItems) {
      if (it.currency === 'CLP') {
        it.price = await convertCLPToUSD(it.price);
        it.currency = 'USD';
      }
    }
  }

  const totalsByCurrency: Record<string, number> = {};
  for (const it of validatedItems) {
    totalsByCurrency[it.currency] = (totalsByCurrency[it.currency] ?? 0) + it.price * it.quantity;
  }

  let total = 0;
  let currency: 'CLP' | 'USD' = 'CLP';

  if (gateway === 'paypal') {
    total = totalsByCurrency['USD'] ?? 0;
    currency = 'USD';
  } else {
    total = totalsByCurrency['CLP'] ?? 0;
    if (totalsByCurrency['USD']) {
      total += await convertUSDToCLP(totalsByCurrency['USD']);
    }
    currency = 'CLP';
  }

  if (total <= 0) {
    throw new CheckoutValidationError(400, 'Monto inválido');
  }

  return { validatedItems, total, currency };
}

async function validateItem(
  item: CartItem,
  userCurrency: 'CLP' | 'USD',
  skipAvailabilityChecks: boolean,
): Promise<{ validatedPrice: number; validatedCurrency: 'CLP' | 'USD' }> {
  const tag = { availabilityIssue: true, itemId: item.id, itemType: item.type, itemName: item.name };

  if (item.type === 'terrarium') {
    const product = await getTerrariumById(item.id);
    if (!product) throw new CheckoutValidationError(400, `Producto "${item.name}" no encontrado`, tag);
    if (!skipAvailabilityChecks) {
      if (!product.inStock) throw new CheckoutValidationError(400, `Producto "${item.name}" no está disponible`, tag);
      const stockCheck = await checkTerrariumStock(item.id, item.quantity);
      if (!stockCheck.available) {
        throw new CheckoutValidationError(
          400,
          `Lo sentimos, "${item.name}" ya no está disponible. Solo quedan ${stockCheck.currentStock} unidades.`,
          { ...tag, outOfStock: true },
        );
      }
    }
    return { validatedPrice: product.price, validatedCurrency: product.currency };
  }

  if (item.type === 'course') {
    const product = await getCourseById(item.id);
    if (!product) throw new CheckoutValidationError(400, `Curso "${item.name}" no encontrado`, tag);
    if (!skipAvailabilityChecks && !product.published) {
      throw new CheckoutValidationError(400, `Curso "${item.name}" no está disponible`, tag);
    }
    const pricing = getCoursePrice(product, userCurrency);
    return { validatedPrice: pricing.salePrice || pricing.price, validatedCurrency: pricing.currency };
  }

  if (item.type === 'workshop') {
    const product = await getWorkshopById(item.id);
    if (!product) throw new CheckoutValidationError(400, `Taller "${item.name}" no encontrado`, tag);
    if (!skipAvailabilityChecks && !product.published) {
      throw new CheckoutValidationError(400, `Taller "${item.name}" no está disponible`, tag);
    }

    if (!item.selectedDate) {
      throw new CheckoutValidationError(400, `Debes seleccionar una fecha para el taller "${item.name}"`, tag);
    }

    if (!skipAvailabilityChecks) {
      const dateObj = product.dates?.find(
        (d) => new Date(d.date).toISOString() === new Date(item.selectedDate!.date).toISOString(),
      );
      if (!dateObj) {
        throw new CheckoutValidationError(400, `La fecha seleccionada no es válida para el taller "${item.name}"`, tag);
      }
      if (dateObj.status === 'cancelled') {
        throw new CheckoutValidationError(400, `La fecha seleccionada está cancelada para el taller "${item.name}"`, tag);
      }
      if (new Date(dateObj.date) <= new Date()) {
        throw new CheckoutValidationError(400, `La fecha seleccionada ya pasó para el taller "${item.name}"`, tag);
      }
      const spotsCheck = await checkWorkshopSpots(item.id, item.selectedDate.date, item.quantity);
      if (!spotsCheck.available) {
        const plural = spotsCheck.currentSpots === 1 ? '' : 'n';
        const noun = spotsCheck.currentSpots === 1 ? 'cupo' : 'cupos';
        throw new CheckoutValidationError(
          400,
          `Lo sentimos, no hay suficientes cupos disponibles para "${item.name}" en la fecha seleccionada. Solo queda${plural} ${spotsCheck.currentSpots} ${noun}.`,
          { ...tag, outOfStock: true },
        );
      }
    }

    return { validatedPrice: product.price, validatedCurrency: product.currency };
  }

  if (item.type === 'supply') {
    const product = await getSupplyById(item.id);
    if (!product) throw new CheckoutValidationError(400, `Insumo "${item.name}" no encontrado`, tag);
    if (!skipAvailabilityChecks) {
      if (!product.inStock) throw new CheckoutValidationError(400, `Insumo "${item.name}" no está disponible`, tag);
      const stockCheck = await checkSupplyStock(item.id, item.quantity);
      if (!stockCheck.available) {
        throw new CheckoutValidationError(
          400,
          `Lo sentimos, "${item.name}" ya no está disponible. Solo quedan ${stockCheck.currentStock} unidades.`,
          { ...tag, outOfStock: true },
        );
      }
    }
    return { validatedPrice: product.price, validatedCurrency: product.currency };
  }

  throw new CheckoutValidationError(400, `Tipo de producto inválido: ${(item as { type: string }).type}`);
}
