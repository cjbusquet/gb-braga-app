// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || '';

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.warn('⚠️  Supabase não configurado — a usar dados de demonstração');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export const isConfigured = !!SUPABASE_URL && !!SUPABASE_ANON;
