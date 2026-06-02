import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

let counter = 0;
const listeners = new Set();

function emit(type, message) {
  const id = ++counter;
  listeners.forEach((fn) => fn({ id, type, message }));
}

export const toast = {
  success: (m) => emit('success', m),
  error: (m) => emit('error', m),
  info: (m) => emit('info', m),
};

const ICON = { success: 'trend', error: 'bell', info: 'doc' };

export function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function add(t) {
      setItems((cur) => [...cur, t]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 3500);
    }
    listeners.add(add);
    return () => listeners.delete(add);
  }, []);

  return (
    <div className="toaster">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-ic"><Icon name={ICON[t.type]} size={16} /></span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
