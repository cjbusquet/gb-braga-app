import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isConfigured } from '../lib/supabaseClient';

export const CONFIGURACOES_QUERY_KEYS = {
  secao: (secao: string) => ['configuracoes', secao] as const,
};

async function fetchConfiguracaoSecao(
  secao: string,
): Promise<Record<string, unknown> | null> {
  if (!isConfigured) return null;
  const { data, error } = await supabase
    .from('configuracoes')
    .select('dados')
    .eq('secao', secao)
    .maybeSingle();
  if (error) throw error;
  return (data?.dados as Record<string, unknown> | undefined) ?? null;
}

/** Read-only query for a `configuracoes` section's raw `dados` JSON (null if unset). */
export function useConfiguracaoSecaoQuery(secao: string) {
  return useQuery({
    queryKey: CONFIGURACOES_QUERY_KEYS.secao(secao),
    queryFn: () => fetchConfiguracaoSecao(secao),
    staleTime: 5 * 60 * 1000,
  });
}

interface SaveConfiguracaoInput<T> {
  secao: string;
  dados: T;
}

/** Upserts a `configuracoes` section and invalidates its cached query. */
export function useSaveConfiguracaoSecao<T extends object>() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ secao, dados }: SaveConfiguracaoInput<T>) => {
      if (!isConfigured) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from('configuracoes').upsert(
        { secao, dados, updated_at: new Date().toISOString(), updated_by: user?.id },
        { onConflict: 'secao' },
      );
      if (error) throw error;
    },
    onSuccess: (_data, { secao }) => {
      qc.invalidateQueries({ queryKey: CONFIGURACOES_QUERY_KEYS.secao(secao) });
    },
  });
}

/**
 * Form-friendly wrapper used by config screens: merges `defaults` with the
 * persisted section, keeps an editable local draft, and exposes `save()` to
 * upsert it. Mirrors the shape the old inline `useConfig` hook exposed so
 * existing forms can switch over with no further changes.
 */
export function useConfiguracaoSection<T extends object>(secao: string, defaults: T) {
  const { data: remote, isLoading, error } = useConfiguracaoSecaoQuery(secao);
  const saveMutation = useSaveConfiguracaoSecao<T>();
  const [draft, setDraft] = useState<T>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (remote && typeof remote === 'object') {
      setDraft((prev) => ({ ...prev, ...(remote as Partial<T>) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  const save = async (override?: T) => {
    const toSave = override ?? draft;
    await saveMutation.mutateAsync({ secao, dados: toSave });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return {
    data: draft,
    setData: setDraft,
    loading: isLoading,
    error,
    saving: saveMutation.isPending,
    saved,
    save,
  };
}
