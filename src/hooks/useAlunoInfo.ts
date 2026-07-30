import { useQuery } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import type { Belt } from '../types';

export const ALUNO_INFO_QUERY_KEYS = {
  byEmail: (email: string) => ['alunos', 'info', email] as const,
};

export interface AlunoInfo {
  faixa: Belt;
  grau: number;
  plano: string;
  data_matricula: string;
  status: string;
}

async function fetchAlunoInfoByEmail(email: string): Promise<AlunoInfo | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('alunos')
    .select('faixa, grau, plano, data_matricula, status')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return (data as AlunoInfo | null) ?? null;
}

/** The logged-in aluno's belt/plan/matrícula summary, by profile email. */
export function useAlunoInfoByEmailQuery(email: string | undefined) {
  return useQuery({
    queryKey: ALUNO_INFO_QUERY_KEYS.byEmail(email ?? ''),
    queryFn: () => fetchAlunoInfoByEmail(email as string),
    enabled: !!email,
  });
}
