import { computeEventTotals } from '../events/eventTotals.js';

// Aggregate totals across all events in an organization.
export function computeOrgSummary(events) {
  let totalPlanned = 0, totalSpent = 0, totalIncome = 0, pendingCount = 0;
  for (const ev of events) {
    const t = computeEventTotals({
      categories: ev.budget_categories || [],
      expenses: ev.expenses || [],
      income: ev.income || [],
    });
    totalPlanned += t.totalPlanned;
    totalSpent += t.totalSpent;
    totalIncome += t.totalIncome;
    pendingCount += (ev.expenses || []).filter((e) => e.approval_status === 'pending').length;
  }
  return {
    totalEvents: events.length,
    totalPlanned,
    totalSpent,
    totalIncome,
    netBalance: totalIncome - totalSpent,
    pendingCount,
  };
}
