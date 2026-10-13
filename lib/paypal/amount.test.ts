import { describe, expect, it } from 'vitest';
import { amountMatchesOrder } from './amount';

const order = { total: 45.5, currency: 'USD' };

describe('amountMatchesOrder', () => {
  it.each([
    [{ currency_code: 'USD', value: '45.50' }, true],
    [{ currency_code: 'USD', value: '45.5' }, true],
    [{ currency_code: 'USD', value: '1.00' }, false],
    [{ currency_code: 'EUR', value: '45.50' }, false],
    [{ currency_code: 'USD' }, false],
    [undefined, false],
  ])('%o → %s', (amount, expected) => {
    expect(amountMatchesOrder(amount, order)).toBe(expected);
  });
});
