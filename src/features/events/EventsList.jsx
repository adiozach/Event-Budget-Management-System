import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';
import { toast } from '../../components/toast.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';
import { logAudit } from '../../lib/audit.js';

export default function EventsList({ org, onOpen, profile }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: '', event_date: '', location: 'Lucena City, Quezon' });
  const [loading, setLoading] = useState(true);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*, budget_categories(*), expenses(*), income(*)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  }, [org.id]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function addEvent(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    const { data: row } = await supabase.from('events').insert({
      organization_id: org.id,
      name: form.name.trim(),
      event_date: form.event_date || null,
      location: form.location.trim() || 'Lucena City, Quezon',
    }).select().single();
    await logAudit(profile, 'event.create', { entityType: 'event', entityId: row?.id, details: `Created event "${form.name.trim()}" in ${org.name}` });
    setForm({ name: '', event_date: '', location: 'Lucena City, Quezon' });
    toast.success('Event created');
    load();
  }

  async function removeEvent(ev) {
    if (!window.confirm(`Delete event "${ev.name}"?\n\nThis will also delete its budget, expenses, and income. This cannot be undone.`)) return;
    const { error } = await supabase.from('events').delete().eq('id', ev.id);
    if (error) return toast.error(error.message);
    await logAudit(profile, 'event.delete', { entityType: 'event', entityId: ev.id, details: `Deleted event "${ev.name}" in ${org.name}` });
    toast.success('Event deleted');
    load();
  }

  const isAdmin = profile?.role === 'admin';

  if (loading) return <SkeletonRows rows={5} />;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">All Events</h2>
        <form onSubmit={addEvent} className="form-row" style={{ margin: 0 }}>
          <input className="input" placeholder="New event name" value={form.name}
            onChange={(e) => set('name', e.target.value)} />
          <input className="input" type="date" title="Event date" value={form.event_date}
            onChange={(e) => set('event_date', e.target.value)} />
          <input className="input" placeholder="Location" value={form.location}
            onChange={(e) => set('location', e.target.value)} />
          <button className="btn btn-primary btn-sm"><Icon name="plus" size={15} /> New Event</button>
        </form>
      </div>

      {events.length === 0 ? (
        <div className="empty"><h3>No events yet</h3><p>Create your first event above.</p></div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Event</th><th>Date</th><th>Status</th><th>Planned</th><th>Spent</th>
              <th>Income</th><th>Balance</th><th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => {
              const t = computeEventTotals({
                categories: ev.budget_categories || [],
                expenses: ev.expenses || [],
                income: ev.income || [],
              });
              return (
                <tr key={ev.id}>
                  <td style={{ fontWeight: 600 }}>{ev.name}</td>
                  <td className="muted">{ev.event_date || '—'}</td>
                  <td><span className={`pill ${ev.status}`}>{ev.status}</span></td>
                  <td className="num">{formatPeso(t.totalPlanned)}</td>
                  <td className="num">{formatPeso(t.totalSpent)}</td>
                  <td className="num">{formatPeso(t.totalIncome)}</td>
                  <td className={`num ${t.netBalance < 0 ? 'neg' : 'pos'}`}>{formatPeso(t.netBalance)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => onOpen(ev)}>Open</button>
                      {isAdmin && (
                        <button className="btn btn-sm btn-reject" onClick={() => removeEvent(ev)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
