import React, { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  if (online) return null;
  return (
    <div style={{ background: '#b00', color: 'white', padding: 8, textAlign: 'center' }}>
      You're offline — connect to save changes.
    </div>
  );
}
