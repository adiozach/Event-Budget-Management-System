import { describe, it, expect } from 'vitest';
import { expenseByCategory, incomeBySource, cumulativeSpend } from '../src/features/analytics/analyticsModel.js';

const categories = [
  { id: 'c1', name: 'Food' },
  { id: 'c2', name: 'Decor' },
];
const expenses = [
  { amount: 300, category_id: 'c1', approval_status: 'approved', expense_date: '2026-08-01' },
  { amount: 100, category_id: 'c1', approval_status: 'pending', expense_date: '2026-08-02' },
  { amount: 250, category_id: 'c2', approval_status: 'approved', expense_date: '2026-08-03' },
  { amount: 50, category_id: null, approval_status: 'approved', expense_date: '2026-08-01' },
];
const income = [
  { amount: 1000, source: 'Ticket Sales' },
  { amount: 200, source: 'Donation' },
  { amount: 300, source: 'Ticket Sales' },
];

describe('expenseByCategory', () => {
  it('sums approved spend per category, names uncategorized, sorts desc', () => {
    expect(expenseByCategory(categories, expenses)).toEqual([
      { name: 'Food', value: 300 },
      { name: 'Decor', value: 250 },
      { name: 'Uncategorized', value: 50 },
    ]);
  });
  it('excludes categories with no approved spend', () => {
    expect(expenseByCategory(categories, [])).toEqual([]);
  });
});

describe('incomeBySource', () => {
  it('groups and sums by source, sorted desc', () => {
    expect(incomeBySource(income)).toEqual([
      { name: 'Ticket Sales', value: 1300 },
      { name: 'Donation', value: 200 },
    ]);
  });
});

describe('cumulativeSpend', () => {
  it('builds running total of approved spend by date ascending', () => {
    expect(cumulativeSpend(expenses)).toEqual([
      { date: '2026-08-01', total: 350 },
      { date: '2026-08-03', total: 600 },
    ]);
  });
});
