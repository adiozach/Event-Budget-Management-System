import { computeEventTotals, budgetVsActual } from '../events/eventTotals.js';

export function buildReportModel({ org, event, categories, expenses, income }) {
  return {
    header: {
      organization: org.name,
      eventName: event.name,
      eventDate: event.event_date,
      location: event.location,
      reportDate: new Date().toISOString().slice(0, 10),
    },
    budgetRows: budgetVsActual(categories, expenses),
    incomeRows: income.map((i) => ({ source: i.source, amount: i.amount })),
    totals: computeEventTotals({ categories, expenses, income }),
    pending: expenses
      .filter((e) => e.approval_status === 'pending')
      .map((e) => ({ amount: e.amount, description: e.description })),
  };
}
