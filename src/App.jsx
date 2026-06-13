import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase.js';
import { useAuth } from './features/auth/useAuth.js';
import LoginScreen from './features/auth/LoginScreen.jsx';
import EventsList from './features/events/EventsList.jsx';
import EventDetail from './features/events/EventDetail.jsx';
import SettingsScreen from './features/settings/SettingsScreen.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import Icon from './components/Icon.jsx';
import { Toaster, toast } from './components/toast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import logo from './assets/logo.png';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export default function App() {
  const { session, profile, loading, signIn, signOut } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [org, setOrg] = useState(null);
  const [openEvent, setOpenEvent] = useState(null);
  const [view, setView] = useState('events'); // 'events' | 'settings'
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!session) return;
    supabase.from('organizations').select('*').order('name')
      .then(({ data }) => setOrgs(data || []));
  }, [session]);

  // Count expenses awaiting approval (refreshed on navigation).
  useEffect(() => {
    if (!session) return;
    supabase.from('expenses').select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending')
      .then(({ count }) => setPending(count || 0));
  }, [session, openEvent, view, org]);

  if (loading) return <div className="login-wrap"><p className="muted">Loading…</p></div>;

  if (!session) {
    return (
      <>
        <OfflineBanner />
        <Toaster />
        <LoginScreen onSignIn={signIn} />
      </>
    );
  }

  function pickOrg(o) { setOrg(o); setOpenEvent(null); setView('events'); setSearch(''); }
  const onEventsList = view === 'events' && org && !openEvent;

  const title = view === 'settings'
    ? 'Settings'
    : openEvent ? openEvent.name
    : org ? `${org.name} — Events`
    : 'Dashboard';

  return (
    <>
      <OfflineBanner />
      <Toaster />
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <img src={logo} className="brand-logo" alt="Logo" />
            <div>
              <div className="brand-name">Event Budget</div>
              <div className="brand-sub">Management System</div>
            </div>
          </div>

          <div className="nav-label">Organizations</div>
          {orgs.map((o) => (
            <button key={o.id}
              className={`nav-item ${view === 'events' && org?.id === o.id ? 'active' : ''}`}
              onClick={() => pickOrg(o)}>
              <Icon name={/school|bvbc/i.test(o.name) ? 'school' : 'church'} />
              {o.name}
            </button>
          ))}

          <div className="nav-label">Manage</div>
          {profile?.role === 'admin' && (
            <button className={`nav-item ${view === 'settings' ? 'active' : ''}`}
              onClick={() => setView('settings')}>
              <Icon name="settings" /> Settings
            </button>
          )}

          <div className="sidebar-spacer" />
          <div className="sidebar-user">
            <div className="avatar">{initials(profile?.name)}</div>
            <div className="who">
              <div className="nm">{profile?.name || session.user.email}</div>
              <div className="rl">{profile?.role || 'no role'}</div>
            </div>
          </div>
          <button className="nav-item" onClick={signOut} style={{ marginTop: 6 }}>
            <Icon name="logout" /> Log out
          </button>
        </aside>

        <div className="main">
          <header className="topbar">
            {onEventsList ? (
              <div className="search">
                <Icon name="search" size={16} />
                <input placeholder="Search events…" value={search}
                  onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="btn-link" style={{ padding: 0 }} onClick={() => setSearch('')}>✕</button>}
              </div>
            ) : <div style={{ flex: 1 }} />}
            <div className="topbar-right">
              <button className="icon-btn" style={{ position: 'relative' }}
                title={pending ? `${pending} expense(s) awaiting approval` : 'No pending approvals'}
                onClick={() => toast.info(pending ? `${pending} expense(s) awaiting approval. Open an event's Expenses tab to review.` : 'No pending approvals 🎉')}>
                <Icon name="bell" size={18} />
                {pending > 0 && <span className="badge">{pending > 99 ? '99+' : pending}</span>}
              </button>
              <div className="sidebar-user" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div className="avatar">{initials(profile?.name)}</div>
                <div className="who">
                  <div className="nm">{profile?.name || 'User'}</div>
                  <div className="rl">{profile?.role || ''}</div>
                </div>
              </div>
            </div>
          </header>

          <div className="content">
            <div className="page-head">
              <div>
                <h1 className="page-title">{title}</h1>
                {view === 'events' && !openEvent && (
                  <div className="page-sub">Track planned budgets, expenses, and income per event.</div>
                )}
              </div>
            </div>

            <ErrorBoundary>
              {view === 'settings' ? (
                <SettingsScreen profile={profile} />
              ) : openEvent ? (
                <EventDetail org={org} event={openEvent} profile={profile} onBack={() => setOpenEvent(null)} onUpdated={setOpenEvent} />
              ) : org ? (
                <EventsList org={org} onOpen={setOpenEvent} profile={profile} search={search} />
              ) : (
                <div className="empty">
                  <h3>Welcome, {profile?.name || 'there'} 👋</h3>
                  <p>Select <strong>Church</strong> or <strong>School</strong> from the sidebar to begin.</p>
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
}
