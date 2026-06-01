import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';
import { uploadReceipt } from '../receipts/uploadReceipt.js';

export default function IncomeTab({ event, income, profile, onChange }) {
  const [form, setForm] = useState({ amount: '', income_date: '', source: '', description: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function add(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0 || !form.source.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data: row, error: insErr } = await supabase.from('income').insert({
        event_id: event.id,
        amount,
        income_date: form.income_date || new Date().toISOString().slice(0, 10),
        source: form.source.trim(),
        description: form.description,
      }).select().single();
      if (insErr) throw insErr;

      if (file) {
        const receipt = await uploadReceipt(file, {
          linkedType: 'income', linkedId: row.id, uploadedBy: profile.id,
        });
        await supabase.from('income').update({ receipt_id: receipt.id }).eq('id', row.id);
      }
      setForm({ amount: '', income_date: '', source: '', description: '' });
      setFile(null);
      e.target.reset();
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={add}>
        <input type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input type="date" value={form.income_date} onChange={(e) => set('income_date', e.target.value)} />
        <input placeholder="Source (e.g. Ticket Sales)" value={form.source}
          onChange={(e) => set('source', e.target.value)} required />
        <input placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button disabled={busy}>{busy ? 'Saving…' : 'Add income'}</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <table border="1" cellPadding="6" style={{ marginTop: 12, width: '100%' }}>
        <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          {income.map((i) => (
            <tr key={i.id}>
              <td>{i.income_date}</td><td>{i.source}</td><td>{i.description}</td><td>{formatPeso(i.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
