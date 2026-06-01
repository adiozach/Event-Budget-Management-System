import { describe, it, expect } from 'vitest';
import { buildReportModel } from '../src/features/reports/buildReportModel.js';

const event = { name: 'Fiesta 2026', event_date: '2026-08-15', location: 'Lucena City, Quezon' };
const org = { name: 'Church' };
const categories = [
  { id: 'c1', name: 'Food', planned_amount: 500 },
  { id: 'c2', name: 'Decor', planned_amount: 200 },
];
const expenses = [
  { amount: 300, category_id: 'c1', approval_status: 'approved' },
  { amount: 100, category_id: 'c1', approval_status: 'pending', description: 'Extra food' },
  { amount: 250, category_id: 'c2', approval_status: 'approved' },
];
const income = [{ amount: 1000, source: 'Ticket Sales' }];

describe('buildReportModel', () => {
  const model = buildReportModel({ org, event, categories, expenses, income });

  it('includes header fields', () => {
    expect(model.header).toMatchObject({
      organization: 'Church', eventName: 'Fiesta 2026',
      eventDate: '2026-08-15', location: 'Lucena City, Quezon',
    });
  });
  it('builds budget-vs-actual rows', () => {
    expect(model.budgetRows).toEqual([
      { id: 'c1', name: 'Food', planned: 500, spent: 300, difference: 200 },
      { id: 'c2', name: 'Decor', planned: 200, spent: 250, difference: -50 },
    ]);
  });
  it('builds income rows and total', () => {
    expect(model.incomeRows).toEqual([{ source: 'Ticket Sales', amount: 1000 }]);
  });
  it('computes bottom-line totals (approved spend only)', () => {
    expect(model.totals).toEqual({
      totalPlanned: 700, totalSpent: 550, totalIncome: 1000, netBalance: 450,
    });
  });
  it('lists pending expenses', () => {
    expect(model.pending).toEqual([{ amount: 100, description: 'Extra food' }]);
  });
});
