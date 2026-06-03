import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPeso } from '../../lib/format.js';

// jsPDF's built-in fonts can't render the ₱ glyph (it shows as "±"),
// so for the PDF we use the standard "PHP" currency code instead.
function peso(n) {
  return formatPeso(n).replace('₱', 'PHP ');
}

export function exportPdf(model) {
  const doc = new jsPDF();
  const h = model.header;
  doc.setFontSize(14);
  doc.text(`${h.organization} — Event Budget Summary`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Event: ${h.eventName}`, 14, 24);
  doc.text(`Date: ${h.eventDate || 'TBA'}    Location: ${h.location}`, 14, 30);
  doc.text(`Report generated: ${h.reportDate}`, 14, 36);

  autoTable(doc, {
    startY: 42,
    head: [['Category', 'Planned', 'Spent', 'Difference']],
    body: model.budgetRows.map((r) => [r.name, peso(r.planned), peso(r.spent), peso(r.difference)]),
  });

  autoTable(doc, {
    head: [['Income Source', 'Amount']],
    body: model.incomeRows.map((r) => [r.source, peso(r.amount)]),
  });

  const t = model.totals;
  autoTable(doc, {
    head: [['Total Planned', 'Total Spent', 'Total Income', 'Net Balance']],
    body: [[peso(t.totalPlanned), peso(t.totalSpent), peso(t.totalIncome), peso(t.netBalance)]],
  });

  if (model.pending.length) {
    autoTable(doc, {
      head: [['Pending Approval — Description', 'Amount']],
      body: model.pending.map((p) => [p.description || '(no description)', peso(p.amount)]),
    });
  }

  const y = doc.lastAutoTable.finalY + 20;
  doc.text('Prepared by: ____________________', 14, y);
  doc.text('Approved by: ____________________', 14, y + 10);

  doc.save(`${h.eventName}-budget-summary.pdf`);
}
