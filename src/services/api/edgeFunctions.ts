/**
 * Typed wrappers around the Supabase Edge Functions the frontend calls
 * directly. Centralizes the authenticated-fetch boilerplate (bearer token
 * from the current session + anon apikey header) that each caller used to
 * duplicate inline.
 */
import { supabase } from '../../lib/supabaseClient';

interface EdgeFunctionErrorPayload {
  error?: string;
}

async function callEdgeFunction<TResponse>(
  functionName: string,
  body: unknown,
): Promise<TResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON,
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await res.json()) as TResponse & EdgeFunctionErrorPayload;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Erro ao chamar ${functionName}.`);
  }
  return data;
}

// ── invite-staff ────────────────────────────────────────────────────────────
export type StaffInviteRole = 'professor' | 'admin' | 'atendimento';

export interface InviteStaffRequest {
  email: string;
  nome: string;
  role: StaffInviteRole;
}

export interface InviteStaffResponse {
  action_link?: string;
  email: string;
}

export function inviteStaff(req: InviteStaffRequest): Promise<InviteStaffResponse> {
  return callEdgeFunction<InviteStaffResponse>('invite-staff', req);
}

// ── send-email ───────────────────────────────────────────────────────────────
export interface SendEmailRequest {
  dest: string;
  assunto: string;
  corpo: string;
}

export interface SendEmailResponse {
  sent: number;
  total: number;
  errors?: string[];
}

export function sendEmail(req: SendEmailRequest): Promise<SendEmailResponse> {
  return callEdgeFunction<SendEmailResponse>('send-email', req);
}
