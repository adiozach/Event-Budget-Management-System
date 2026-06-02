import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function SettingsScreen({ profile }) {
  const [users, setUsers] = useState([]);
  const isAdmin = profile.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    supabase.from('profiles').select('*').order('name').then(({ data }) => setUsers(data || []));
  }, [isAdmin]);

  async function setRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers((u) => u.map((x) => (x.id === id ? { ...x, role } : x)));
  }

  if (!isAdmin) {
    return <div className="panel"><p className="muted">Only admins can manage users.</p></div>;
  }

  return (
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
                <select className="input" value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                  <option value="admin">admin</option>
                  <option value="treasurer">treasurer</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
