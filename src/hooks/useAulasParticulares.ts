import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(id?: string): id is string {
  return !!id && UUID_RE.test(id);
}

export interface AulaParticularAluno {
  id: string;
  nome: string;
}

export interface AulaParticular {
  id: string;
  professorId: string;
  professorNome: string;
  ajudanteId: string | null;
  ajudanteNome: string | null;
  ajudanteTipo: 'professor' | 'aluno' | null;
  data: string;
  horaInicio: string;
  horaFim: string | null;
  sala: string | null;
  observacoes: string | null;
  status: 'agendada' | 'concluida' | 'cancelada';
  alunos: AulaParticularAluno[];
}

/** Postgres devolve TIME como "18:00:00" — a UI só precisa de HH:MM. */
function hhmm(t: unknown): string {
  return typeof t === 'string' ? t.slice(0, 5) : '';
}

function mapAulaParticular(r: Record<string, unknown>): AulaParticular {
  const alunos = (r.aulas_particulares_alunos as Array<{ aluno_id: string; aluno_nome: string }> | null) ?? [];
  return {
    id:             r.id as string,
    professorId:    r.professor_id as string,
    professorNome:  r.professor_nome as string,
    ajudanteId:     (r.ajudante_id as string) ?? null,
    ajudanteNome:   (r.ajudante_nome as string) ?? null,
    ajudanteTipo:   (r.ajudante_tipo as 'professor' | 'aluno') ?? null,
    data:           r.data as string,
    horaInicio:     hhmm(r.hora_inicio),
    horaFim:        r.hora_fim ? hhmm(r.hora_fim) : null,
    sala:           (r.sala as string) ?? null,
    observacoes:    (r.observacoes as string) ?? null,
    status:         r.status as AulaParticular['status'],
    alunos:         alunos.map(a => ({ id: a.aluno_id, nome: a.aluno_nome })),
  };
}

const SELECT_COM_ALUNOS = '*, aulas_particulares_alunos(aluno_id, aluno_nome)';

/** Aulas particulares do professor (como titular ou como ajudante). */
export function useAulasParticularesQuery(profileId?: string) {
  return useQuery({
    queryKey: ['aulas-particulares', 'professor', profileId ?? ''],
    queryFn: async (): Promise<AulaParticular[]> => {
      if (!isConfigured || !profileId) return [];
      const { data, error } = await supabase
        .from('aulas_particulares')
        .select(SELECT_COM_ALUNOS)
        .or(`professor_id.eq.${profileId},ajudante_id.eq.${profileId}`)
        .order('data', { ascending: true })
        .order('hora_inicio', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapAulaParticular);
    },
    enabled: isUuid(profileId),
  });
}

/**
 * Aulas particulares do lado do aluno — como participante (junção) ou
 * como ajudante (aulas_particulares.ajudante_id aponta ao seu profile_id,
 * não ao seu aluno_id, por isso recebe os dois ids).
 */
export function useAulasParticularesDoAlunoQuery(alunoId?: string, profileId?: string) {
  return useQuery({
    queryKey: ['aulas-particulares', 'aluno', alunoId ?? '', profileId ?? ''],
    queryFn: async (): Promise<AulaParticular[]> => {
      if (!isConfigured || (!alunoId && !profileId)) return [];

      let idsComoParticipante: string[] = [];
      if (alunoId) {
        const { data, error } = await supabase
          .from('aulas_particulares_alunos')
          .select('aula_particular_id')
          .eq('aluno_id', alunoId);
        if (error) throw error;
        idsComoParticipante = (data ?? []).map(r => r.aula_particular_id as string);
      }

      const filtro = [
        idsComoParticipante.length > 0 ? `id.in.(${idsComoParticipante.join(',')})` : null,
        profileId ? `ajudante_id.eq.${profileId}` : null,
      ].filter(Boolean).join(',');
      if (!filtro) return [];

      const { data, error } = await supabase
        .from('aulas_particulares')
        .select(SELECT_COM_ALUNOS)
        .or(filtro);
      if (error) throw error;

      const porId = new Map<string, Record<string, unknown>>();
      for (const r of (data ?? []) as unknown as Record<string, unknown>[]) porId.set(r.id as string, r);
      return Array.from(porId.values())
        .map(mapAulaParticular)
        .sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
    },
    enabled: isUuid(alunoId) || isUuid(profileId),
  });
}

export interface CriarAulaParticularInput {
  data: string;
  horaInicio: string;
  horaFim: string | null;
  sala: string | null;
  observacoes: string | null;
  ajudanteId: string | null;
  alunoIds: string[];
}

export function useCriarAulaParticularMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CriarAulaParticularInput): Promise<string> => {
      const { data, error } = await supabase.rpc('criar_aula_particular', {
        p_data: input.data,
        p_hora_inicio: input.horaInicio,
        p_hora_fim: input.horaFim,
        p_sala: input.sala,
        p_observacoes: input.observacoes,
        p_ajudante_id: input.ajudanteId,
        p_aluno_ids: input.alunoIds,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aulas-particulares'] }),
  });
}

export interface AlunoComProfile {
  id: string;
  profileId: string;
  nome: string;
}

/**
 * Alunos com conta ligada (profile_id não nulo) — só estes podem ser
 * escolhidos como ajudante, já que `ajudante_id` aponta para `profiles`,
 * não para `alunos`. Alunos sem conta ainda não têm como receber a
 * notificação nem ver a marcação em "Minhas Aulas".
 */
export function useAlunosComProfileQuery() {
  return useQuery({
    queryKey: ['alunos', 'com-profile'],
    queryFn: async (): Promise<AlunoComProfile[]> => {
      if (!isConfigured) return [];
      const { data, error } = await supabase
        .from('alunos')
        .select('id, profile_id, nome')
        .eq('status', 'ativo')
        .not('profile_id', 'is', null)
        .order('nome');
      if (error) throw error;
      return (data ?? []).map(r => ({ id: r.id as string, profileId: r.profile_id as string, nome: r.nome as string }));
    },
  });
}

export function useAtualizarAulaParticularMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AulaParticular['status'] }) => {
      const { error } = await supabase.from('aulas_particulares').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aulas-particulares'] }),
  });
}
