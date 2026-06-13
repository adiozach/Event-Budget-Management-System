import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { computeEventTotals } from '../events/eventTotals.js';
import { computeOrgSummary } from '../dashboard/orgSummary.js';
import { formatPeso } from '../../lib/format.js';

const peso = (n) => formatPeso(n).replace('₱', 'PHP ');

export function buildOrgReportModel(org, events) {
  const rows = events.map((ev) => {
    const t = computeEventTotals({
      categories: ev.budget_categories || [],
      expenses: ev.expenses || [],
      income: ev.income || [],
    });
    return {
      name: ev.name,
      status: ev.status,
      date: ev.event_date || '',
      planned: t.totalPlanned,
      spent: t.totalSpent,
      income: t.totalIncome,
      balance: t.netBalance,
    };
  });
  return {
    org: org.name,
    reportDate: new Date().toISOString().slice(0, 10),
    rows,
    grand: computeOrgSummary(events),
  };
}

export function exportOrgPdf(model) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`${model.org} — Organization Summary (All Events)`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Report generated: ${model.reportDate}`, 14, 24);
  doc.text(`Total events: ${model.grand.totalEvents}`, 14, 30);

  autoTable(doc, {
    startY: 36,
    head: [['Event', 'Date', 'Status', 'Planned', 'Spent', 'Income', 'Balance']],
    body: model.rows.map((r) => [r.name, r.date || 'TBA', r.status, peso(r.planned), peso(r.spent), peso(r.income), peso(r.balance)]),
  });

  const g = model.grand;
  autoTable(doc, {
    head: [['GRAND TOTAL — Planned', 'Spent', 'Income', 'Net Balance']],
    body: [[peso(g.totalPlanned), peso(g.totalSpent), peso(g.totalIncome), peso(g.netBalance)]],
  });

  const y = doc.lastAutoTable.finalY + 20;
  doc.text('Prepared by: ____________________', 14, y);
  doc.text('Approved by: ____________________', 14, y + 10);

  doc.save(`${model.org}-organization-summary.pdf`);
}

export function exportOrgExcel(model) {
  const wb = XLSX.utils.book_new();
  const head = ['Event', 'Date', 'Status', 'Planned', 'Spent', 'Income', 'Balance'];
  const body = model.rows.map((r) => [r.name, r.date, r.status, r.planned, r.spent, r.income, r.balance]);
  const g = model.grand;
  body.push([]);
  body.push(['GRAND TOTAL', '', '', g.totalPlanned, g.totalSpent, g.totalIncome, g.netBalance]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head, ...body]), 'All Events');
  XLSX.writeFile(wb, `${model.org}-organization-summary.xlsx`);
}
