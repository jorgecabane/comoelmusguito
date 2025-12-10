/**
 * Instagram Token Management
 * Funciones para manejar y refrescar tokens de Instagram
 */

const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;

interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number; // Segundos hasta expiración
}

/**
 * Refrescar un token de Instagram (long-lived token)
 * 
 * @param currentToken - El token actual que queremos refrescar
 * @returns Nuevo token y tiempo de expiración, o null si falla
 */
export async function refreshInstagramToken(
  currentToken: string
): Promise<{ token: string; expiresIn: number } | null> {
  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`;
    
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error al refrescar token de Instagram:', error);
      return null;
    }

    const data: RefreshTokenResponse = await response.json();
    
    return {
      token: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error en refreshInstagramToken:', error);
    return null;
  }
}

/**
 * Verificar si un error de Instagram indica token expirado
 */
export function isTokenExpiredError(error: any): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorCode = error.error?.code;
  const errorType = error.error?.type;
  const errorMessage = error.error?.message || '';
  
  return (
    errorCode === 190 || // Invalid OAuth 2.0 Access Token
    errorType === 'OAuthException' ||
    errorMessage.includes('expired') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('Token')
  );
}

