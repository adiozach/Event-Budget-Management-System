import { supabase } from './supabase.js';

// Append an entry to the audit log. Never throws — logging must not block
// the user's action if the audit table/connection has an issue.
export async function logAudit(profile, action, { entityType, entityId, details } = {}) {
  try {
    await supabase.from('audit_log').insert({
      user_id: profile?.id || null,
      user_email: profile?.email || null,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch {
    // ignore audit failures
  }
}
