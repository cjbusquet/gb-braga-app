/**
 * Idade e categorias etárias de competição (padrão IBJJF), com os
 * limiares configuráveis via `configuracoes` (secao 'categorias_idade')
 * em vez de fixos no código — ver useConfiguracaoSecaoQuery.
 */

export function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

export function eMenor(dataNasc: string): boolean {
  const idade = calcularIdade(dataNasc);
  return idade !== null && idade < 18;
}

export function podeCheckinAutonomo(dataNasc: string): boolean {
  const idade = calcularIdade(dataNasc);
  return idade !== null && idade >= 12 && idade < 18;
}

export type CategoriaIdade =
  | 'crianca' | 'juvenil' | 'adulto'
  | 'master1' | 'master2' | 'master3' | 'master4' | 'master5' | 'master6' | 'master7';

export const CATEGORIA_IDADE_LABEL: Record<CategoriaIdade, string> = {
  crianca: 'Criança', juvenil: 'Juvenil', adulto: 'Adulto',
  master1: 'Master 1', master2: 'Master 2', master3: 'Master 3', master4: 'Master 4',
  master5: 'Master 5', master6: 'Master 6', master7: 'Master 7',
};

/** Limiares por omissão (IBJJF) — sobrepostos por configuracoes.categorias_idade. */
export const CATEGORIA_IDADE_DEFAULT: Record<Exclude<CategoriaIdade, 'crianca'>, number> = {
  juvenil: 16, adulto: 18,
  master1: 30, master2: 36, master3: 41, master4: 46, master5: 51, master6: 56, master7: 61,
};

// Ordem crescente por idade mínima — quem não atinge o primeiro
// limiar (juvenil) fica em "crianca".
const ORDEM: Exclude<CategoriaIdade, 'crianca'>[] =
  ['juvenil', 'adulto', 'master1', 'master2', 'master3', 'master4', 'master5', 'master6', 'master7'];

export function calcularCategoriaIdade(
  dataNasc: string,
  limiares: Partial<Record<string, number>> = {},
): CategoriaIdade | null {
  const idade = calcularIdade(dataNasc);
  if (idade === null) return null;

  let categoria: CategoriaIdade = 'crianca';
  for (const cat of ORDEM) {
    const limiar = limiares[cat] ?? CATEGORIA_IDADE_DEFAULT[cat];
    if (idade >= limiar) categoria = cat;
  }
  return categoria;
}
