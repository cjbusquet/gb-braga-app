// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || '';

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// isConfigured: true quando as variáveis reais estão definidas no Vercel
export const isConfigured = 
  SUPABASE_URL.includes('supabase.co') && 
  SUPABASE_ANON.startsWith('eyJ');

if (!isConfigured) {
  console.warn('⚠️  Supabase não configurado — modo demonstração activo');
} else {
  console.log('✅ Supabase ligado:', SUPABASE_URL);
}
