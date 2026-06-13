import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';
import { toast } from '../../components/toast.jsx';
import { logAudit } from '../../lib/audit.js';
import BudgetTab from '../budget/BudgetTab.jsx';
import ExpensesTab from '../expenses/ExpensesTab.jsx';
import IncomeTab from '../income/IncomeTab.jsx';
import ReportsTab from '../reports/ReportsTab.jsx';
import AnalyticsTab from '../analytics/AnalyticsTab.jsx';
import { SkeletonCards } from '../../components/Skeleton.jsx';

const TABS = ['Overview', 'Budget', 'Expenses', 'Income', 'Analytics', 'Reports'];
const STATUSES = ['planning', 'active', 'closed'];

const KPIS = [
  { key: 'totalPlanned', label: 'Total Planned', cls: 'teal', icon: 'wallet' },
  { key: 'totalSpent', label: 'Total Spent', cls: 'purple', icon: 'card' },
  { key: 'totalIncome', label: 'Total Income', cls: 'orange', icon: 'trend' },
  { key: 'netBalance', label: 'Net Balance', cls: 'pink', icon: 'scale' },
];

export default function EventDetail({ org, event, profile, onBack, onUpdated }) {
  const [tab, setTab] = useState('Overview');
  const [data, setData] = useState({ categories: [], expenses: [], income: [] });
  const [loading, setLoading] = useState(true);
  const [ev, setEv] = useState(event);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', event_date: '', location: '' });

  useEffect(() => { setEv(event); }, [event]);

  const load = useCallback(async () => {
    const [{ data: categories }, { data: expenses }, { data: income }] = await Promise.all([
      supabase.from('budget_categories').select('*').eq('event_id', event.id).order('name'),
      supabase.from('expenses').select('*, receipt:receipts(file_path)').eq('event_id', event.id).order('expense_date', { ascending: false }),
      supabase.from('income').select('*, receipt:receipts(file_path)').eq('event_id', event.id).order('income_date', { ascending: false }),
    ]);
    setData({ categories: categories || [], expenses: expenses || [], income: income || [] });
    setLoading(false);
  }, [event.id]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function changeStatus(status) {
    const { error } = await supabase.from('events').update({ status }).eq('id', ev.id);
    if (error) return toast.error(error.message);
    const updated = { ...ev, status };
    setEv(updated); onUpdated?.(updated);
    await logAudit(profile, 'event.status', { entityType: 'event', entityId: ev.id, details: `Set "${ev.name}" status to ${status}` });
    toast.success(`Status: ${status}`);
  }

  function startEdit() {
    setForm({ name: ev.name || '', event_date: ev.event_date || '', location: ev.location || '' });
    setEditing(true);
  }

  async function saveDetails(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const fields = { name: form.name.trim(), event_date: form.event_date || null, location: form.location.trim() || ev.location };
    const { error } = await supabase.from('events').update(fields).eq('id', ev.id);
    if (error) return toast.error(error.message);
    const updated = { ...ev, ...fields };
    setEv(updated); onUpdated?.(updated); setEditing(false);
    await logAudit(profile, 'event.edit', { entityType: 'event', entityId: ev.id, details: `Edited event details: "${fields.name}"` });
    toast.success('Event updated');
  }

  const totals = computeEventTotals(data);
  const spentPct = totals.totalPlanned ? (totals.totalSpent / totals.totalPlanned) * 100 : 0;
  const over = totals.totalSpent > totals.totalPlanned;

  return (
    <div>
      <button className="btn-link" onClick={onBack}><Icon name="back" size={15} /> Back to events</button>

      {editing ? (
        <form onSubmit={saveDetails} className="form-row" style={{ marginTop: 10 }}>
          <input className="input" placeholder="Event name" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <input className="input" type="date" value={form.event_date}
            onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
          <input className="input" placeholder="Location" value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <button className="btn btn-primary btn-sm">Save</button>
          <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <span className={`pill ${ev.status}`}>{ev.status}</span>
          <select className="input" value={ev.status} onChange={(e) => changeStatus(e.target.value)} title="Change status">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-sm" onClick={startEdit}>Edit details</button>
          <span className="muted">{ev.event_date || 'no date'} · {ev.location}</span>
        </div>
      )}

      <div className="tabs" style={{ marginTop: 14 }}>
        {TABS.map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading && tab === 'Overview' && <SkeletonCards count={4} />}

      {!loading && tab === 'Overview' && (
        <>
          <div className="kpi-grid">
            {KPIS.map((k) => (
              <div key={k.key} className={`kpi-card ${k.cls}`}>
                <div className="kpi-top">
                  <div className="kpi-icon"><Icon name={k.icon} size={20} /></div>
                  <div className="kpi-label">{k.label}</div>
                </div>
                <div className="kpi-value">{formatPeso(totals[k.key])}</div>
                <div className="kpi-foot">{k.key === 'totalSpent' ? 'Approved expenses only' : ' '}</div>
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
      {tab === 'Budget' && <BudgetTab event={ev} categories={data.categories} onChange={load} />}
      {tab === 'Expenses' && <ExpensesTab event={ev} data={data} profile={profile} onChange={load} />}
      {tab === 'Income' && <IncomeTab event={ev} income={data.income} profile={profile} onChange={load} />}
      {tab === 'Reports' && <ReportsTab org={org} event={ev} data={data} />}
    </div>
  );
}
