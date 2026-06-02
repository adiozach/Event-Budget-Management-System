import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';
import Icon from '../../components/Icon.jsx';

export default function BudgetTab({ event, categories, onChange }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  async function add(e) {
    e.preventDefault();
    const planned = parseFloat(amount);
    if (!name.trim() || isNaN(planned) || planned < 0) return;
    await supabase.from('budget_categories')
      .insert({ event_id: event.id, name: name.trim(), planned_amount: planned });
    setName(''); setAmount(''); onChange();
  }

  async function remove(id) {
    await supabase.from('budget_categories').delete().eq('id', id);
    onChange();
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2 className="panel-title">Budget Categories</h2></div>
      <form onSubmit={add} className="form-row">
        <input className="input" placeholder="Category (e.g. Food)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" type="number" min="0" step="0.01" placeholder="Planned ₱"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button className="btn btn-primary btn-sm"><Icon name="plus" size={15} /> Add category</button>
      </form>
      {categories.length === 0 ? (
        <div className="empty"><p>No categories yet. Add one above to set your planned budget.</p></div>
      ) : (
        <table className="table">
          <thead><tr><th>Category</th><th>Planned</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td className="num">{formatPeso(c.planned_amount)}</td>
                <td><button className="btn btn-sm btn-reject" onClick={() => remove(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
