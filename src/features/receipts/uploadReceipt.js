import { supabase } from '../../lib/supabase.js';

const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB, conservative for free tier

export async function uploadReceipt(file, { linkedType, linkedId, uploadedBy }) {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Only JPG, PNG, or PDF receipts are allowed.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Receipt must be 5 MB or smaller.');
  }
  const path = `${linkedType}/${linkedId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from('receipts').upload(path, file);
  if (upErr) throw upErr;

  const { data, error } = await supabase.from('receipts')
    .insert({ file_path: path, uploaded_by: uploadedBy, linked_type: linkedType, linked_id: linkedId })
    .select()
    .single();
  if (error) throw error;
  return data; // { id, file_path, ... }
}
