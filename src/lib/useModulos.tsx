/**
 * useModulos — Context that loads/saves module activation states.
 *
 * Module states are stored in `configuracoes` table:
 *   secao = 'modulos', dados = { checkin: true, comunicacao: false, ... }
 *
 * Any module not present in the dados object defaults to ENABLED (true),
 * ensuring backwards compatibility when new modules are added.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase, isConfigured } from './supabaseClient';

// ─── Module catalogue ─────────────────────────────────────────────────────────
export interface ModuleDef {
  id: string;
  label: string;
  icon: string;
  desc: string;
  category: 'staff' | 'aluno';
  /** Core modules cannot be disabled */
  core?: boolean;
}

export const MODULE_CATALOGUE: ModuleDef[] = [
  // ── Staff ──────────────────────────────────────────────────────────────────
  { id: 'checkin',       label: 'Check-in',        icon: '✓',  desc: 'Registo de presenças nas aulas',           category: 'staff' },
  { id: 'turmas',        label: 'Turmas',           icon: '▤',  desc: 'Gestão de turmas e horários',              category: 'staff' },
  { id: 'financeiro',    label: 'Financeiro',       icon: '€',  desc: 'Pagamentos, mensalidades e recibos',       category: 'staff' },
  { id: 'graduacao',     label: 'Graduação',        icon: '◈',  desc: 'Promoções de faixa e histórico',           category: 'staff' },
  { id: 'comunicacao',   label: 'Comunicação',      icon: '✉',  desc: 'Envio de mensagens para alunos',           category: 'staff' },
  { id: 'chat',          label: 'Chat',             icon: '💬', desc: 'Chat interno da equipa',                   category: 'staff' },
  { id: 'contratos',     label: 'Contratos',        icon: '◻',  desc: 'Gestão de contratos de matrícula',         category: 'staff' },
  { id: 'relatorios',    label: 'Relatórios',       icon: '↗',  desc: 'Relatórios e análises de negócio',         category: 'staff' },
  { id: 'integracoes',   label: 'Integrações',      icon: '⛓',  desc: 'TOConline, Stripe, WhatsApp Business',     category: 'staff' },
  { id: 'matricula',     label: 'Matrícula Online', icon: '🌐', desc: 'Fluxo de matrícula via link público',      category: 'staff' },
  { id: 'numerario',     label: 'Numerário',        icon: '💵', desc: 'Pedidos e aprovação de caixa',             category: 'staff' },
  // ── Aluno ──────────────────────────────────────────────────────────────────
  { id: 'minhas-aulas',  label: 'Minhas Aulas',     icon: '▤',  desc: 'Histórico de presenças do aluno',         category: 'aluno' },
  { id: 'evolucao',      label: 'Evolução',         icon: '◈',  desc: 'Progresso, faixa e graduações',            category: 'aluno' },
  { id: 'meu-financeiro',label: 'Financeiro',       icon: '€',  desc: 'Pagamentos e mensalidades do aluno',       category: 'aluno' },
  { id: 'conteudo',      label: 'Conteúdo',         icon: '▷',  desc: 'Vídeos e material de treino',              category: 'aluno' },
  { id: 'mensagens',     label: 'Mensagens',        icon: '✉',  desc: 'Mensagens recebidas da academia',          category: 'aluno' },
];

// Core modules that can never be disabled
export const CORE_MODULE_IDS = new Set([
  'dashboard', 'alunos', 'portal', 'config', 'perfil',
]);

// ─── Context ──────────────────────────────────────────────────────────────────
type ModulosState = Record<string, boolean>;

interface ModulosCtx {
  modulos:  ModulosState;
  loading:  boolean;
  isActive: (id: string) => boolean;
  toggle:   (id: string) => Promise<void>;
}

const ModulosContext = createContext<ModulosCtx>({
  modulos:  {},
  loading:  true,
  isActive: () => true,
  toggle:   async () => {},
});

export function ModulosProvider({ children }: { children: ReactNode }) {
  const [modulos, setModulos] = useState<ModulosState>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('configuracoes')
        .select('dados')
        .eq('secao', 'modulos')
        .maybeSingle();
      if (data?.dados && typeof data.dados === 'object') {
        setModulos(data.dados as ModulosState);
      }
    } catch {
      // silently fall through — all modules default to active
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription so disabling a module propagates to all open sessions
  useEffect(() => {
    if (!isConfigured) return;
    const channel = supabase
      .channel('modulos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'configuracoes', filter: "secao=eq.modulos" },
        (payload) => {
          const dados = (payload.new as any)?.dados;
          if (dados && typeof dados === 'object') {
            setModulos(dados as ModulosState);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /** A module is active if not explicitly set to false */
  const isActive = useCallback(
    (id: string) => CORE_MODULE_IDS.has(id) || modulos[id] !== false,
    [modulos]
  );

  /** Toggle a module on/off and persist immediately */
  const toggle = useCallback(async (id: string) => {
    if (CORE_MODULE_IDS.has(id)) return;

    const next = { ...modulos, [id]: modulos[id] === false ? true : false };
    setModulos(next); // optimistic

    if (!isConfigured) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('configuracoes')
        .upsert(
          { secao: 'modulos', dados: next, updated_at: new Date().toISOString(), updated_by: user?.id },
          { onConflict: 'secao' }
        );
    } catch {
      // revert on error
      setModulos(modulos);
    }
  }, [modulos]);

  return (
    <ModulosContext.Provider value={{ modulos, loading, isActive, toggle }}>
      {children}
    </ModulosContext.Provider>
  );
}

export function useModulos() {
  return useContext(ModulosContext);
}
