import { useEffect, useMemo, useState } from 'react';
import { Ico, ClockIcon, MapPinIcon, UserIcon } from '../../lib/icons';
import Modal from '../common/Modal';
import type { Presenca } from '../../types';

interface CalendarioPresencasProps {
  presencas: Presenca[];
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_JANELA = 371; // ~53 semanas, como o calendário de contribuições do GitHub
const SEMANAS_MOBILE = 13; // ~3 meses

/** Data local em "YYYY-MM-DD" — nunca `toISOString()` aqui: converte para UTC
 * e desalinha o dia em qualquer fuso horário à frente de UTC (ex.: Lisboa
 * no horário de verão), fazendo o dia de hoje desaparecer da grelha. */
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Segunda-feira da semana de `d` (semana começa à segunda, como o resto da app). */
function segundaAnterior(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  return r;
}

function corCelula(n: number): string {
  if (n >= 2) return 'var(--gb-green)';
  if (n === 1) return 'color-mix(in srgb, var(--gb-green) 50%, white)';
  return 'var(--bg-elevated)';
}

/**
 * Grelha de presenças estilo GitHub: uma célula por dia dos últimos ~12 meses,
 * cor = nº de aulas nesse dia. Clicar num dia com aula(s) abre o detalhe
 * (turma, hora, professor, sala). Puramente apresentacional — recebe as
 * presenças já carregadas pelo chamador (usePresencas).
 */
export default function CalendarioPresencas({ presencas }: CalendarioPresencasProps) {
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  // Mesmo breakpoint/padrão do menu mobile (Layout.tsx): 3 meses no
  // telemóvel, 12 no PC. Colunas em CSS grid (1fr) esticam para preencher a
  // largura disponível em qualquer um dos casos — nunca scroll horizontal.
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const porDia = useMemo(() => {
    const map = new Map<string, Presenca[]>();
    for (const p of presencas) {
      const lista = map.get(p.data);
      if (lista) lista.push(p);
      else map.set(p.data, [p]);
    }
    return map;
  }, [presencas]);

  const semanas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicio = segundaAnterior(new Date(hoje.getTime() - DIAS_JANELA * 86400000));
    const dias: { data: string; mes: number }[] = [];
    for (const d = new Date(inicio); d <= hoje; d.setDate(d.getDate() + 1)) {
      dias.push({ data: toISODate(d), mes: d.getMonth() });
    }
    const grupos: { data: string; mes: number }[][] = [];
    for (let i = 0; i < dias.length; i += 7) grupos.push(dias.slice(i, i + 7));
    return grupos;
  }, []);

  const semanasVisiveisArr = useMemo(
    () => (isMobile ? semanas.slice(-SEMANAS_MOBILE) : semanas),
    [semanas, isMobile],
  );
  const detalhe = diaSelecionado ? porDia.get(diaSelecionado) ?? [] : [];

  return (
    <>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${semanasVisiveisArr.length}, minmax(0, 1fr))` }}
      >
        {semanasVisiveisArr.map((semana, i) => {
          const mesAnterior = i > 0 ? semanasVisiveisArr[i - 1][0].mes : null;
          return (
            <div key={semana[0].data} className="flex flex-col gap-[3px]">
              <div className="h-3.5 text-[9.5px] font-semibold text-muted">
                {semana[0].mes !== mesAnterior ? MESES[semana[0].mes] : ''}
              </div>
              {semana.map((dia) => {
                const lista = porDia.get(dia.data);
                const n = lista?.length ?? 0;
                return (
                  <button
                    key={dia.data}
                    type="button"
                    onClick={() => { if (n > 0) setDiaSelecionado(dia.data); }}
                    title={n > 0 ? `${dia.data} · ${n} aula${n > 1 ? 's' : ''}` : dia.data}
                    className={[
                      'block w-full h-2.5 rounded-[2px] border-none p-0 outline-none',
                      n > 0 ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-gb-red' : 'cursor-default',
                    ].join(' ')}
                    style={{ background: corCelula(n) }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 items-center mt-2 text-[10.5px] text-muted">
        <span className="inline-flex gap-1.5 items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-elevated" />Sem treino
        </span>
        <span className="inline-flex gap-1.5 items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px]" style={{ background: 'color-mix(in srgb, var(--gb-green) 50%, white)' }} />1 aula
        </span>
        <span className="inline-flex gap-1.5 items-center">
          <span className="inline-block w-2.5 h-2.5 rounded-[2px] bg-gb-green" />2+ aulas
        </span>
      </div>

      {diaSelecionado && (
        <Modal
          onClose={() => setDiaSelecionado(null)}
          eyebrow={diaSelecionado}
          title={`${detalhe.length} aula${detalhe.length > 1 ? 's' : ''}`}
        >
          <div className="flex flex-col gap-2.5">
            {detalhe.map((p) => (
              <div key={p.id} className="p-3 rounded-md border border-border bg-elevated">
                <div className="text-[13px] font-bold text-primary">{p.turmaNome || 'Treino livre'}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mt-1.5 text-[12px] text-secondary">
                  <span className="inline-flex gap-1.5 items-center"><Ico icon={ClockIcon} sm />{p.hora}</span>
                  {p.professorNome && (
                    <span className="inline-flex gap-1.5 items-center"><Ico icon={UserIcon} sm />{p.professorNome}</span>
                  )}
                  {p.sala && (
                    <span className="inline-flex gap-1.5 items-center"><Ico icon={MapPinIcon} sm />{p.sala}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
