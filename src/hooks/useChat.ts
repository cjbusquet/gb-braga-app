import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import type { MensagemChat, ConversaChat, UserRole } from '../types';

export const CHAT_QUERY_KEYS = {
  conversas: () => ['chat', 'conversas'] as const,
  mensagens: (alunoId: string) => ['chat', 'mensagens', alunoId] as const,
};

function mapMensagemChat(r: Record<string, unknown>): MensagemChat {
  return {
    id:            r.id as string,
    alunoId:       r.aluno_id as string,
    remetenteId:   (r.remetente_id as string) ?? null,
    remetenteRole: r.remetente_role as UserRole,
    corpo:         r.corpo as string,
    lida:          Boolean(r.lida),
    lidaEm:        (r.lida_em as string) ?? null,
    createdAt:     r.created_at as string,
  };
}

/**
 * Staff-side contact list: all chat messages the caller's RLS allows
 * (every aluno, for staff), grouped client-side into one row per
 * aluno with last message + unread count. No dedicated view — message
 * volume per academy is small enough that grouping in JS is simpler
 * than maintaining a SQL view.
 */
async function fetchConversas(): Promise<ConversaChat[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('mensagens_chat')
    .select('aluno_id, corpo, lida, remetente_role, created_at, alunos(nome)')
    .order('created_at', { ascending: true });
  if (error) throw error;

  const porAluno = new Map<string, ConversaChat>();
  for (const row of (data ?? []) as unknown as Array<Record<string, unknown> & { alunos: { nome: string } | null }>) {
    const alunoId = row.aluno_id as string;
    const atual = porAluno.get(alunoId) ?? {
      alunoId,
      alunoNome: row.alunos?.nome ?? '',
      naoLidas: 0,
    };
    atual.ultimaMensagem = row.corpo as string;
    atual.ultimaData = row.created_at as string;
    if (row.remetente_role === 'aluno' && !row.lida) atual.naoLidas += 1;
    porAluno.set(alunoId, atual);
  }
  return Array.from(porAluno.values()).sort(
    (a, b) => (b.ultimaData ?? '').localeCompare(a.ultimaData ?? '')
  );
}

export function useConversasQuery(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.conversas(),
    queryFn: fetchConversas,
    enabled: (opts?.enabled ?? true) && isConfigured,
  });
}

async function fetchMensagensChat(alunoId: string): Promise<MensagemChat[]> {
  if (!isConfigured || !alunoId) return [];
  const { data, error } = await supabase
    .from('mensagens_chat')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMensagemChat);
}

export function useChatMensagensQuery(alunoId: string | undefined) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.mensagens(alunoId ?? ''),
    queryFn: () => fetchMensagensChat(alunoId as string),
    enabled: isConfigured && !!alunoId,
  });
}

interface EnviarChatMensagemInput {
  alunoId: string;
  remetenteId: string;
  remetenteRole: UserRole;
  corpo: string;
}

export function useEnviarChatMensagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnviarChatMensagemInput) => {
      if (!isConfigured) return;
      const { error } = await supabase.from('mensagens_chat').insert({
        aluno_id:       input.alunoId,
        remetente_id:   input.remetenteId,
        remetente_role: input.remetenteRole,
        corpo:          input.corpo,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.mensagens(input.alunoId) });
      qc.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversas() });
    },
  });
}

export function useMarcarChatLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alunoId: string) => {
      if (!isConfigured) return;
      const { error } = await supabase.rpc('marcar_chat_lida', { p_aluno_id: alunoId });
      if (error) throw error;
    },
    onSuccess: (_data, alunoId) => {
      qc.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.mensagens(alunoId) });
      qc.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversas() });
    },
  });
}

/**
 * Realtime sync for mensagens_chat — invalidates the affected query so
 * open chat windows update without a manual refresh. Realtime respects
 * this table's RLS (SELECT policy), so a staff subscription without
 * `alunoId` never receives rows outside what the caller is allowed to
 * see, and an aluno's subscription only ever sees their own thread.
 */
export function useChatRealtime(alunoId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase
      .channel(`mensagens-chat-${alunoId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens_chat',
          ...(alunoId ? { filter: `aluno_id=eq.${alunoId}` } : {}),
        },
        () => {
          qc.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversas() });
          if (alunoId) qc.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.mensagens(alunoId) });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [alunoId, qc]);
}
