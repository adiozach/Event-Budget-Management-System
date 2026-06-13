import { describe, it, expect } from 'vitest';
import { computeOrgSummary } from '../src/features/dashboard/orgSummary.js';

const events = [
  {
    budget_categories: [{ planned_amount: 500 }, { planned_amount: 200 }],
    expenses: [
      { amount: 300, approval_status: 'approved' },
      { amount: 100, approval_status: 'pending' },
    ],
    income: [{ amount: 1000 }],
  },
  {
    budget_categories: [{ planned_amount: 1000 }],
    expenses: [
      { amount: 400, approval_status: 'approved' },
      { amount: 50, approval_status: 'pending' },
    ],
    income: [{ amount: 600 }],
  },
];

describe('computeOrgSummary', () => {
  it('aggregates totals and pending count across events', () => {
    expect(computeOrgSummary(events)).toEqual({
      totalEvents: 2,
      totalPlanned: 1700,   // 700 + 1000
      totalSpent: 700,      // 300 + 400 (approved only)
      totalIncome: 1600,    // 1000 + 600
      netBalance: 900,      // 1600 - 700
      pendingCount: 2,      // one pending in each event
    });
  });

  it('handles an empty org', () => {
    expect(computeOrgSummary([])).toEqual({
      totalEvents: 0, totalPlanned: 0, totalSpent: 0, totalIncome: 0, netBalance: 0, pendingCount: 0,
    });
  });
});
