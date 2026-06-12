import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';
import { toast } from '../../components/toast.jsx';
import { logAudit } from '../../lib/audit.js';

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('en-PH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function SettingsScreen({ profile }) {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const isAdmin = profile.role === 'admin';

  const loadLogs = useCallback(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setLogs(data || []));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('*').order('name').then(({ data }) => setUsers(data || []));
    loadLogs();
  }, [isAdmin, loadLogs]);

  async function setRole(u, role) {
    if (u.role === role) return;
    await supabase.from('profiles').update({ role }).eq('id', u.id);
    setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role } : x)));
    await logAudit(profile, 'profile.role_change', { entityType: 'profile', entityId: u.id, details: `Changed ${u.email} role: ${u.role} → ${role}` });
    loadLogs();
    toast.success('Role updated');
  }

  if (!isAdmin) {
    return <div className="panel"><p className="muted">Only admins can manage users.</p></div>;
  }

  return (
    <>
      <div className="panel">
        <div className="panel-head"><h2 className="panel-title">Users &amp; Roles</h2></div>
        <p className="muted" style={{ marginTop: 0 }}>
          To add a new user: create them in Supabase Auth — they appear here once their profile exists. Set roles below.
        </p>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select className="input" value={u.role} onChange={(e) => setRole(u, e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="treasurer">treasurer</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Activity Log (Audit Trail)</h2>
          <button className="btn btn-sm" onClick={loadLogs}>Refresh</button>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          A permanent record of who did what. The 100 most recent actions are shown.
        </p>
        {logs.length === 0 ? (
          <div className="empty"><p>No activity yet (or run migration 006 in Supabase to enable the audit log).</p></div>
        ) : (
          <table className="table">
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtTime(l.created_at)}</td>
                  <td>{l.user_email || '—'}</td>
                  <td><span className="pill planning">{l.action}</span></td>
                  <td>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
