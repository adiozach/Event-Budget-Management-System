import * as XLSX from 'xlsx';

export function exportExcel(model) {
  const wb = XLSX.utils.book_new();

  const budget = [['Category', 'Planned', 'Spent', 'Difference'],
    ...model.budgetRows.map((r) => [r.name, r.planned, r.spent, r.difference])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(budget), 'Budget vs Actual');

  const income = [['Source', 'Amount'], ...model.incomeRows.map((r) => [r.source, r.amount])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(income), 'Income');

  const t = model.totals;
  const summary = [['Total Planned', t.totalPlanned], ['Total Spent', t.totalSpent],
    ['Total Income', t.totalIncome], ['Net Balance', t.netBalance]];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

  XLSX.writeFile(wb, `${model.header.eventName}-budget-summary.xlsx`);
}
