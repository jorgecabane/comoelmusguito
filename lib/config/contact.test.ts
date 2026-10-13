import { describe, expect, it, vi } from 'vitest';
import {
  getFormattedPhoneNumber, getPhoneNumber, getTelLink, getWhatsAppLink, getWhatsAppNumber,
} from './contact';

const phone = (v: string) => vi.stubEnv('NEXT_PUBLIC_PHONE_NUMBER', v);

describe('contact config', () => {
  it('uses the default phone when env is unset or empty', () => {
    phone('');
    expect(getPhoneNumber()).toBe('+56966563208');
    expect(getTelLink()).toBe('tel:+56966563208');
    expect(getWhatsAppNumber()).toBe('56966563208');
  });

  it('formats a Chilean mobile as +56 9 XXXX XXXX', () => {
    phone('+56912345678');
    expect(getFormattedPhoneNumber()).toBe('+56 9 1234 5678');
  });

  it('keeps already-formatted or non-Chilean numbers as-is', () => {
    phone('+56 9 1234 5678');
    expect(getFormattedPhoneNumber()).toBe('+56 9 1234 5678');
    phone('+14155550100');
    expect(getFormattedPhoneNumber()).toBe('+14155550100');
    phone('+5622345678');
    expect(getFormattedPhoneNumber()).toBe('+5622345678');
  });

  it('builds wa.me links with an encoded message', () => {
    phone('+56912345678');
    expect(getWhatsAppLink('¿Hola & chao?')).toBe(
      'https://wa.me/56912345678?text=%C2%BFHola%20%26%20chao%3F',
    );
    expect(getWhatsAppLink()).toBe(
      `https://wa.me/56912345678?text=${encodeURIComponent('Hola! Quiero más información sobre los terrarios personalizados')}`,
    );
  });
});
