import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';
import { uploadReceipt } from '../receipts/uploadReceipt.js';
import { toast } from '../../components/toast.jsx';
import { logAudit } from '../../lib/audit.js';

const EMPTY = { amount: '', income_date: '', source: '', description: '' };

export default function IncomeTab({ event, income, profile, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function startEdit(i) {
    setEditingId(i.id);
    setForm({
      amount: String(i.amount ?? ''),
      income_date: i.income_date || '',
      source: i.source || '',
      description: i.description || '',
    });
  }

  function cancelEdit() { setEditingId(null); setForm(EMPTY); setFile(null); }

  async function save(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0 || !form.source.trim()) return;
    setBusy(true);
    try {
      const fields = {
        amount,
        income_date: form.income_date || new Date().toISOString().slice(0, 10),
        source: form.source.trim(),
        description: form.description,
      };
      let rowId = editingId;
      if (editingId) {
        const { error } = await supabase.from('income').update(fields).eq('id', editingId);
        if (error) throw error;
        await logAudit(profile, 'income.edit', { entityType: 'income', entityId: editingId, details: `Edited income: ${formatPeso(amount)} from ${fields.source}` });
      } else {
        const { data: row, error } = await supabase.from('income')
          .insert({ event_id: event.id, ...fields })
          .select().single();
        if (error) throw error;
        rowId = row.id;
        await logAudit(profile, 'income.add', { entityType: 'income', entityId: rowId, details: `Added income: ${formatPeso(amount)} from ${fields.source}` });
      }
      if (file) {
        const receipt = await uploadReceipt(file, { linkedType: 'income', linkedId: rowId, uploadedBy: profile.id });
        await supabase.from('income').update({ receipt_id: receipt.id }).eq('id', rowId);
      }
      toast.success(editingId ? 'Income updated' : 'Income added');
      cancelEdit();
      e.target.reset?.();
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(i) {
    if (!window.confirm('Delete this income entry?')) return;
    const { error } = await supabase.from('income').delete().eq('id', i.id);
    if (error) return toast.error(error.message);
    await logAudit(profile, 'income.delete', { entityType: 'income', entityId: i.id, details: `Deleted income: ${formatPeso(i.amount)} from ${i.source}` });
    toast.success('Income deleted');
    onChange();
  }

  async function viewReceipt(path) {
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 120);
    if (error) return toast.error('Cannot open receipt: ' + error.message);
    window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2 className="panel-title">{editingId ? 'Edit Income' : 'Income'}</h2></div>
      <form onSubmit={save} className="form-row">
        <input className="input" type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input className="input" type="date" value={form.income_date} onChange={(e) => set('income_date', e.target.value)} />
        <input className="input" placeholder="Source (e.g. Ticket Sales)" value={form.source}
          onChange={(e) => set('source', e.target.value)} required />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <input className="input" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update' : 'Add income'}</button>
        {editingId && <button type="button" className="btn btn-sm" onClick={cancelEdit}>Cancel</button>}
      </form>
      {income.length === 0 ? (
        <div className="empty"><p>No income recorded yet.</p></div>
      ) : (
        <table className="table">
          <thead><tr><th>Date</th><th>Source</th><th>Description</th><th>Amount</th><th>Receipt</th><th>Action</th></tr></thead>
          <tbody>
            {income.map((i) => (
              <tr key={i.id}>
                <td>{i.income_date}</td>
                <td style={{ fontWeight: 600 }}>{i.source}</td>
                <td>{i.description}</td>
                <td className="num pos">{formatPeso(i.amount)}</td>
                <td>
                  {i.receipt?.file_path
                    ? <button className="btn btn-sm" onClick={() => viewReceipt(i.receipt.file_path)}>View</button>
                    : <span className="muted">—</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => startEdit(i)}>Edit</button>
                    <button className="btn btn-sm btn-reject" onClick={() => remove(i)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
