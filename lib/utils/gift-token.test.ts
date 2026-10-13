import { describe, expect, it } from 'vitest';
import { generateGiftToken, isValidGiftToken } from './gift-token';

describe('gift-token', () => {
  it('generates valid, unique tokens', () => {
    const a = generateGiftToken();
    expect(a).toMatch(/^GIFT-[A-Z0-9]+-[A-F0-9]{16}$/);
    expect(isValidGiftToken(a)).toBe(true);
    expect(generateGiftToken()).not.toBe(a);
  });

  it.each([
    '',
    'GIFT-ABC-0123456789abcdef', // hex en minúscula
    'GIFT-ABC-0123456789ABCDE', // 15 hex
    'GIFT--0123456789ABCDEF',
    'gift-ABC-0123456789ABCDEF',
    ' GIFT-ABC-0123456789ABCDEF',
    'GIFT-ABC-0123456789ABCDEF-extra',
  ])('rejects malformed token %j', (t) => {
    expect(isValidGiftToken(t)).toBe(false);
  });
});
