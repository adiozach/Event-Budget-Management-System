import { describe, it, expect } from 'vitest';
import { sumAmounts, totalPlanned, totalSpent, totalIncome, netBalance } from '../src/lib/money.js';

describe('money math', () => {
  it('sumAmounts adds amounts, ignoring nullish', () => {
    expect(sumAmounts([{ amount: 100 }, { amount: 50.5 }, { amount: null }])).toBe(150.5);
  });
  it('sumAmounts returns 0 for empty list', () => {
    expect(sumAmounts([])).toBe(0);
  });
  it('totalPlanned sums category planned_amount', () => {
    expect(totalPlanned([{ planned_amount: 500 }, { planned_amount: 200 }])).toBe(700);
  });
  it('totalSpent only counts approved expenses', () => {
    const expenses = [
      { amount: 100, approval_status: 'approved' },
      { amount: 999, approval_status: 'pending' },
      { amount: 50, approval_status: 'approved' },
      { amount: 12, approval_status: 'rejected' },
    ];
    expect(totalSpent(expenses)).toBe(150);
  });
  it('totalIncome sums all income', () => {
    expect(totalIncome([{ amount: 1000 }, { amount: 250 }])).toBe(1250);
  });
  it('netBalance = income - approved spend', () => {
    expect(netBalance(1250, 150)).toBe(1100);
  });
});
