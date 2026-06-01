import React, { useState } from 'react';

const FRIENDLY = {
  'Invalid login credentials': 'Wrong email or password.',
};

export default function LoginScreen({ onSignIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await onSignIn(email, password);
    if (error) setError(FRIENDLY[error.message] || error.message);
    setBusy(false);
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 320, margin: '80px auto' }}>
      <h2>Event Budget Tracker</h2>
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
