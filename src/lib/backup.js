import { supabase } from './supabase.js';

const TABLES = ['organizations', 'profiles', 'receipts', 'events', 'budget_categories', 'expenses', 'income', 'audit_log'];

// Download a full JSON snapshot of all data.
export async function exportBackup() {
  const backup = { app: 'EBMS', version: 1, exported_at: new Date().toISOString(), data: {} };
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*');
    backup.data[t] = error ? [] : (data || []);
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ebms-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  // counts for the toast
  return Object.fromEntries(Object.entries(backup.data).map(([k, v]) => [k, v.length]));
}

// Restore data from a backup file (admin only). Upserts by id, in
// foreign-key order. Organizations and the audit log are not restored
// (orgs are fixed; the audit log is append-only history).
export async function importBackup(text) {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.app !== 'EBMS' || !parsed.data) {
    throw new Error('Not a valid EBMS backup file.');
  }
  const d = parsed.data;
  const order = ['profiles', 'receipts', 'events', 'budget_categories', 'expenses', 'income'];
  const summary = {};
  for (const t of order) {
    const rows = d[t] || [];
    if (!rows.length) { summary[t] = 0; continue; }
    const { error } = await supabase.from(t).upsert(rows, { onConflict: 'id' });
    summary[t] = error ? `error: ${error.message}` : rows.length;
  }
  return summary;
}
