import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';
import { toast } from '../../components/toast.jsx';
import { SkeletonRows } from '../../components/Skeleton.jsx';

export default function EventsList({ org, onOpen }) {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!name.trim()) return;
    await supabase.from('events').insert({ organization_id: org.id, name: name.trim() });
    setName('');
    toast.success('Event created');
    load();
  }

  if (loading) return <SkeletonRows rows={5} />;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2 className="panel-title">All Events</h2>
        <form onSubmit={addEvent} className="form-row" style={{ margin: 0 }}>
          <input className="input" placeholder="New event name" value={name}
            onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary btn-sm"><Icon name="plus" size={15} /> New Event</button>
        </form>
      </div>

      {events.length === 0 ? (
        <div className="empty"><h3>No events yet</h3><p>Create your first event above.</p></div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Event</th><th>Status</th><th>Planned</th><th>Spent</th>
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
                  <td><span className={`pill ${ev.status}`}>{ev.status}</span></td>
                  <td className="num">{formatPeso(t.totalPlanned)}</td>
                  <td className="num">{formatPeso(t.totalSpent)}</td>
                  <td className="num">{formatPeso(t.totalIncome)}</td>
                  <td className={`num ${t.netBalance < 0 ? 'neg' : 'pos'}`}>{formatPeso(t.netBalance)}</td>
                  <td><button className="btn btn-sm" onClick={() => onOpen(ev)}>Open</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
