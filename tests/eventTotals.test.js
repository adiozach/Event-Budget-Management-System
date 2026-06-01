import { describe, it, expect } from 'vitest';
import { computeEventTotals, budgetVsActual } from '../src/features/events/eventTotals.js';

const categories = [
  { id: 'c1', name: 'Food', planned_amount: 500 },
  { id: 'c2', name: 'Decor', planned_amount: 200 },
];
const expenses = [
  { amount: 300, category_id: 'c1', approval_status: 'approved' },
  { amount: 100, category_id: 'c1', approval_status: 'pending' },
  { amount: 250, category_id: 'c2', approval_status: 'approved' },
];
const income = [{ amount: 1000 }, { amount: 200 }];

describe('computeEventTotals', () => {
  it('computes planned, spent (approved), income, balance', () => {
    expect(computeEventTotals({ categories, expenses, income })).toEqual({
      totalPlanned: 700,
      totalSpent: 550,
      totalIncome: 1200,
      netBalance: 650,
    });
  });
});

describe('budgetVsActual', () => {
  it('produces per-category planned/spent/difference using approved spend', () => {
    expect(budgetVsActual(categories, expenses)).toEqual([
      { id: 'c1', name: 'Food', planned: 500, spent: 300, difference: 200 },
      { id: 'c2', name: 'Decor', planned: 200, spent: 250, difference: -50 },
    ]);
  });
});
