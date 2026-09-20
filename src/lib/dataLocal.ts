/**
 * Data local em yyyy-mm-dd — nunca `.toISOString()` para isto: converte
 * para UTC e desloca um dia em fusos à frente de UTC (ex.: WEST), fazendo
 * cabeçalhos de dia (e datas gravadas na BD) apontarem para o dia errado.
 * Bug real encontrado e corrigido em AgendaPage.tsx nesta sessão.
 */
export function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** "Sexta-feira, 12 de setembro" a partir de uma data yyyy-mm-dd. */
export function formatarDia(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const s = d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
