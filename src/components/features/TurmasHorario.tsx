/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components */
import { useMemo, useState } from 'react';
import { GB } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';

// Extraído de TurmasPage.tsx (admin) para ser partilhado com a vista
// read-only do aluno (MinhasAulas.tsx) — mesma grelha semanal, sem as
// ações de gestão (editar/apagar/ver alunos que só fazem sentido para staff).

export const DIAS_LABEL: Record<string, string> = {
  segunda: 'SEG', terça: 'TER', quarta: 'QUA',
  quinta:  'QUI', sexta: 'SEX', sábado: 'SÁB', domingo: 'DOM',
};
export const DIAS_ORDER = ['segunda','terça','quarta','quinta','sexta','sábado'];

/** Datas (DD/MM) de segunda a sábado da semana corrente, para mostrar junto aos rótulos SEG/TER/... */
export function datasDaSemanaAtual(): Record<string, string> {
  const hoje = new Date();
  const offsetParaSegunda = hoje.getDay() === 0 ? -6 : 1 - hoje.getDay();
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + offsetParaSegunda);

  const out: Record<string, string> = {};
  DIAS_ORDER.forEach((dia, i) => {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    out[dia] = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  });
  return out;
}

export function TurmasLegend({ turmas }: { turmas: any[] }) {
  const unique = useMemo(() => {
    const seen = new Map<string, any>();
    for (const t of turmas) {
      const prefix = t.nome.replace(/\s*[([-].*/, '').trim();
      if (!seen.has(prefix)) seen.set(prefix, t);
    }
    return [...seen.entries()];
  }, [turmas]);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {unique.map(([label, t]) => (
        <div
          key={label}
          className="flex gap-1.5 items-center py-1 px-2.5 rounded-full border bg-elevated"
          style={{ borderColor: `${(t as any).cor || 'var(--border)'}44` }}
        >
          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: (t as any).cor || '#888' }}/>
          <span className="text-[11.5px] font-semibold text-secondary">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function TurmasCalendarView({ turmas, onSelect, filtroTipo = 'all' }: {
  turmas: any[];
  onSelect?: (t: any) => void;
  filtroTipo?: string;
}) {
  const { isMobile } = useMobile();
  const [diaAtivo, setDiaAtivo] = useState(DIAS_ORDER[0]);
  const datasSemana = useMemo(() => datasDaSemanaAtual(), []);

  const filtered = filtroTipo === 'all' ? turmas : turmas.filter((t: any) => t.tipo === filtroTipo);

  // Build schedule map: { dia: { horario: turma[] } }
  const schedule = useMemo(() => {
    const map: Record<string, Record<string, any[]>> = {};
    for (const dia of DIAS_ORDER) map[dia] = {};
    for (const t of filtered) {
      const dias = Array.isArray(t.diaSemana) ? t.diaSemana : [];
      for (const dia of dias) {
        const key = dia.toLowerCase();
        if (!map[key]) map[key] = {};
        if (!map[key][t.horario]) map[key][t.horario] = [];
        map[key][t.horario].push(t);
      }
    }
    return map;
  }, [filtered]);

  // Sorted unique time slots
  const times = useMemo(() => {
    const all = new Set<string>();
    for (const t of filtered) all.add(t.horario);
    return [...all].sort();
  }, [filtered]);

  // ── Turma block ──────────────────────────────────────────────────────────────
  const TurmaBlock = ({ t }: { t: any }) => {
    const cor = t.cor || GB.red;
    const conteudo = (
      <>
        <div
          className={['overflow-hidden font-extrabold leading-tight whitespace-nowrap text-ellipsis', isMobile ? 'text-[10.5px]' : 'text-[11px]'].join(' ')}
          style={{ color: cor }}
        >
          {t.nome}
        </div>
        {t.professorNome && (
          <div className="overflow-hidden mt-0.5 text-[9.5px] font-semibold whitespace-nowrap text-ellipsis text-secondary">{t.professorNome}</div>
        )}
        {t.sala && (
          <div className="overflow-hidden mt-0.5 text-[9.5px] whitespace-nowrap text-ellipsis text-muted">{t.sala}</div>
        )}
      </>
    );
    if (!onSelect) {
      return (
        <div className="p-1.5 mb-1 w-full min-w-0 text-left rounded" style={{ background: `${cor}18`, border: `1.5px solid ${cor}` }}>
          {conteudo}
        </div>
      );
    }
    return (
      <button
        onClick={() => onSelect(t)}
        className="p-1.5 mb-1 w-full min-w-0 text-left rounded cursor-pointer transition-opacity duration-200 hover:opacity-80 active:opacity-80 outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-1"
        style={{ background: `${cor}18`, border: `1.5px solid ${cor}` }}
      >
        {conteudo}
      </button>
    );
  };

  // ── MOBILE: day tabs + vertical list ────────────────────────────────────────
  if (isMobile) {
    const diasComAulas = DIAS_ORDER.filter(d => Object.keys(schedule[d] || {}).length > 0);
    return (
      <div>
        {/* Day tabs */}
        <div className="flex overflow-x-auto gap-0 mb-3.5 border-b border-border [scrollbar-width:none]">
          {diasComAulas.map(d => (
            <button key={d} onClick={() => setDiaAtivo(d)}
              className={[
                'flex-none py-2 px-3.5 min-h-11 bg-none border-none border-b-2 text-[12.5px] cursor-pointer transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                diaAtivo === d ? 'font-bold border-gb-red text-gb-red' : 'font-normal border-transparent text-muted hover:text-primary active:text-primary',
              ].join(' ')}>
              {DIAS_LABEL[d]} <span className="text-[10.5px] font-normal opacity-70">{datasSemana[d]}</span>
            </button>
          ))}
        </div>

        {/* Time slots for selected day */}
        <div>
          {times.map(hora => {
            const aulas = schedule[diaAtivo]?.[hora] ?? [];
            if (aulas.length === 0) return null;
            return (
              <div key={hora} className="flex gap-3 items-start mb-2">
                <div className="pt-1.5 min-w-9 text-xs font-bold text-muted">{hora}</div>
                <div className="flex-1">
                  {aulas.map((t: any) => <TurmaBlock key={t.id} t={t} />)}
                </div>
              </div>
            );
          })}
          {times.every(h => !schedule[diaAtivo]?.[h]?.length) && (
            <div className="py-8 text-[13px] text-center text-muted">
              Sem aulas neste dia
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP: full week grid ──────────────────────────────────────────────────
  const dias = DIAS_ORDER.filter(d => Object.keys(schedule[d] || {}).length > 0);
  const COL_W = 148;
  const TIME_W = 52;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div style={{ minWidth: TIME_W + dias.length * COL_W }}>

        {/* Header row */}
        <div className="flex border-b border-border bg-elevated">
          <div style={{ width: TIME_W }} className="shrink-0 py-2.5 px-2 border-r border-border" />
          {dias.map(d => (
            <div key={d} style={{ width: COL_W }} className="shrink-0 py-2.5 px-2 text-center border-r border-border">
              <div className="text-xs font-extrabold tracking-[0.5px] text-primary">{DIAS_LABEL[d]}</div>
              <div className="mt-0.5 text-[10px] font-normal text-muted">{datasSemana[d]}</div>
            </div>
          ))}
        </div>

        {/* Time rows */}
        {times.map((hora, idx) => (
          <div key={hora} className={['flex border-b border-border-subtle', idx % 2 === 0 ? 'bg-card' : 'bg-base'].join(' ')}>
            {/* Time label */}
            <div style={{ width: TIME_W }} className="shrink-0 py-2.5 px-2 text-xs font-bold leading-tight text-center border-r border-border text-muted">
              {hora}
            </div>

            {/* Day cells */}
            {dias.map(d => {
              const aulas = schedule[d]?.[hora] ?? [];
              return (
                <div
                  key={d}
                  style={{ width: COL_W, minHeight: aulas.length ? 'auto' : 36 }}
                  className="p-1.5 shrink-0 border-r border-border-subtle"
                >
                  {aulas.map((t: any) => <TurmaBlock key={t.id} t={t} />)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
