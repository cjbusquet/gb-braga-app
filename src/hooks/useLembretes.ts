import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';

export interface LembreteAluno {
  id: string;
  alunoId: string;
  professorId: string;
  texto: string;
  aulasAlvo: number;
  aulasDecorridas: number;
  concluido: boolean;
  createdAt: string;
}

function mapLembrete(r: Record<string, unknown>): LembreteAluno {
  return {
    id:              r.id as string,
    alunoId:         r.aluno_id as string,
    professorId:     r.professor_id as string,
    texto:           r.texto as string,
    aulasAlvo:       r.aulas_alvo as number,
    aulasDecorridas: r.aulas_decorridas as number,
    concluido:       r.concluido as boolean,
    createdAt:       r.created_at as string,
  };
}

/** Lembretes ("lembra-me disto daqui a N aulas") deste aluno — avançam sozinhos via trigger em `presencas`. */
export function useLembretesAlunoQuery(alunoId?: string) {
  return useQuery({
    queryKey: ['lembretes-aluno', alunoId ?? ''],
    queryFn: async (): Promise<LembreteAluno[]> => {
      if (!isConfigured || !alunoId) return [];
      const { data, error } = await supabase
        .from('lembretes_aluno')
        .select('*')
        .eq('aluno_id', alunoId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapLembrete);
    },
    enabled: !!alunoId,
  });
}

export function useCriarLembreteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ alunoId, texto, aulasAlvo }: { alunoId: string; texto: string; aulasAlvo: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('lembretes_aluno').insert({
        aluno_id: alunoId,
        professor_id: user?.id,
        texto,
        aulas_alvo: aulasAlvo,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { alunoId }) => qc.invalidateQueries({ queryKey: ['lembretes-aluno', alunoId] }),
  });
}

export function useApagarLembreteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; alunoId: string }) => {
      const { error } = await supabase.from('lembretes_aluno').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, { alunoId }) => qc.invalidateQueries({ queryKey: ['lembretes-aluno', alunoId] }),
  });
}
