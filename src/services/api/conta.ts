/**
 * Operações de conta usadas no fluxo público de matrícula (antes de o
 * utilizador ter sessão). Ficam aqui, e não nas páginas, para respeitar a
 * regra do CLAUDE.md: componentes nunca chamam o Supabase diretamente.
 */
import { supabase, isConfigured } from '../../lib/supabaseClient';

/** Mínimo de caracteres de password — igual em toda a app e no Supabase Auth. */
export const MIN_SENHA = 8;

/**
 * Existe uma conta com este email? (RPC `email_existe`, com limite de
 * pedidos por IP — patch 45). Na dúvida devolve false: o signUp apanha o
 * duplicado de qualquer forma.
 */
export async function emailJaRegistado(email: string): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    const { data, error } = await supabase.rpc('email_existe', { e: email.trim() });
    return !error && data === true;
  } catch {
    return false;
  }
}

export interface ResultadoRegisto {
  userId: string | null;
  /** true quando o Supabase exige confirmação por email antes do login. */
  precisaConfirmar: boolean;
  erro?: string;
}

/**
 * Cria a conta de login. O papel (role) nunca é enviado daqui: a BD
 * atribui sempre 'aluno' a registos públicos (patch 45).
 */
export async function registarConta(email: string, senha: string, nome: string): Promise<ResultadoRegisto> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });
  if (error) {
    return {
      userId: null,
      precisaConfirmar: false,
      erro: error.message.includes('already registered')
        ? 'Este email já está registado. Vai ao Login e usa "Entrar".'
        : error.message,
    };
  }
  return { userId: data.user?.id ?? null, precisaConfirmar: !data.session };
}
