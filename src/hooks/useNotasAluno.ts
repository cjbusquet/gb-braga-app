import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';

export interface NotaAluno {
  id: string;
  alunoId: string;
  professorId: string | null;
  professorNome: string;
  nota: string;
  createdAt: string;
}

function mapNota(r: Record<string, unknown>): NotaAluno {
  return {
    id:            r.id as string,
    alunoId:       r.aluno_id as string,
    professorId:   (r.professor_id as string) ?? null,
    professorNome: (r.profiles as { nome?: string } | null)?.nome ?? 'Professor',
    nota:          r.nota as string,
    createdAt:     r.created_at as string,
  };
}

/** Notas privadas do professor sobre este aluno — RLS já exclui o role 'aluno' por completo. */
export function useNotasAlunoQuery(alunoId?: string) {
  return useQuery({
    queryKey: ['notas-aluno', alunoId ?? ''],
    queryFn: async (): Promise<NotaAluno[]> => {
      if (!isConfigured || !alunoId) return [];
      const { data, error } = await supabase
        .from('notas_aluno')
        .select('*, profiles(nome)')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapNota);
    },
    enabled: !!alunoId,
  });
}

export function useCriarNotaAlunoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ alunoId, nota }: { alunoId: string; nota: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('notas_aluno').insert({
        aluno_id: alunoId,
        professor_id: user?.id,
        nota,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { alunoId }) => qc.invalidateQueries({ queryKey: ['notas-aluno', alunoId] }),
  });
}

export function useApagarNotaAlunoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; alunoId: string }) => {
      const { error } = await supabase.from('notas_aluno').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { alunoId }) => qc.invalidateQueries({ queryKey: ['notas-aluno', alunoId] }),
  });
}
