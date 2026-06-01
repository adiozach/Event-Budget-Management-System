import { totalPlanned, totalSpent, totalIncome, netBalance, sumAmounts } from '../../lib/money.js';

export function computeEventTotals({ categories, expenses, income }) {
  const planned = totalPlanned(categories);
  const spent = totalSpent(expenses);
  const incomeTotal = totalIncome(income);
  return {
    totalPlanned: planned,
    totalSpent: spent,
    totalIncome: incomeTotal,
    netBalance: netBalance(incomeTotal, spent),
  };
}

export function budgetVsActual(categories, expenses) {
  return categories.map((cat) => {
    const approvedForCat = expenses.filter(
      (e) => e.category_id === cat.id && e.approval_status === 'approved'
    );
    const spent = sumAmounts(approvedForCat);
    return {
      id: cat.id,
      name: cat.name,
      planned: cat.planned_amount,
      spent,
      difference: cat.planned_amount - spent,
    };
  });
}
