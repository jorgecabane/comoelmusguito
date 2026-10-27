/**
 * Datos que Meta usa para asociar una compra con el anuncio que la originó.
 *
 * Se leen de la petición del comprador al crear el pedido (solo si aceptó las
 * cookies publicitarias) y se guardan en la orden: la compra se confirma después, en el webhook de Flow o PayPal, donde ya
 * no existe el navegador del comprador.
 */

import { CONSENT_COOKIE, consentFromValue } from '@/lib/analytics/consent';

export interface MetaAttribution {
  /** Aceptó las cookies publicitarias al crear el pedido; sin esto no se envía la compra a Meta */
  consent: true;
  /** Cookie `_fbp` (navegador) */
  fbp?: string;
  /** Cookie `_fbc` (clic en un anuncio) */
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
}

/** Valores acotados: vienen del cliente y se guardan en la base de datos */
const MAX_LEN = 512;

const clean = (value: string | undefined | null): string | undefined => {
  const v = value?.trim();
  return v ? v.slice(0, MAX_LEN) : undefined;
};

interface RequestLike {
  headers: { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
}

export function getMetaAttribution(request: RequestLike): MetaAttribution | undefined {
  // Sin consentimiento no se guarda nada del comprador para Meta
  if (consentFromValue(request.cookies.get(CONSENT_COOKIE)?.value) !== 'granted') return undefined;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const attribution: MetaAttribution = {
    consent: true,
    fbp: clean(request.cookies.get('_fbp')?.value),
    fbc: clean(request.cookies.get('_fbc')?.value),
    clientIp: clean(forwardedFor?.split(',')[0]) ?? clean(request.headers.get('x-real-ip')),
    userAgent: clean(request.headers.get('user-agent')),
  };
  return attribution;
}
