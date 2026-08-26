import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import type { Notificacao } from '../types';

export const NOTIFICACOES_QUERY_KEYS = {
  list: () => ['notificacoes', 'list'] as const,
};

function mapNotificacao(r: Record<string, unknown>): Notificacao {
  return {
    id:        r.id as string,
    profileId: r.profile_id as string,
    titulo:    r.titulo as string,
    corpo:     r.corpo as string,
    tipo:      r.tipo as Notificacao['tipo'],
    lida:      Boolean(r.lida),
    link:      (r.link as string) ?? undefined,
    createdAt: r.created_at as string,
  };
}

async function fetchNotificacoes(): Promise<Notificacao[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('notificacoes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map(mapNotificacao);
}

/** Own in-app notifications — RLS already scopes this to the caller's profile_id. */
export function useNotificacoesQuery() {
  return useQuery({
    queryKey: NOTIFICACOES_QUERY_KEYS.list(),
    queryFn: fetchNotificacoes,
    enabled: isConfigured,
  });
}

export function useMarcarNotificacaoLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isConfigured) return;
      const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEYS.list() }),
  });
}

export function useMarcarTodasNotificacoesLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!isConfigured) return;
      const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEYS.list() }),
  });
}

/**
 * Marks unread notifications for a given page (e.g. 'chat', 'mensagens')
 * as read — used so opening the page itself clears the bell badge, not
 * just clicking a notification in the dropdown.
 */
export function useMarcarNotificacoesPorLinkLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: string) => {
      if (!isConfigured) return;
      const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('link', link).eq('lida', false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEYS.list() }),
  });
}

/** Realtime sync so the header bell updates the moment a new notification lands. */
export function useNotificacoesRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notificacoes' },
        () => qc.invalidateQueries({ queryKey: NOTIFICACOES_QUERY_KEYS.list() })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}
