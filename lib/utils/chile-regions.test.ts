import { describe, expect, it } from 'vitest';
import {
  CHILE_REGIONS, getAllRegions, getCommunesByRegion, isValidComunaForRegion, isValidRegion,
} from './chile-regions';

const RM = 'Región Metropolitana de Santiago';

describe('chile-regions', () => {
  it('loads the 16 regions with communes', () => {
    expect(CHILE_REGIONS).toHaveLength(16);
    expect(getAllRegions()).toContain(RM);
    expect(CHILE_REGIONS.every((r) => r.communes.length > 0)).toBe(true);
  });

  it('getCommunesByRegion returns communes or [] for unknown region', () => {
    expect(getCommunesByRegion(RM)).toContain('Providencia');
    expect(getCommunesByRegion('Narnia')).toEqual([]);
  });

  it('validates regions and commune membership', () => {
    expect(isValidRegion(RM)).toBe(true);
    expect(isValidRegion('Narnia')).toBe(false);
    expect(isValidComunaForRegion('Providencia', RM)).toBe(true);
    expect(isValidComunaForRegion('Arica', RM)).toBe(false);
    expect(isValidComunaForRegion('Providencia', 'Narnia')).toBe(false);
  });
});
