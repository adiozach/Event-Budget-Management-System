import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';
import BudgetTab from '../budget/BudgetTab.jsx';
import ExpensesTab from '../expenses/ExpensesTab.jsx';
import IncomeTab from '../income/IncomeTab.jsx';
import ReportsTab from '../reports/ReportsTab.jsx';

const TABS = ['Overview', 'Budget', 'Expenses', 'Income', 'Reports'];

export default function EventDetail({ org, event, profile, onBack }) {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({ categories: [], expenses: [], income: [] });

  const load = useCallback(async () => {
    const [{ data: categories }, { data: expenses }, { data: income }] = await Promise.all([
      supabase.from('budget_categories').select('*').eq('event_id', event.id),
      supabase.from('expenses').select('*').eq('event_id', event.id),
      supabase.from('income').select('*').eq('event_id', event.id),
    ]);
    setData({ categories: categories || [], expenses: expenses || [], income: income || [] });
  }, [event.id]);

  useEffect(() => { load(); }, [load]);

  const totals = computeEventTotals(data);

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack}>← Back to events</button>
      <h2>{event.name}</h2>
      <nav>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ fontWeight: tab === t ? 'bold' : 'normal', marginRight: 8 }}>{t}</button>
        ))}
      </nav>
      <hr />
      {tab === 'Overview' && (
        <div>
          <p>Total Planned: {formatPeso(totals.totalPlanned)}</p>
          <p>Total Spent (approved): {formatPeso(totals.totalSpent)}</p>
          <p>Total Income: {formatPeso(totals.totalIncome)}</p>
          <p><strong>Net Balance: {formatPeso(totals.netBalance)}</strong></p>
          <div style={{ background: '#eee', width: 300, height: 20 }}>
            <div style={{
              background: totals.totalSpent > totals.totalPlanned ? 'crimson' : 'seagreen',
              width: Math.min(300, totals.totalPlanned ? (totals.totalSpent / totals.totalPlanned) * 300 : 0),
              height: 20,
            }} />
          </div>
        </div>
      )}
      {tab === 'Budget' && <BudgetTab event={event} categories={data.categories} onChange={load} />}
      {tab === 'Expenses' && <ExpensesTab event={event} data={data} profile={profile} onChange={load} />}
      {tab === 'Income' && <IncomeTab event={event} income={data.income} profile={profile} onChange={load} />}
      {tab === 'Reports' && <ReportsTab org={org} event={event} data={data} />}
    </div>
  );
}
