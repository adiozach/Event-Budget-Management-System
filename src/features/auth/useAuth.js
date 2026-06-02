import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase.js';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('profile fetch error:', error.message);
      setProfile(null);
      return;
    }
    setProfile(data || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    fetchProfile(session.user.id);
  }, [session, fetchProfile]);

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => supabase.auth.signOut();
  const refreshProfile = () => { if (session) fetchProfile(session.user.id); };

  return { session, profile, loading, signIn, signOut, refreshProfile };
}
