import React, { useState } from 'react';
import { useAuth } from './features/auth/useAuth.js';
import LoginScreen from './features/auth/LoginScreen.jsx';
import OrgPicker from './features/orgs/OrgPicker.jsx';
import EventsList from './features/events/EventsList.jsx';
import EventDetail from './features/events/EventDetail.jsx';
import SettingsScreen from './features/settings/SettingsScreen.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';

export default function App() {
  const { session, profile, loading, signIn, signOut } = useAuth();
  const [org, setOrg] = useState(null);
  const [openEvent, setOpenEvent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  if (loading) return <p>Loading…</p>;
  if (!session) {
    return (
      <>
        <OfflineBanner />
        <LoginScreen onSignIn={signIn} />
      </>
    );
  }

  function backToEvents() { setOpenEvent(null); }
  function changeOrg() { setOrg(null); setOpenEvent(null); }

  return (
    <>
      <OfflineBanner />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottom: '1px solid #ddd' }}>
        <strong>Event Budget Tracker — {profile?.name} ({profile?.role})</strong>
        <div>
          {org && !showSettings && <button onClick={changeOrg}>Change org</button>}
          {profile?.role === 'admin' && (
            <button onClick={() => setShowSettings((s) => !s)}>
              {showSettings ? 'Close settings' : 'Settings'}
            </button>
          )}
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main>
        {showSettings ? (
          <SettingsScreen profile={profile} />
        ) : !org ? (
          <OrgPicker onPick={setOrg} />
        ) : !openEvent ? (
          <EventsList org={org} onOpen={setOpenEvent} />
        ) : (
          <EventDetail org={org} event={openEvent} profile={profile} onBack={backToEvents} />
        )}
      </main>
    </>
  );
}
