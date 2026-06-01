export function sumAmounts(rows, key = 'amount') {
  return rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
}

export function totalPlanned(categories) {
  return sumAmounts(categories, 'planned_amount');
}

export function totalSpent(expenses) {
  return sumAmounts(expenses.filter((e) => e.approval_status === 'approved'));
}

export function totalIncome(income) {
  return sumAmounts(income);
}

export function netBalance(income, spent) {
  return income - spent;
}
