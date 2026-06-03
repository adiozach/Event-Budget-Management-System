import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPeso } from '../../lib/format.js';

// jsPDF's built-in fonts can't render the ₱ glyph (it shows as "±"),
// so for the PDF we use the standard "PHP" currency code instead.
function peso(n) {
  return formatPeso(n).replace('₱', 'PHP ');
}

// Draw a simple "Budget vs Actual" bar chart with jsPDF primitives.
// Returns the Y position just below the chart.
function drawBudgetChart(doc, rows, startY) {
  const shown = rows.slice(0, 6);
  if (shown.length === 0) return startY;

  const x0 = 16, chartW = 180, chartH = 45;
  const baseline = startY + chartH;
  const maxVal = Math.max(1, ...shown.flatMap((r) => [r.planned, r.spent]));
  const slotW = chartW / shown.length;
  const barW = Math.min(14, slotW / 3.2);

  doc.setFontSize(11);
  doc.text('Budget vs Actual (by category)', x0, startY - 3);

  // axis baseline
  doc.setDrawColor(180);
  doc.line(x0, baseline, x0 + chartW, baseline);

  shown.forEach((r, i) => {
    const cx = x0 + slotW * i + slotW / 2;
    const ph = (r.planned / maxVal) * chartH;
    const sh = (r.spent / maxVal) * chartH;
    // planned (teal)
    doc.setFillColor(45, 212, 191);
    doc.rect(cx - barW - 1, baseline - ph, barW, ph, 'F');
    // spent (purple)
    doc.setFillColor(139, 92, 246);
    doc.rect(cx + 1, baseline - sh, barW, sh, 'F');
    // category label
    doc.setFontSize(7);
    doc.setTextColor(80);
    const label = r.name.length > 12 ? r.name.slice(0, 11) + '…' : r.name;
    doc.text(label, cx, baseline + 4, { align: 'center' });
  });

  // legend
  doc.setFontSize(8);
  doc.setFillColor(45, 212, 191); doc.rect(x0, baseline + 8, 4, 4, 'F');
  doc.setTextColor(60); doc.text('Planned', x0 + 6, baseline + 11);
  doc.setFillColor(139, 92, 246); doc.rect(x0 + 34, baseline + 8, 4, 4, 'F');
  doc.text('Spent', x0 + 40, baseline + 11);
  doc.setTextColor(0);

  return baseline + 18;
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

  // Graph at the LAST part of the report (after all tables).
  const pageH = doc.internal.pageSize.getHeight();
  let y = doc.lastAutoTable.finalY + 16;
  if (y + 75 > pageH) { doc.addPage(); y = 22; } // new page if it won't fit
  y = drawBudgetChart(doc, model.budgetRows, y);

  // Signature lines at the very bottom.
  const sy = y + 8;
  doc.setFontSize(10);
  doc.text('Prepared by: ____________________', 14, sy);
  doc.text('Approved by: ____________________', 14, sy + 10);

  doc.save(`${h.eventName}-budget-summary.pdf`);
}
