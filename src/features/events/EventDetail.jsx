import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';
import BudgetTab from '../budget/BudgetTab.jsx';
import ExpensesTab from '../expenses/ExpensesTab.jsx';
import IncomeTab from '../income/IncomeTab.jsx';
import ReportsTab from '../reports/ReportsTab.jsx';
import AnalyticsTab from '../analytics/AnalyticsTab.jsx';

const TABS = ['Overview', 'Analytics', 'Budget', 'Expenses', 'Income', 'Reports'];

const KPIS = [
  { key: 'totalPlanned', label: 'Total Planned', cls: 'teal', icon: 'wallet' },
  { key: 'totalSpent', label: 'Total Spent', cls: 'purple', icon: 'card' },
  { key: 'totalIncome', label: 'Total Income', cls: 'orange', icon: 'trend' },
  { key: 'netBalance', label: 'Net Balance', cls: 'pink', icon: 'scale' },
];

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
  const spentPct = totals.totalPlanned ? (totals.totalSpent / totals.totalPlanned) * 100 : 0;
  const over = totals.totalSpent > totals.totalPlanned;

  return (
    <div>
      <button className="btn-link" onClick={onBack}><Icon name="back" size={15} /> Back to events</button>

      <div className="tabs" style={{ marginTop: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        <>
          <div className="kpi-grid">
            {KPIS.map((k) => (
              <div key={k.key} className={`kpi-card ${k.cls}`}>
                <div className="kpi-top">
                  <div className="kpi-icon"><Icon name={k.icon} size={20} /></div>
                  <div className="kpi-label">{k.label}</div>
                </div>
                <div className="kpi-value">{formatPeso(totals[k.key])}</div>
                <div className="kpi-foot">{k.key === 'totalSpent' ? 'Approved expenses only' : ' '}</div>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Budget Usage</h2>
              <span className="muted">{formatPeso(totals.totalSpent)} of {formatPeso(totals.totalPlanned)} ({Math.round(spentPct)}%)</span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{
                width: `${Math.min(100, spentPct)}%`,
                background: over ? 'linear-gradient(90deg,#f87171,#ef4444)' : 'linear-gradient(90deg,#2dd4bf,#34d399)',
              }} />
            </div>
            {over && <p className="error-text">Spending has exceeded the planned budget.</p>}
          </div>
        </>
      )}

      {tab === 'Analytics' && <AnalyticsTab data={data} />}
      {tab === 'Budget' && <BudgetTab event={event} categories={data.categories} onChange={load} />}
      {tab === 'Expenses' && <ExpensesTab event={event} data={data} profile={profile} onChange={load} />}
      {tab === 'Income' && <IncomeTab event={event} income={data.income} profile={profile} onChange={load} />}
      {tab === 'Reports' && <ReportsTab org={org} event={event} data={data} />}
    </div>
  );
}
