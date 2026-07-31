import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';
import { db } from '../lib/useData';

export const PEDIDOS_NUMERARIO_QUERY_KEYS = {
  list: () => ['pedidos_numerario', 'list'] as const,
};

export interface PedidoNumerario {
  id: string;
  nomeAluno: string;
  email: string;
  telefone: string;
  plano: string;
  valor: number;
  dataPedido: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  notaAdmin?: string;
}

function mapPedido(r: Record<string, unknown>): PedidoNumerario {
  return {
    id: r.id as string,
    nomeAluno: (r.nome_aluno as string) ?? '',
    email: (r.email as string) ?? '',
    telefone: (r.telefone as string) ?? '',
    plano: (r.plano_nome as string) ?? '',
    valor: (r.valor as number) ?? 0,
    dataPedido: r.created_at ? (r.created_at as string).slice(0, 10) : '',
    status: (r.status as PedidoNumerario['status']) ?? 'pendente',
    notaAdmin: (r.nota_admin as string) ?? undefined,
  };
}

async function fetchPedidosNumerario(): Promise<PedidoNumerario[]> {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from('pedidos_numerario')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPedido);
}

export function usePedidosNumerarioQuery(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PEDIDOS_NUMERARIO_QUERY_KEYS.list(),
    queryFn: fetchPedidosNumerario,
    enabled: opts?.enabled ?? true,
  });
}

export function useAprovarNumerario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nota }: { id: string; nota: string }) =>
      db.aprovarNumerario(id, nota),
    onSuccess: () => qc.invalidateQueries({ queryKey: PEDIDOS_NUMERARIO_QUERY_KEYS.list() }),
  });
}

export function useRejeitarNumerario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nota }: { id: string; nota: string }) =>
      db.rejeitarNumerario(id, nota),
    onSuccess: () => qc.invalidateQueries({ queryKey: PEDIDOS_NUMERARIO_QUERY_KEYS.list() }),
  });
}
