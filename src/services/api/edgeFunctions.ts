/**
 * Typed wrappers around the Supabase Edge Functions the frontend calls
 * directly. Centralizes the authenticated-fetch boilerplate (bearer token
 * from the current session + anon apikey header) that each caller used to
 * duplicate inline.
 */
import { supabase } from '../../lib/supabaseClient';

interface EdgeFunctionErrorPayload {
  error?: string;
  // Gateway do Supabase (Kong/edge-runtime) usa `message`, não `error`, para
  // as suas próprias falhas de routing — ex.: função não a correr localmente
  // devolve {"message":"name resolution failed"}, nunca chega a executar o
  // código da função. Sem isto, essas falhas caíam sempre no fallback
  // genérico "Erro ao chamar X.", escondendo a causa real.
  message?: string;
}

async function callEdgeFunction<TResponse>(
  functionName: string,
  body: unknown,
): Promise<TResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Sem sessão (ex.: matrícula família, antes de a conta existir) usa a anon
  // key como bearer para o gateway não recusar antes de a função correr.
  const bearer = session?.access_token || import.meta.env.VITE_SUPABASE_ANON;

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON,
      },
      body: JSON.stringify(body),
    },
  );

  const data = (await res.json()) as TResponse & EdgeFunctionErrorPayload;
  if (!res.ok || data.error) {
    const err = new Error(data.error || data.message || `Erro ao chamar ${functionName}.`) as Error & {
      payload?: unknown;
      status?: number;
    };
    err.payload = data;
    err.status = res.status;
    throw err;
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

// ── criar-checkout-session ──────────────────────────────────────────────────
// { planoId }     → Checkout de subscrição (débito automático mensal)
// { pagamentoId } → Checkout de pagamento único (retry de linha pendente/vencida)
export type CriarCheckoutSessionRequest =
  | { planoId: string }
  | { pagamentoId: string };

export interface CriarCheckoutSessionResponse {
  url: string;
}

export function criarCheckoutSession(
  req: CriarCheckoutSessionRequest,
): Promise<CriarCheckoutSessionResponse> {
  return callEdgeFunction<CriarCheckoutSessionResponse>('criar-checkout-session', req);
}

// ── criar-portal-session ────────────────────────────────────────────────────
// Abre o Stripe Customer Portal para o aluno gerir a subscrição (cartão/cancelar)
export function criarPortalSession(): Promise<{ url: string }> {
  return callEdgeFunction<{ url: string }>('criar-portal-session', {});
}

// ── criar-matricula-familia ─────────────────────────────────────────────────
// Matrícula de um plano família: cria N contas + grupo + Checkout de subscrição.
// Chamada antes de o utilizador ter conta (sem sessão).
export interface MatriculaFamiliaRequest {
  planoId: string;
  contrato: { assinatura?: string; aceitaImagem?: boolean; aceitaRGPD?: boolean };
  titular: {
    nome: string; email: string; senha: string; nif?: string; telefone?: string;
    morada?: string; codPostal?: string; treina: boolean;
    dataNasc?: string; faixa?: string; grau?: number;
  };
  membros: { nome: string; dataNasc: string; faixa?: string; grau?: number; email?: string; senha: string }[];
  encarregado?: { nome?: string; nif?: string; telefone?: string; email?: string };
}
export interface MatriculaFamiliaResponse {
  url: string;
  campo?: string; // preenchido quando 409 (email em uso) — 'titular' | 'membro-<i>'
}

export function criarMatriculaFamilia(
  req: MatriculaFamiliaRequest,
): Promise<MatriculaFamiliaResponse> {
  return callEdgeFunction<MatriculaFamiliaResponse>('criar-matricula-familia', req);
}

// ── sync-planos-stripe (admin) ──────────────────────────────────────────────
export interface SyncPlanosStripeResponse {
  mode: string;
  results: { plano: string; priceId?: string; skipped?: boolean; error?: string }[];
}

export function syncPlanosStripe(): Promise<SyncPlanosStripeResponse> {
  return callEdgeFunction<SyncPlanosStripeResponse>('sync-planos-stripe', {});
}
