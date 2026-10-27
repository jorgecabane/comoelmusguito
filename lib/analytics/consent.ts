/**
 * Consentimiento para cookies publicitarias (Pixel de Meta y API de conversiones).
 *
 * La elección se guarda en la cookie `cem_consent`:
 *   ads  = aceptó    |    none = rechazó    |    (sin cookie) = aún no decide
 *
 * Es una cookie técnica propia: solo recuerda la elección, no identifica a nadie.
 * Se lee en el navegador (para cargar o no el Pixel) y en el servidor (al crear un
 * pedido: sin consentimiento no se guardan los datos de atribución ni se envía la compra).
 */

export const CONSENT_COOKIE = 'cem_consent';
const GRANTED_VALUE = 'ads';
const DENIED_VALUE = 'none';
/** Se vuelve a preguntar pasado este tiempo */
export const CONSENT_MAX_AGE_DAYS = 180;

export type AdsConsent = 'granted' | 'denied' | 'unset';

/** Interpreta el valor de la cookie de consentimiento */
export function consentFromValue(value: string | undefined | null): AdsConsent {
  if (value === GRANTED_VALUE) return 'granted';
  if (value === DENIED_VALUE) return 'denied';
  return 'unset';
}

/** Lee el consentimiento de una cabecera `Cookie` / `document.cookie` */
export function parseAdsConsent(cookieString: string | undefined | null): AdsConsent {
  if (!cookieString) return 'unset';
  for (const part of cookieString.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CONSENT_COOKIE) return consentFromValue(rest.join('='));
  }
  return 'unset';
}

/** Texto para asignar a `document.cookie` y guardar la elección */
export function consentCookieString(granted: boolean, secure: boolean): string {
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  return `${CONSENT_COOKIE}=${granted ? GRANTED_VALUE : DENIED_VALUE}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** Cookies que instala el Pixel de Meta; se borran al retirar el consentimiento */
export const META_COOKIES = ['_fbp', '_fbc'] as const;
