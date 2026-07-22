/**
 * TanStack Query hooks — caching automático com staleTime de 5 min.
 * Usar em páginas que precisam de performance ou paginação.
 * As hooks de useData.ts continuam a funcionar para os outros casos.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from './supabaseClient';
import { mapAluno } from './useData';
import * as mock from '../data/mockData';

export const QUERY_KEYS = {
  alunos: (status?: string) => ['alunos', status ?? ''] as const,
};

export function useAlunosQuery(opts?: { status?: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.alunos(opts?.status),
    queryFn: async () => {
      if (!isConfigured) return mock.mockAlunos;
      let q = supabase.from('alunos').select('*').order('nome');
      if (opts?.status && opts.status !== 'todos') q = q.eq('status', opts.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(mapAluno);
    },
    staleTime: 5 * 60 * 1000,   // 5 min — navegar para outra página e voltar usa cache
    gcTime:    15 * 60 * 1000,  // 15 min no garbage collector
    placeholderData: (prev) => prev,
  });
}

/** Invalida o cache de alunos (chamar depois de criar/editar/eliminar aluno) */
export function useInvalidateAlunos() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['alunos'] });
}
