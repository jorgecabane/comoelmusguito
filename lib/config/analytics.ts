/**
 * Configuración de analítica de marketing.
 *
 * El Pixel de Meta solo se activa en el sitio de producción (comoelmusguito.cl).
 * Así el sitio de desarrollo, las vistas previas de los PR y los E2E no suman
 * visitas falsas al Pixel real. El dominio sale de NEXT_PUBLIC_SITE_URL, que
 * cada entorno define distinto.
 */

/** ID público del Pixel de Meta (Administrador de eventos > Fuentes de datos) */
const DEFAULT_META_PIXEL_ID = '1790926392239173';

const PRODUCTION_HOSTS = ['comoelmusguito.cl', 'www.comoelmusguito.cl'];

function hostOf(siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(siteUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Devuelve el ID del Pixel si corresponde cargarlo en este entorno, o null.
 * NEXT_PUBLIC_META_PIXEL_ID permite cambiar el ID sin tocar el código
 * (vacío = desactivar).
 */
export function getMetaPixelId(
  siteUrl: string | undefined = process.env.NEXT_PUBLIC_SITE_URL,
  override: string | undefined = process.env.NEXT_PUBLIC_META_PIXEL_ID,
): string | null {
  const host = hostOf(siteUrl);
  if (!host || !PRODUCTION_HOSTS.includes(host)) return null;
  const id = (override ?? DEFAULT_META_PIXEL_ID).trim();
  return id || null;
}
