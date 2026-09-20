import { useQuery } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(id?: string): id is string {
  return !!id && UUID_RE.test(id);
}

export interface DiaFrequente {
  diaSemana: number; // 0=domingo..6=sábado (EXTRACT(DOW))
  total: number;
}

/** Em que dias da semana o aluno mais treina — via frequencia_dias_semana() (RLS do próprio caller). */
export function useDiasFrequentesQuery(alunoId?: string) {
  return useQuery({
    queryKey: ['analytics', 'dias-frequentes', alunoId ?? ''],
    queryFn: async (): Promise<DiaFrequente[]> => {
      if (!isConfigured || !alunoId) return [];
      const { data, error } = await supabase.rpc('frequencia_dias_semana', { p_aluno_id: alunoId });
      if (error) throw error;
      return (data ?? []).map((r: { dia_semana: number; total: number }) => ({ diaSemana: r.dia_semana, total: r.total }));
    },
    enabled: isUuid(alunoId),
  });
}

export interface AlunoAbaixoMeta {
  id: string;
  nome: string;
  faixa: string;
  frequencia: number;
  diasUltimos7: number;
}

/** Alunos ativos com menos de 2 dias de check-in nos últimos 7 dias — pull, sem cron. */
export function useAlunosAbaixoMetaQuery() {
  return useQuery({
    queryKey: ['analytics', 'abaixo-meta'],
    queryFn: async (): Promise<AlunoAbaixoMeta[]> => {
      if (!isConfigured) return [];
      const { data, error } = await supabase.from('v_alunos_abaixo_meta').select('*').order('nome');
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        nome: r.nome as string,
        faixa: r.faixa as string,
        frequencia: r.frequencia as number,
        diasUltimos7: r.dias_ultimos_7 as number,
      }));
    },
  });
}

export interface AlunoProximoGraduacao {
  id: string;
  nome: string;
  faixa: string;
  grau: number;
  frequencia: number;
  desde: string;
  mesesNoNivel: number;
  proximoEFaixa: boolean;
}

/** Alunos a aproximar-se do próximo grau/faixa — limiares em configuracoes.graduacao. */
export function useAlunosProximosGraduacaoQuery() {
  return useQuery({
    queryKey: ['analytics', 'proximos-graduacao'],
    queryFn: async (): Promise<AlunoProximoGraduacao[]> => {
      if (!isConfigured) return [];
      const { data, error } = await supabase.from('v_alunos_proximos_graduacao').select('*').order('meses_no_nivel', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        nome: r.nome as string,
        faixa: r.faixa as string,
        grau: r.grau as number,
        frequencia: r.frequencia as number,
        desde: r.desde as string,
        mesesNoNivel: Math.round(r.meses_no_nivel as number),
        proximoEFaixa: r.proximo_e_faixa as boolean,
      }));
    },
  });
}

export interface RankingEntry {
  nome: string;
  faixa: string;
  treinos: number;
}

/** Ranking por nº de treinos (check-ins a sério, não dias distintos como
 * a % pessoal) — SECURITY DEFINER, in-app para qualquer autenticado. */
export function useRankingFrequenciaQuery() {
  return useQuery({
    queryKey: ['analytics', 'ranking-treinos'],
    queryFn: async (): Promise<RankingEntry[]> => {
      if (!isConfigured) return [];
      const { data, error } = await supabase.rpc('ranking_treinos');
      if (error) throw error;
      return (data ?? []).map((r: { nome: string; faixa: string; treinos: number }) => ({
        nome: r.nome, faixa: r.faixa, treinos: r.treinos,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
