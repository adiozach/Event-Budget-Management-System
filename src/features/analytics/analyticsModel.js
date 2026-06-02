import { sumAmounts } from '../../lib/money.js';

// Approved spend grouped by category name, sorted high -> low.
export function expenseByCategory(categories, expenses) {
  const nameById = new Map(categories.map((c) => [c.id, c.name]));
  const approved = expenses.filter((e) => e.approval_status === 'approved');
  const totals = new Map();
  for (const e of approved) {
    const name = e.category_id ? (nameById.get(e.category_id) || 'Uncategorized') : 'Uncategorized';
    totals.set(name, (totals.get(name) || 0) + (Number(e.amount) || 0));
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
}

// Income grouped by source, sorted high -> low.
export function incomeBySource(income) {
  const totals = new Map();
  for (const i of income) {
    totals.set(i.source, (totals.get(i.source) || 0) + (Number(i.amount) || 0));
  }
  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

// Running total of approved spend, one point per date, ascending.
export function cumulativeSpend(expenses) {
  const approved = expenses
    .filter((e) => e.approval_status === 'approved')
    .sort((a, b) => (a.expense_date < b.expense_date ? -1 : a.expense_date > b.expense_date ? 1 : 0));
  const byDate = new Map();
  for (const e of approved) {
    byDate.set(e.expense_date, (byDate.get(e.expense_date) || 0) + (Number(e.amount) || 0));
  }
  let running = 0;
  return [...byDate.entries()].map(([date, amt]) => {
    running += amt;
    return { date, total: running };
  });
}
