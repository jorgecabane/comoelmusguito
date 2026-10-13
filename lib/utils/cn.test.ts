import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins conditional classes and lets later Tailwind classes win', () => {
    expect(cn('px-2', false && 'hidden', undefined, { 'font-bold': true }, 'px-4')).toBe('font-bold px-4');
  });
});
