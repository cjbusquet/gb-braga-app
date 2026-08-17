import { useState } from 'react';
import { useProfessores, useProfessorCheckins } from '../../lib/useData';
import { beltConfig } from '../../lib/gbBrand';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import BeltBadge from '../../components/common/BeltBadge';
import PageHeader from '../../components/common/PageHeader';

function duracao(inicio: string, fim?: string): string {
  if (!fim) return '—';
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  const min = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (min <= 0) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`;
}

function EstadoBadge({ ativa }: { ativa: boolean }) {
  return ativa
    ? <Badge color="success">● Ativa</Badge>
    : <Badge color="neutral">Concluída</Badge>;
}

const TH_CLASS = 'py-2.5 px-3.5 text-[10.5px] font-semibold text-left uppercase whitespace-nowrap text-muted';
const TD_CLASS = 'py-2.5 px-3.5';

export default function ProfessoresPage() {
  const { data: professores } = useProfessores();
  const { data: todosCheckins } = useProfessorCheckins();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = professores.find(p => p.id === selectedId);
  const checkinsProfSel = todosCheckins.filter(c => c.professorId === selectedId);

  const hoje = new Date().toISOString().split('T')[0];
  const checkinsHoje = todosCheckins.filter(c => c.data === hoje);
  const ativos = todosCheckins.filter(c => c.status === 'ativa');

  return (
    <div>
      <PageHeader
        eyebrow="Gestão de Professores"
        title="Professores"
        subtitle={`${professores.length} professores · ${checkinsHoje.length} aulas hoje · ${ativos.length} em curso`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
        {[
          { label: 'Professores', value: professores.length,       accent: 'var(--gb-red)' },
          { label: 'Aulas Hoje',  value: checkinsHoje.length,      accent: 'var(--gb-red)' },
          { label: 'Em Curso',    value: ativos.length,             accent: '#16A34A' },
          { label: 'Total Check-ins', value: todosCheckins.length, accent: 'var(--gb-red)' },
        ].map(s => (
          <div key={s.label} className="py-3.5 px-4 rounded-md border border-border bg-card">
            <div className="mb-1 text-[10.5px] text-muted">{s.label}</div>
            <div className="text-2xl font-extrabold text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      <div className={['grid grid-cols-1 gap-4', selectedId ? 'lg:grid-cols-[320px_1fr]' : ''].join(' ')}>
        {/* Professors list */}
        <div>
          <div className="mb-2.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Lista de Professores</div>
          <div className="flex flex-col gap-2">
            {professores.map(p => {
              const checkinProf = todosCheckins.filter(c => c.professorId === p.id);
              const ativo = checkinProf.find(c => c.status === 'ativa');
              const hoje_count = checkinProf.filter(c => c.data === hoje).length;
              const bc = beltConfig[p.faixa] || { bg: '#888', text: '#fff', label: p.faixa };
              const isSelected = selectedId === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(isSelected ? null : p.id)}
                  className={[
                    'flex gap-3 items-center py-3.5 px-4 min-h-11 text-left rounded-md border-[1.5px] cursor-pointer transition-colors duration-200',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    isSelected ? 'border-gb-red bg-gb-red/5 hover:bg-gb-red/10 active:bg-gb-red/15' : 'border-border bg-card hover:bg-elevated active:bg-elevated',
                  ].join(' ')}
                >
                  <div
                    className="flex justify-center items-center w-11 h-11 font-display text-lg font-extrabold rounded-full shrink-0"
                    style={{ background: `${bc.bg}20`, border: `2px solid ${bc.bg}`, color: bc.bg === '#F0EEFF' ? '#888' : bc.bg }}
                  >
                    {p.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="overflow-hidden text-[13.5px] font-bold whitespace-nowrap text-ellipsis text-primary">{p.nome}</div>
                    <div className="mt-0.5"><BeltBadge faixa={p.faixa} grau={p.grau} /></div>
                  </div>
                  <div className="text-right shrink-0">
                    {ativo
                      ? <div className="text-[10.5px] font-bold text-gb-green">● Em aula</div>
                      : <div className="text-[10.5px] text-muted">{hoje_count} hoje</div>
                    }
                    <div className="mt-0.5 text-[10px] text-muted">{p.turmas.length} turmas</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div>
            <div className="mb-2.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
              Check-ins — {selected.nome}
            </div>

            {/* Professor info */}
            <Card padding="none" className="py-4 px-[18px] mb-3.5">
              <div className="flex flex-wrap gap-3.5 items-center">
                <div className="flex justify-center items-center w-14 h-14 font-display text-2xl font-extrabold text-gb-red rounded-full border-2 shrink-0 border-gb-red/30 bg-gb-red/10">
                  {selected.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-extrabold text-primary">{selected.nome}</div>
                  <div className="mt-0.5"><BeltBadge faixa={selected.faixa} grau={selected.grau} /></div>
                  <div className="mt-0.5 text-[11.5px] text-muted">{selected.email} · {selected.telefone}</div>
                </div>
                <div className="text-right">
                  <div className="mb-0.5 text-[10px] text-muted">TOTAL AULAS</div>
                  <div className="text-[28px] font-extrabold text-primary">{checkinsProfSel.length}</div>
                </div>
              </div>
            </Card>

            {/* Aula em curso */}
            {(() => {
              const ativa = checkinsProfSel.find(c => c.status === 'ativa');
              if (!ativa) return null;
              return (
                <div className="flex gap-2.5 items-center py-3 px-4 mb-3.5 rounded-md border-[1.5px] border-gb-green/25 bg-gb-green/[0.07]">
                  <span className="inline-block w-2.5 h-2.5 bg-gb-green rounded-full shrink-0 animate-[pulse_1.5s_infinite]"/>
                  <div>
                    <div className="text-[13px] font-bold text-gb-green">Aula em curso agora</div>
                    <div className="text-[11.5px] text-muted">{ativa.turmaNome} · desde {ativa.horaInicio}</div>
                  </div>
                </div>
              );
            })()}

            {/* Check-in history table */}
            <Card padding="none">
              {checkinsProfSel.length === 0 ? (
                <div className="p-6 text-[13px] text-center text-muted">Nenhum check-in registado.</div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[520px]">
                  <thead>
                    <tr className="border-b border-border-subtle bg-elevated">
                      {['Turma','Data','Início','Fim','Duração','Estado'].map(h => (
                        <th key={h} className={TH_CLASS}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checkinsProfSel.map(c => (
                      <tr key={c.id} className="border-b border-border-subtle hover:bg-elevated">
                        <td className={[TD_CLASS, 'text-[13px] font-semibold whitespace-nowrap text-primary'].join(' ')}>{c.turmaNome}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-muted'].join(' ')}>{c.data}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-muted'].join(' ')}>{c.horaInicio}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-muted'].join(' ')}>{c.horaFim || '—'}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-secondary'].join(' ')}>{duracao(c.horaInicio, c.horaFim)}</td>
                        <td className={TD_CLASS}><EstadoBadge ativa={c.status === 'ativa'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* If no professor selected, show all recent check-ins */}
        {!selectedId && (
          <div>
            <div className="mb-2.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Todos os Check-ins Recentes</div>
            <Card padding="none">
              {todosCheckins.length === 0 ? (
                <div className="p-6 text-[13px] text-center text-muted">Nenhum check-in registado.</div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-border-subtle bg-elevated">
                      {['Professor','Turma','Data','Início','Fim','Duração','Estado'].map(h => (
                        <th key={h} className={TH_CLASS}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {todosCheckins.map(c => (
                      <tr key={c.id} className="cursor-pointer border-b border-border-subtle transition-colors duration-200 hover:bg-elevated"
                        onClick={() => setSelectedId(c.professorId)}
                      >
                        <td className={[TD_CLASS, 'text-[13px] font-semibold whitespace-nowrap text-primary'].join(' ')}>{c.professorNome}</td>
                        <td className={[TD_CLASS, 'text-xs whitespace-nowrap text-secondary'].join(' ')}>{c.turmaNome}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-muted'].join(' ')}>{c.data}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-muted'].join(' ')}>{c.horaInicio}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-muted'].join(' ')}>{c.horaFim || '—'}</td>
                        <td className={[TD_CLASS, 'font-mono text-xs whitespace-nowrap text-secondary'].join(' ')}>{duracao(c.horaInicio, c.horaFim)}</td>
                        <td className={TD_CLASS}><EstadoBadge ativa={c.status === 'ativa'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
