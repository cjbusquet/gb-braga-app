// Supabase Edge Function — invite-staff
// Creates a staff auth account and returns a password-recovery link
// so the new member can set their own password.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { email, nome, role } = await req.json()
    if (!email || !nome || !role) {
      return json({ error: 'email, nome e role são obrigatórios' }, 400)
    }

    // ── 1. Verify the caller is a superadmin ──────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: callerUser } } = await caller.auth.getUser()
    if (!callerUser) return json({ error: 'Não autenticado' }, 401)

    const { data: callerProfile } = await caller
      .from('profiles').select('role').eq('id', callerUser.id).single()
    if (callerProfile?.role !== 'superadmin') {
      return json({ error: 'Acesso restrito a superadmin' }, 403)
    }

    // ── 2. Admin client (service role) ────────────────────────────────────────
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── 3. Create auth user with a random temp password ───────────────────────
    const tempPw = crypto.randomUUID() + crypto.randomUUID() // 72 chars, never known by anyone
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPw,
      email_confirm: true,            // skip email verification step
      user_metadata: { nome, role },
    })
    if (createErr) return json({ error: createErr.message }, 400)

    // ── 4. Upsert profile with correct role (in case trigger missed it) ───────
    await admin.from('profiles').upsert(
      { id: created.user.id, nome, email, role, matricula_completa: true },
      { onConflict: 'id' }
    )

    // ── 5. Generate a password-recovery link the staff member uses to
    //       set their own password (triggers PASSWORD_RECOVERY event in app) ───
    const siteUrl =
      Deno.env.get('SITE_URL') ||
      req.headers.get('origin') ||
      'http://localhost:5173'

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: siteUrl },
    })

    if (linkErr) {
      // User created but link generation failed — still a success
      return json({ success: true, email, action_link: null, warning: linkErr.message })
    }

    return json({
      success: true,
      email,
      action_link: (linkData as any).properties?.action_link ?? null,
    })

  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
