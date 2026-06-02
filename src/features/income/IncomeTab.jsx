import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';
import { uploadReceipt } from '../receipts/uploadReceipt.js';
import Icon from '../../components/Icon.jsx';
import { toast } from '../../components/toast.jsx';

export default function IncomeTab({ event, income, profile, onChange }) {
  const [form, setForm] = useState({ amount: '', income_date: '', source: '', description: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function add(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0 || !form.source.trim()) return;
    setBusy(true);
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
      toast.success('Income added');
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2 className="panel-title">Income</h2></div>
      <form onSubmit={add} className="form-row">
        <input className="input" type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input className="input" type="date" value={form.income_date} onChange={(e) => set('income_date', e.target.value)} />
        <input className="input" placeholder="Source (e.g. Ticket Sales)" value={form.source}
          onChange={(e) => set('source', e.target.value)} required />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <input className="input" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Add income'}</button>
      </form>
      {income.length === 0 ? (
        <div className="empty"><p>No income recorded yet.</p></div>
      ) : (
        <table className="table">
          <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Amount</th></tr></thead>
          <tbody>
            {income.map((i) => (
              <tr key={i.id}>
                <td>{i.income_date}</td>
                <td style={{ fontWeight: 600 }}>{i.source}</td>
                <td>{i.description}</td>
                <td className="num pos">{formatPeso(i.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
