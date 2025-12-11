/**
 * Configuración de información de contacto
 * Centraliza números de teléfono, emails, etc. desde variables de entorno
 */

/**
 * Obtiene el número de teléfono desde variables de entorno
 * Formato esperado: +56966563208 (sin espacios)
 */
export function getPhoneNumber(): string {
  return process.env.NEXT_PUBLIC_PHONE_NUMBER || '+56966563208';
}

/**
 * Obtiene el número de teléfono formateado para mostrar
 * Ejemplo: +56 9 6656 3208
 */
export function getFormattedPhoneNumber(): string {
  const phone = getPhoneNumber();
  // Si ya está formateado, retornarlo
  if (phone.includes(' ')) {
    return phone;
  }
  
  // Formatear: +56966563208 -> +56 9 6656 3208
  // Asumiendo formato chileno: +56 9 XXXX XXXX
  if (phone.startsWith('+56') && phone.length === 12) {
    return `${phone.slice(0, 3)} ${phone.slice(3, 4)} ${phone.slice(4, 8)} ${phone.slice(8)}`;
  }
  
  // Si no coincide con el formato esperado, retornar tal cual
  return phone;
}

/**
 * Obtiene el número de teléfono sin el prefijo + para usar en wa.me
 * Ejemplo: 56966563208
 */
export function getWhatsAppNumber(): string {
  const phone = getPhoneNumber();
  // Remover el + si existe
  return phone.replace(/^\+/, '');
}

/**
 * Obtiene el número de teléfono para usar en links tel:
 * Ejemplo: tel:+56966563208
 */
export function getTelLink(): string {
  return `tel:${getPhoneNumber()}`;
}

/**
 * Obtiene el link de WhatsApp con mensaje predefinido
 */
export function getWhatsAppLink(message?: string): string {
  const number = getWhatsAppNumber();
  const defaultMessage = 'Hola! Quiero más información sobre los terrarios personalizados';
  const encodedMessage = encodeURIComponent(message || defaultMessage);
  return `https://wa.me/${number}?text=${encodedMessage}`;
}

