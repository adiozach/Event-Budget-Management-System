import React, { useState } from 'react';
import logo from '../../assets/logo.png';

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
    <div className="login-wrap">
      <form onSubmit={submit} className="login-card">
        <div className="brand" style={{ flexDirection: 'column', gap: 8 }}>
          <img src={logo} className="brand-logo-lg" alt="Logo" />
          <div style={{ textAlign: 'center' }}>
            <div className="brand-name">Event Budget Management System</div>
            <div className="brand-sub">Lucena City</div>
          </div>
        </div>
        <h2>Welcome back</h2>
        <div className="page-sub">Sign in to manage event budgets</div>
        <input className="input" type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
