import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase.js';

export default function OrgPicker({ onPick }) {
  const [orgs, setOrgs] = useState([]);
  useEffect(() => {
    supabase.from('organizations').select('*').order('name')
      .then(({ data }) => setOrgs(data || []));
  }, []);
  return (
    <div style={{ padding: 24 }}>
      <h2>Choose an organization</h2>
      {orgs.map((o) => (
        <button key={o.id} onClick={() => onPick(o)} style={{ margin: 8, padding: 16 }}>
          {o.name}
        </button>
      ))}
    </div>
  );
}
