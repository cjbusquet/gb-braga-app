import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || '';

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-key',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);

// true quando há credenciais reais (hosted *.supabase.co ou local/self-hosted)
export const isConfigured =
  /^https?:\/\//.test(SUPABASE_URL) &&
  SUPABASE_ANON.length > 20;
