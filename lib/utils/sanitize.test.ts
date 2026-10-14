import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeInteger,
  sanitizeFloat,
  sanitizeUrl,
  sanitizeObject,
  escapeHtml,
} from './sanitize';

describe('escapeHtml', () => {
  it('escapes HTML metacharacters and quotes', () => {
    expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Ñuñoa 123')).toBe('Ñuñoa 123');
  });
});

describe('sanitizeString', () => {
  it('trims and strips angle brackets to neutralize tags', () => {
    expect(sanitizeString('  <script>alert(1)</script>  ')).toBe('scriptalert(1)/script');
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizeString(42)).toBe('');
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString({ toString: () => '<b>' })).toBe('');
  });

  it('caps length at 10000 chars', () => {
    expect(sanitizeString('a'.repeat(20000))).toHaveLength(10000);
  });
});

describe('sanitizeEmail', () => {
  it('trims and lowercases a valid email', () => {
    expect(sanitizeEmail('  Foo@Example.COM ')).toBe('foo@example.com');
  });

  it.each([['not-an-email'], ['a@b'], ['a b@c.cl'], ['@c.cl'], ['']])('rejects %j', (input) => {
    expect(sanitizeEmail(input)).toBeNull();
  });

  it('rejects non-strings', () => {
    expect(sanitizeEmail(undefined)).toBeNull();
    expect(sanitizeEmail(['a@b.cl'])).toBeNull();
  });
});

describe('sanitizeInteger', () => {
  it('floors numbers and enforces bounds', () => {
    expect(sanitizeInteger(3.9)).toBe(3);
    expect(sanitizeInteger(3, 1, 5)).toBe(3);
    expect(sanitizeInteger(0, 1)).toBeNull();
    expect(sanitizeInteger(6, undefined, 5)).toBeNull();
  });

  it('parses strings and enforces bounds', () => {
    expect(sanitizeInteger('12abc')).toBe(12);
    expect(sanitizeInteger('abc')).toBeNull();
    expect(sanitizeInteger('0', 1)).toBeNull();
    expect(sanitizeInteger('9', 0, 5)).toBeNull();
    expect(sanitizeInteger('4', 0, 5)).toBe(4);
  });

  it('rejects other types', () => {
    expect(sanitizeInteger(true)).toBeNull();
  });
});

describe('sanitizeFloat', () => {
  it('accepts numbers within bounds', () => {
    expect(sanitizeFloat(1.5, 0, 2)).toBe(1.5);
    expect(sanitizeFloat(-1, 0)).toBeNull();
    expect(sanitizeFloat(3, undefined, 2)).toBeNull();
  });

  it('parses strings and enforces bounds', () => {
    expect(sanitizeFloat('2.25')).toBe(2.25);
    expect(sanitizeFloat('x')).toBeNull();
    expect(sanitizeFloat('-1', 0)).toBeNull();
    expect(sanitizeFloat('5', 0, 2)).toBeNull();
  });

  it('rejects other types', () => {
    expect(sanitizeFloat(null)).toBeNull();
  });
});

describe('sanitizeUrl', () => {
  it('accepts http and https', () => {
    expect(sanitizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it.each([['javascript:alert(1)'], ['data:text/html,<script>'], ['ftp://x.cl'], ['not a url']])(
    'rejects %j',
    (input) => {
      expect(sanitizeUrl(input)).toBeNull();
    }
  );

  it('rejects non-strings', () => {
    expect(sanitizeUrl(1)).toBeNull();
  });
});

describe('sanitizeObject', () => {
  it('applies schema sanitizers, drops null results and unknown keys', () => {
    const input = { name: ' <b>Ana</b> ', email: 'bad', extra: 'x' } as Record<string, unknown>;
    const schema = { name: sanitizeString, email: sanitizeEmail } as Record<string, (v: unknown) => unknown>;
    expect(sanitizeObject(input, schema)).toEqual({ name: 'bAna/b' });
  });

  it('drops undefined results', () => {
    expect(sanitizeObject({ a: 1 }, { a: () => undefined })).toEqual({});
  });
});
