import { useQuery } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import type { Belt } from '../types';

export const ALUNO_INFO_QUERY_KEYS = {
  byEmail: (email: string) => ['alunos', 'info', email] as const,
};

export interface AlunoInfo {
  id: string;
  faixa: Belt;
  grau: number;
  plano: string;
  data_matricula: string;
  status: string;
}

async function fetchAlunoInfoByEmail(email: string): Promise<AlunoInfo | null> {
  if (!isConfigured) return null;
  // alunos has no "plano" column — the plan name is stored as plano_nome.
  const { data, error } = await supabase
    .from('alunos')
    .select('id, faixa, grau, plano_nome, data_matricula, status')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { plano_nome, ...rest } = data;
  return { ...rest, plano: plano_nome ?? '' } as AlunoInfo;
}

/** The logged-in aluno's belt/plan/matrícula summary, by profile email. */
export function useAlunoInfoByEmailQuery(email: string | undefined) {
  return useQuery({
    queryKey: ALUNO_INFO_QUERY_KEYS.byEmail(email ?? ''),
    queryFn: () => fetchAlunoInfoByEmail(email as string),
    enabled: !!email,
  });
}
