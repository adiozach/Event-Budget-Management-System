import React, { useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { formatPeso } from '../../lib/format.js';
import { uploadReceipt } from '../receipts/uploadReceipt.js';
import { toast } from '../../components/toast.jsx';
import { logAudit } from '../../lib/audit.js';

const EMPTY = { amount: '', expense_date: '', description: '', paid_by: '', category_id: '' };

export default function ExpensesTab({ event, data, profile, onChange }) {
  const { categories, expenses } = data;
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = profile?.role === 'admin';

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function startEdit(x) {
    setEditingId(x.id);
    setForm({
      amount: String(x.amount ?? ''),
      expense_date: x.expense_date || '',
      description: x.description || '',
      paid_by: x.paid_by || '',
      category_id: x.category_id || '',
    });
  }

  function cancelEdit() { setEditingId(null); setForm(EMPTY); setFile(null); }

  async function save(e) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount < 0) return;
    setBusy(true);
    try {
      const fields = {
        category_id: form.category_id || null,
        amount,
        expense_date: form.expense_date || new Date().toISOString().slice(0, 10),
        description: form.description,
        paid_by: form.paid_by,
      };
      let rowId = editingId;
      if (editingId) {
        const { error } = await supabase.from('expenses').update(fields).eq('id', editingId);
        if (error) throw error;
        await logAudit(profile, 'expense.edit', { entityType: 'expense', entityId: editingId, details: `Edited expense: ${formatPeso(amount)} ${form.description || ''}`.trim() });
      } else {
        const { data: row, error } = await supabase.from('expenses')
          .insert({ event_id: event.id, approval_status: 'pending', ...fields })
          .select().single();
        if (error) throw error;
        rowId = row.id;
        await logAudit(profile, 'expense.add', { entityType: 'expense', entityId: rowId, details: `Added expense: ${formatPeso(amount)} ${form.description || ''}`.trim() });
      }
      if (file) {
        const receipt = await uploadReceipt(file, { linkedType: 'expense', linkedId: rowId, uploadedBy: profile.id });
        await supabase.from('expenses').update({ receipt_id: receipt.id }).eq('id', rowId);
      }
      toast.success(editingId ? 'Expense updated' : 'Expense added');
      cancelEdit();
      e.target.reset?.();
      onChange();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function decide(x, status) {
    const { error } = await supabase.from('expenses')
      .update({ approval_status: status, approved_by: profile.id }).eq('id', x.id);
    if (error) return toast.error(error.message);
    await logAudit(profile, `expense.${status}`, { entityType: 'expense', entityId: x.id, details: `${status === 'approved' ? 'Approved' : 'Rejected'} ${formatPeso(x.amount)} ${x.description || ''}`.trim() });
    toast.success(status === 'approved' ? 'Expense approved' : 'Expense rejected');
    onChange();
  }

  async function revert(x) {
    if (!window.confirm('Revert this expense back to pending so it can be edited?')) return;
    const { error } = await supabase.from('expenses')
      .update({ approval_status: 'pending', approved_by: null }).eq('id', x.id);
    if (error) return toast.error(error.message);
    await logAudit(profile, 'expense.revert', { entityType: 'expense', entityId: x.id, details: `Reverted to pending: ${formatPeso(x.amount)} ${x.description || ''}`.trim() });
    toast.success('Reverted to pending');
    onChange();
  }

  async function remove(x) {
    if (!window.confirm('Delete this expense?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', x.id);
    if (error) return toast.error(error.message);
    await logAudit(profile, 'expense.delete', { entityType: 'expense', entityId: x.id, details: `Deleted expense: ${formatPeso(x.amount)} ${x.description || ''}`.trim() });
    toast.success('Expense deleted');
    onChange();
  }

  async function viewReceipt(path) {
    const { data, error } = await supabase.storage.from('receipts').createSignedUrl(path, 120);
    if (error) return toast.error('Cannot open receipt: ' + error.message);
    window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2 className="panel-title">{editingId ? 'Edit Expense' : 'Expenses'}</h2></div>
      <form onSubmit={save} className="form-row">
        <select className="input" value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
          <option value="">(no category)</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="input" type="number" min="0" step="0.01" placeholder="Amount ₱"
          value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
        <input className="input" type="date" value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
        <input className="input" placeholder="Paid by" value={form.paid_by} onChange={(e) => set('paid_by', e.target.value)} />
        <input className="input" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Update' : 'Add expense'}</button>
        {editingId && <button type="button" className="btn btn-sm" onClick={cancelEdit}>Cancel</button>}
      </form>
      {expenses.length === 0 ? (
        <div className="empty"><p>No expenses recorded yet.</p></div>
      ) : (
        <table className="table">
          <thead><tr><th>Date</th><th>Description</th><th>Paid by</th><th>Amount</th><th>Status</th><th>Receipt</th><th>Action</th></tr></thead>
          <tbody>
            {expenses.map((x) => {
              const locked = x.approval_status !== 'pending';
              return (
                <tr key={x.id}>
                  <td>{x.expense_date}</td>
                  <td>{x.description}</td>
                  <td>{x.paid_by}</td>
                  <td className="num">{formatPeso(x.amount)}</td>
                  <td>
                    <span className={`pill ${x.approval_status}`}>{x.approval_status}</span>
                    {locked && <span title="Locked" style={{ marginLeft: 6 }}>🔒</span>}
                  </td>
                  <td>
                    {x.receipt?.file_path
                      ? <button className="btn btn-sm" onClick={() => viewReceipt(x.receipt.file_path)}>View</button>
                      : <span className="muted">—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!locked && (
                        <>
                          <button className="btn btn-sm btn-approve" onClick={() => decide(x, 'approved')}>Approve</button>
                          <button className="btn btn-sm btn-reject" onClick={() => decide(x, 'rejected')}>Reject</button>
                          <button className="btn btn-sm" onClick={() => startEdit(x)}>Edit</button>
                          <button className="btn btn-sm btn-reject" onClick={() => remove(x)}>Delete</button>
                        </>
                      )}
                      {locked && isAdmin && (
                        <>
                          <button className="btn btn-sm" onClick={() => revert(x)}>Revert to pending</button>
                          <button className="btn btn-sm btn-reject" onClick={() => remove(x)}>Delete</button>
                        </>
                      )}
                      {locked && !isAdmin && <span className="muted">Locked</span>}
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
