import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import { mapTurma } from '../lib/useData';
import type { Turma } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Vários hooks de useData.ts devolvem dados de demonstração (ids como
// "a1"/"t1") enquanto a query real ainda não resolveu. Sem esta guarda,
// um id assim chega a ser passado num .eq() e o Postgres rejeita com
// 400 "invalid input syntax for type uuid" — inofensivo mas ruidoso.
function isUuid(id?: string): id is string {
  return !!id && UUID_RE.test(id);
}

export const AULAS_QUERY_KEYS = {
  minhas: (professorId?: string) => ['aulas', 'professor', professorId ?? ''] as const,
  turmasDoProfessor: (professorId?: string) => ['turmas', 'professor', professorId ?? ''] as const,
  stats: (aulaId?: string) => ['aulas', 'stats', aulaId ?? ''] as const,
};

export interface Aula {
  id: string;
  turmaId: string;
  turmaNome: string;
  professorId: string | null;
  professorNome: string | null;
  data: string;
  horario: string | null;
  horaInicio: string | null;
  horaFim: string | null;
  sala: string | null;
  status: 'agendada' | 'em_curso' | 'concluida';
}

function mapAula(r: Record<string, unknown>): Aula {
  return {
    id:             r.id as string,
    turmaId:        r.turma_id as string,
    turmaNome:      r.turma_nome as string,
    professorId:    (r.professor_id as string) ?? null,
    professorNome:  (r.professor_nome as string) ?? null,
    data:           r.data as string,
    horario:        (r.horario as string) ?? null,
    horaInicio:     (r.hora_inicio as string) ?? null,
    horaFim:        (r.hora_fim as string) ?? null,
    sala:           (r.sala as string) ?? null,
    status:         (r.status as Aula['status']) ?? 'agendada',
  };
}

/** Todas as aulas da academia (qualquer professor), mais recentes primeiro — usado pela vista de gestão de professores. */
export function useTodasAulasQuery() {
  return useQuery({
    queryKey: ['aulas', 'todas'],
    queryFn: async (): Promise<Aula[]> => {
      if (!isConfigured) return [];
      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .order('data', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []).map(mapAula);
    },
  });
}

/** Aulas dadas por este professor (histórico + em curso), mais recentes primeiro. */
export function useMinhasAulasQuery(professorId?: string) {
  return useQuery({
    queryKey: AULAS_QUERY_KEYS.minhas(professorId),
    queryFn: async (): Promise<Aula[]> => {
      if (!isConfigured || !professorId) return [];
      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .eq('professor_id', professorId)
        .order('data', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []).map(mapAula);
    },
    enabled: isUuid(professorId),
  });
}

/** Turmas atribuídas a este professor (corrige "Minhas Turmas" mostrar a academia toda). */
export function useTurmasDoProfessorQuery(professorId?: string) {
  return useQuery({
    queryKey: AULAS_QUERY_KEYS.turmasDoProfessor(professorId),
    queryFn: async (): Promise<Turma[]> => {
      if (!isConfigured || !professorId) return [];
      const { data, error } = await supabase
        .from('turmas')
        .select('*')
        .eq('professor_id', professorId)
        .order('nome');
      if (error) throw error;
      return (data ?? []).map(mapTurma);
    },
    enabled: isUuid(professorId),
  });
}

/** Uma aula concreta pelo id — para a página de detalhe, que só recebe o id via navegação. */
export function useAulaQuery(aulaId?: string) {
  return useQuery({
    queryKey: ['aulas', 'detalhe', aulaId ?? ''],
    queryFn: async (): Promise<Aula | null> => {
      if (!isConfigured || !aulaId) return null;
      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();
      if (error) throw error;
      return data ? mapAula(data) : null;
    },
    enabled: isUuid(aulaId),
  });
}

export interface AulaAttendee {
  alunoId: string;
  nome: string;
  faixa: string;
  grau: number;
}

/** Presentes numa aula concreta, para estatísticas (contagem, distribuição de faixas). */
export function useAulaStatsQuery(aulaId?: string) {
  return useQuery({
    queryKey: AULAS_QUERY_KEYS.stats(aulaId),
    queryFn: async (): Promise<AulaAttendee[]> => {
      if (!isConfigured || !aulaId) return [];
      const { data, error } = await supabase
        .from('presencas')
        .select('aluno_id, alunos(nome, faixa, grau)')
        .eq('aula_id', aulaId);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<Record<string, unknown> & {
        alunos: { nome: string; faixa: string; grau: number } | null;
      }>;
      return rows.map(r => ({
        alunoId: r.aluno_id as string,
        nome:    r.alunos?.nome  ?? '',
        faixa:   r.alunos?.faixa ?? 'branca',
        grau:    r.alunos?.grau  ?? 0,
      }));
    },
    enabled: isUuid(aulaId),
  });
}

/** Total de presenças ligadas a aulas deste professor, desde o dia 1 do mês corrente. */
export function useCheckinsMesQuery(professorId?: string) {
  return useQuery({
    queryKey: ['aulas', 'checkins-mes', professorId ?? ''],
    queryFn: async (): Promise<number> => {
      if (!isConfigured || !professorId) return 0;
      const primeiroDoMes = new Date();
      primeiroDoMes.setDate(1);
      const desde = primeiroDoMes.toISOString().split('T')[0];

      const { data: aulasDoMes, error: aulasError } = await supabase
        .from('aulas')
        .select('id')
        .eq('professor_id', professorId)
        .gte('data', desde);
      if (aulasError) throw aulasError;
      const aulaIds = (aulasDoMes ?? []).map(a => a.id);
      if (aulaIds.length === 0) return 0;

      const { count, error } = await supabase
        .from('presencas')
        .select('id', { count: 'exact', head: true })
        .in('aula_id', aulaIds);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isUuid(professorId),
  });
}

export interface AlunoDaAula {
  id: string;
  faixa: string;
}

/** Alunos distintos que já passaram por alguma aula deste professor (para distribuição de faixas). */
export function useAlunosDasAulasQuery(professorId?: string) {
  return useQuery({
    queryKey: ['aulas', 'alunos', professorId ?? ''],
    queryFn: async (): Promise<AlunoDaAula[]> => {
      if (!isConfigured || !professorId) return [];
      const { data: aulasDoProf, error: aulasError } = await supabase
        .from('aulas')
        .select('id')
        .eq('professor_id', professorId);
      if (aulasError) throw aulasError;
      const aulaIds = (aulasDoProf ?? []).map(a => a.id);
      if (aulaIds.length === 0) return [];

      const { data, error } = await supabase
        .from('presencas')
        .select('aluno_id, alunos(id, faixa)')
        .in('aula_id', aulaIds);
      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<Record<string, unknown> & {
        alunos: { id: string; faixa: string } | null;
      }>;
      const seen = new Map<string, string>();
      for (const r of rows) {
        if (r.alunos?.id) seen.set(r.alunos.id, r.alunos.faixa);
      }
      return [...seen].map(([id, faixa]) => ({ id, faixa }));
    },
    enabled: isUuid(professorId),
  });
}

export interface AulaComContagem extends Aula {
  presentesCount: number;
}

/** Aulas que o professor efetivamente deu (exclui 'agendada' — nunca chegou a iniciar), mais recentes primeiro, com contagem de presentes. */
export function useMinhasAulasDadasQuery(professorId?: string) {
  return useQuery({
    queryKey: ['aulas', 'dadas', professorId ?? ''],
    queryFn: async (): Promise<AulaComContagem[]> => {
      if (!isConfigured || !professorId) return [];
      const { data, error } = await supabase
        .from('aulas')
        .select('*, presencas(count)')
        .eq('professor_id', professorId)
        .in('status', ['em_curso', 'concluida'])
        .order('data', { ascending: false })
        .order('hora_inicio', { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<Record<string, unknown> & { presencas: { count: number }[] }>;
      return rows.map(r => ({ ...mapAula(r), presentesCount: r.presencas?.[0]?.count ?? 0 }));
    },
    enabled: isUuid(professorId),
  });
}

export interface ResumoAulas {
  totalAulas: number;
  totalCheckins: number;
  mediaPessoas: number;
  faixaDistribuicao: Record<string, number>;
  generoDistribuicao: Record<string, number>;
  turmaMaisFrequente: { nome: string; count: number } | null;
}

const RESUMO_VAZIO: ResumoAulas = {
  totalAulas: 0, totalCheckins: 0, mediaPessoas: 0,
  faixaDistribuicao: {}, generoDistribuicao: {}, turmaMaisFrequente: null,
};

/**
 * Estatísticas agregadas das aulas do professor. Faixas/género são
 * ponderados por check-in (não por aluno único) — um aluno assíduo
 * pesa mais no "retrato típico da aula" do que um que veio uma vez.
 */
export function useAulasResumoQuery(professorId?: string) {
  return useQuery({
    queryKey: ['aulas', 'resumo', professorId ?? ''],
    queryFn: async (): Promise<ResumoAulas> => {
      if (!isConfigured || !professorId) return RESUMO_VAZIO;

      const { data: aulasDoProf, error: aulasError } = await supabase
        .from('aulas')
        .select('id, turma_nome')
        .eq('professor_id', professorId)
        .in('status', ['em_curso', 'concluida']);
      if (aulasError) throw aulasError;
      const aulas = aulasDoProf ?? [];
      const totalAulas = aulas.length;
      if (totalAulas === 0) return RESUMO_VAZIO;
      const aulaIds = aulas.map(a => a.id);

      const { data, error } = await supabase
        .from('presencas')
        .select('aluno_id, alunos(faixa, genero)')
        .in('aula_id', aulaIds);
      if (error) throw error;
      const rows = (data ?? []) as unknown as Array<Record<string, unknown> & {
        alunos: { faixa: string; genero: string | null } | null;
      }>;

      const faixaDistribuicao: Record<string, number> = {};
      const generoDistribuicao: Record<string, number> = {};
      for (const r of rows) {
        const faixa = r.alunos?.faixa;
        if (faixa) faixaDistribuicao[faixa] = (faixaDistribuicao[faixa] ?? 0) + 1;
        const genero = r.alunos?.genero;
        if (genero) generoDistribuicao[genero] = (generoDistribuicao[genero] ?? 0) + 1;
      }

      const porTurma = new Map<string, number>();
      for (const a of aulas) porTurma.set(a.turma_nome, (porTurma.get(a.turma_nome) ?? 0) + 1);
      let turmaMaisFrequente: ResumoAulas['turmaMaisFrequente'] = null;
      for (const [nome, count] of porTurma) {
        if (!turmaMaisFrequente || count > turmaMaisFrequente.count) turmaMaisFrequente = { nome, count };
      }

      return {
        totalAulas,
        totalCheckins: rows.length,
        mediaPessoas: Math.round((rows.length / totalAulas) * 10) / 10,
        faixaDistribuicao,
        generoDistribuicao,
        turmaMaisFrequente,
      };
    },
    enabled: isUuid(professorId),
  });
}

export interface AlunoResumo {
  id: string;
  nome: string;
  faixa: string;
  grau: number;
}

/** Alunos distintos que frequentaram esta turma nos últimos 60 dias (substitui a "inscrição" — nunca refletiu a realidade). */
export function useAlunosDaTurmaQuery(turmaId?: string) {
  return useQuery({
    queryKey: ['turmas', 'alunos', turmaId ?? ''],
    queryFn: async (): Promise<AlunoResumo[]> => {
      if (!isConfigured || !turmaId) return [];
      const desde = new Date();
      desde.setDate(desde.getDate() - 60);
      const desdeStr = desde.toISOString().split('T')[0];

      const { data: aulasDaTurma, error: aulasError } = await supabase
        .from('aulas')
        .select('id')
        .eq('turma_id', turmaId)
        .gte('data', desdeStr);
      if (aulasError) throw aulasError;
      const aulaIds = (aulasDaTurma ?? []).map(a => a.id);
      if (aulaIds.length === 0) return [];

      const { data, error } = await supabase
        .from('presencas')
        .select('aluno_id, alunos(id, nome, faixa, grau)')
        .in('aula_id', aulaIds);
      if (error) throw error;

      const rows = (data ?? []) as unknown as Array<Record<string, unknown> & {
        alunos: { id: string; nome: string; faixa: string; grau: number } | null;
      }>;
      const seen = new Map<string, AlunoResumo>();
      for (const r of rows) {
        if (r.alunos?.id) seen.set(r.alunos.id, { id: r.alunos.id, nome: r.alunos.nome, faixa: r.alunos.faixa, grau: r.alunos.grau ?? 0 });
      }
      return [...seen.values()];
    },
    enabled: isUuid(turmaId),
  });
}

/** Turmas distintas que este aluno frequentou recentemente, via histórico de presenças (substitui a "inscrição"). */
export function useTurmasDoAlunoQuery(alunoId?: string) {
  return useQuery({
    queryKey: ['alunos', 'turmas', alunoId ?? ''],
    queryFn: async (): Promise<Turma[]> => {
      if (!isConfigured || !alunoId) return [];
      const { data, error } = await supabase
        .from('presencas')
        .select('turma_id')
        .eq('aluno_id', alunoId)
        .not('turma_id', 'is', null)
        .order('data', { ascending: false })
        .limit(50);
      if (error) throw error;
      const turmaIds = [...new Set((data ?? []).map(r => r.turma_id as string))];
      if (turmaIds.length === 0) return [];

      const { data: turmasData, error: turmasError } = await supabase
        .from('turmas')
        .select('*')
        .in('id', turmaIds);
      if (turmasError) throw turmasError;
      return (turmasData ?? []).map(mapTurma);
    },
    enabled: isUuid(alunoId),
  });
}

export function useIniciarAulaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ turmaId, data }: { turmaId: string; data: string }): Promise<string> => {
      const { data: aulaId, error } = await supabase.rpc('iniciar_aula', { p_turma_id: turmaId, p_data: data });
      if (error) throw error;
      return aulaId as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aulas'] }),
  });
}

export function useConcluirAulaMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (aulaId: string): Promise<void> => {
      const { error } = await supabase.rpc('concluir_aula', { p_aula_id: aulaId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aulas'] }),
  });
}
