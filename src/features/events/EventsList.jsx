import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { computeEventTotals } from './eventTotals.js';
import { formatPeso } from '../../lib/format.js';

export default function EventsList({ org, onOpen }) {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*, budget_categories(*), expenses(*), income(*)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false });
    setEvents(data || []);
  }, [org.id]);

  useEffect(() => { load(); }, [load]);

  async function addEvent(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from('events').insert({ organization_id: org.id, name: name.trim() });
    setName('');
    load();
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>{org.name} — Events</h2>
      <form onSubmit={addEvent}>
        <input placeholder="New event name" value={name} onChange={(e) => setName(e.target.value)} />
        <button>+ New Event</button>
      </form>
      <table border="1" cellPadding="6" style={{ marginTop: 12, width: '100%' }}>
        <thead><tr><th>Event</th><th>Status</th><th>Planned</th><th>Spent</th><th>Income</th><th>Balance</th><th></th></tr></thead>
        <tbody>
          {events.map((ev) => {
            const t = computeEventTotals({
              categories: ev.budget_categories || [],
              expenses: ev.expenses || [],
              income: ev.income || [],
            });
            return (
              <tr key={ev.id}>
                <td>{ev.name}</td>
                <td>{ev.status}</td>
                <td>{formatPeso(t.totalPlanned)}</td>
                <td>{formatPeso(t.totalSpent)}</td>
                <td>{formatPeso(t.totalIncome)}</td>
                <td>{formatPeso(t.netBalance)}</td>
                <td><button onClick={() => onOpen(ev)}>Open</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
