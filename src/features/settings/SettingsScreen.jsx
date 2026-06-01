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

  if (!isAdmin) return <p>Only admins can manage users.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Users</h2>
      <p style={{ color: '#666' }}>
        To add a new user: create them in Supabase Auth, then they appear here after their
        first profile row is created. Set their role below.
      </p>
      <table border="1" cellPadding="6">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.email}</td>
              <td>
                <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
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
