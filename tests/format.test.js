import { describe, it, expect } from 'vitest';
import { formatPeso } from '../src/lib/format.js';

describe('formatPeso', () => {
  it('formats whole numbers with peso sign and 2 decimals', () => {
    expect(formatPeso(1234)).toBe('₱1,234.00');
  });
  it('formats decimals and thousands separators', () => {
    expect(formatPeso(1234.5)).toBe('₱1,234.50');
  });
  it('formats zero', () => {
    expect(formatPeso(0)).toBe('₱0.00');
  });
  it('formats negatives with sign before the peso', () => {
    expect(formatPeso(-50)).toBe('-₱50.00');
  });
});
