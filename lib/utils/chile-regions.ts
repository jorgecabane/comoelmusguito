/**
 * Utilidades para Regiones y Comunas de Chile
 * Carga desde JSON estático
 */

import chileRegionsData from './chile-regions.json';

export interface Region {
  name: string;
  communes: string[];
}

export const CHILE_REGIONS: Region[] = chileRegionsData as Region[];

/**
 * Obtener comunas de una región
 */
export function getCommunesByRegion(regionName: string): string[] {
  const region = CHILE_REGIONS.find((r) => r.name === regionName);
  return region?.communes || [];
}

/**
 * Obtener todas las regiones como lista simple
 */
export function getAllRegions(): string[] {
  return CHILE_REGIONS.map((r) => r.name);
}

/**
 * Validar si una región existe
 */
export function isValidRegion(regionName: string): boolean {
  return CHILE_REGIONS.some((r) => r.name === regionName);
}

/**
 * Validar si una comuna pertenece a una región
 */
export function isValidComunaForRegion(comuna: string, regionName: string): boolean {
  const communes = getCommunesByRegion(regionName);
  return communes.includes(comuna);
}
