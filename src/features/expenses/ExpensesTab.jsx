import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';
import { uploadReceipt } from '../receipts/uploadReceipt.js';

export default function ExpensesTab({ event, data, profile, onChange }) {
  const { categories, expenses } = data;
  const [form, setForm] = useState({
    amount: '', expense_date: '', description: '', paid_by: '', category_id: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function add(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) return;
    setBusy(true);
    setError('');
    try {
      const { data: row, error: insErr } = await supabase.from('expenses').insert({
        event_id: event.id,
        category_id: form.category_id || null,
        amount,
        expense_date: form.expense_date || new Date().toISOString().slice(0, 10),
        description: form.description,
        paid_by: form.paid_by,
        approval_status: 'pending',
      }).select().single();
      if (insErr) throw insErr;

      if (file) {
        const receipt = await uploadReceipt(file, {
          linkedType: 'expense', linkedId: row.id, uploadedBy: profile.id,
        });
        await supabase.from('expenses').update({ receipt_id: receipt.id }).eq('id', row.id);
      }
      setForm({ amount: '', expense_date: '', description: '', paid_by: '', category_id: '' });
      setFile(null);
      e.target.reset();
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function decide(id, status) {
    await supabase.from('expenses')
      .update({ approval_status: status, approved_by: profile.id })
      .eq('id', id);
    onChange();
  }

  return (
    <div>
      <form onSubmit={add}>
        <input type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input type="date" value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        <input placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <input placeholder="Paid by" value={form.paid_by} onChange={(e) => set('paid_by', e.target.value)} />
        <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
          <option value="">(no category)</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button disabled={busy}>{busy ? 'Saving…' : 'Add expense'}</button>
      </form>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <table border="1" cellPadding="6" style={{ marginTop: 12, width: '100%' }}>
        <thead><tr><th>Date</th><th>Description</th><th>Paid by</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {expenses.map((x) => (
            <tr key={x.id}>
              <td>{x.expense_date}</td>
              <td>{x.description}</td>
              <td>{x.paid_by}</td>
              <td>{formatPeso(x.amount)}</td>
              <td>{x.approval_status}</td>
              <td>
                {x.approval_status === 'pending' ? (
                  <>
                    <button onClick={() => decide(x.id, 'approved')}>Approve</button>
                    <button onClick={() => decide(x.id, 'rejected')}>Reject</button>
                  </>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
