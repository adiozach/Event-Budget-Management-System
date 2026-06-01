import React from 'react';
import { useAuth } from './features/auth/useAuth.js';
import LoginScreen from './features/auth/LoginScreen.jsx';

export default function App() {
  const { session, profile, loading, signIn, signOut } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!session) return <LoginScreen onSignIn={signIn} />;
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
        <strong>Welcome, {profile?.name} ({profile?.role})</strong>
        <button onClick={signOut}>Sign out</button>
      </header>
      <main style={{ padding: 12 }}><p>Signed in. Org picker comes next.</p></main>
    </div>
  );
}
