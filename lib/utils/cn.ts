/**
 * Utilidad para combinar classNames de Tailwind de forma inteligente
 * Combina clsx con tailwind-merge para resolver conflictos
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

