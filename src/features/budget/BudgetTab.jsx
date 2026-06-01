import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';

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
    <div>
      <form onSubmit={add}>
        <input placeholder="Category (e.g. Food)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" min="0" step="0.01" placeholder="Planned ₱"
          value={amount} onChange={(e) => setAmount(e.target.value)} />
        <button>Add category</button>
      </form>
      <table border="1" cellPadding="6" style={{ marginTop: 12 }}>
        <thead><tr><th>Category</th><th>Planned</th><th></th></tr></thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{formatPeso(c.planned_amount)}</td>
              <td><button onClick={() => remove(c.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
