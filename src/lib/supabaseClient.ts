import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_ENV = import.meta.env.VITE_SUPABASE_URL  || '';
const SUPABASE_ANON    = import.meta.env.VITE_SUPABASE_ANON || '';

const LOOPBACK_HOST = /^(127\.0\.0\.1|localhost|\[::1\])$/;

// When VITE_SUPABASE_URL points at a loopback address (local `supabase
// start` stack) but the page itself is being loaded from somewhere else —
// e.g. an ngrok tunnel used to test on another device — a direct call to
// 127.0.0.1 either can't reach the developer's machine at all, or gets
// blocked by the browser as mixed content (HTTP call from an HTTPS page).
// In dev mode, route through the dev server's own origin instead: Vite's
// `/supabase` proxy (vite.config.ts) forwards it server-to-server to the
// local Supabase stack, so the browser only ever talks to the one HTTPS
// origin it's already loaded from.
function resolveSupabaseUrl(envUrl: string): string {
  if (!import.meta.env.DEV || typeof window === 'undefined' || !envUrl) return envUrl;
  try {
    const envIsLoopback = LOOPBACK_HOST.test(new URL(envUrl).hostname);
    const pageIsLoopback = LOOPBACK_HOST.test(window.location.hostname);
    if (envIsLoopback && !pageIsLoopback) {
      return `${window.location.origin}/supabase`;
    }
  } catch {
    // envUrl wasn't a valid absolute URL — fall through unchanged
  }
  return envUrl;
}

const SUPABASE_URL = resolveSupabaseUrl(SUPABASE_URL_ENV);

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-key',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } }
);

// true quando há credenciais reais (hosted *.supabase.co ou local/self-hosted)
export const isConfigured =
  /^https?:\/\//.test(SUPABASE_URL) &&
  SUPABASE_ANON.length > 20;

// true apenas quando apontado para uma stack Supabase local (npx supabase
// start) — usado para nunca mostrar atalhos/credenciais de dev num build
// apontado a um projeto real, mesmo que isConfigured seja true nesse caso.
// Checked against the *configured* URL, not the (possibly proxied)
// resolved one, so this still reads true when accessed through ngrok.
export const isLocalSupabase = /^https?:\/\/(127\.0\.0\.1|localhost)([:/]|$)/.test(SUPABASE_URL_ENV);
