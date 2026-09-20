import { useState } from 'react';
import {
  useTurmasDoProfessorQuery,
  useAulasFuturasQuery,
  useProfessoresListaQuery,
  useDefinirProfessorAulaMutation,
  type Aula,
} from '../../hooks/useAulas';
import { useAuth } from '../../lib/auth';
import type { Turma } from '../../types';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import PageHeader from '../../components/common/PageHeader';
import CabecalhoDia from '../../components/common/CabecalhoDia';
import { ymdLocal, formatarDia } from '../../lib/dataLocal';
import { Ico, CalendarDaysIcon, CheckIcon, MapPinIcon, ClockIcon, XCircleIcon } from '../../lib/icons';

const DAYS_FULL = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const HORIZONTE_DIAS = 30;

interface Ocorrencia {
  key: string;
  turma: Turma;
  data: string;
  efetivoId: string | null;
  efetivoNome: string | null;
}

function ProfBadge({ efetivoId, efetivoNome, souEu }: { efetivoId: string | null; efetivoNome: string | null; souEu: boolean }) {
  if (!efetivoId) return <Badge color="warning">Sem professor</Badge>;
  if (souEu) return <Badge color="success"><Ico icon={CheckIcon} sm />Dás tu</Badge>;
  return <Badge color="neutral">{efetivoNome || 'Professor'}</Badge>;
}

// ─── Linha da agenda: uma ocorrência (turma + dia) com as ações de professor ──
function AgendaLinha({
  turmaNome, horario, sala, efetivoId, efetivoNome, souEu,
  podeGerir, vago, professores, loading, onAssumir, onLibertar, onSubstituto,
}: {
  turmaNome: string; horario: string | null; sala: string | null;
  efetivoId: string | null; efetivoNome: string | null; souEu: boolean;
  podeGerir: boolean; vago: boolean;
  professores: { id: string; nome: string }[];
  loading: boolean;
  onAssumir: () => void; onLibertar: () => void; onSubstituto: (id: string) => void;
}) {
  return (
    <div className="py-3 px-[18px] border-t border-border-subtle first:border-t-0">
      <div className="flex flex-wrap gap-2 justify-between items-start mb-2.5">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-primary">{turmaNome}</div>
          <div className="inline-flex gap-1.5 items-center mt-0.5 text-[11.5px] text-muted">
            <Ico icon={ClockIcon} sm />{horario || '-'}
            {sala && <><span>·</span><Ico icon={MapPinIcon} sm />{sala}</>}
          </div>
        </div>
        <ProfBadge efetivoId={efetivoId} efetivoNome={efetivoNome} souEu={souEu} />
      </div>
      {loading ? (
        <span className="text-[11px] text-muted">a guardar…</span>
      ) : podeGerir ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {vago ? (
            <Button variant="secondary" size="sm" onClick={onAssumir} fullWidth className="sm:w-auto">
              <Ico icon={CheckIcon} sm /> Dou eu
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onLibertar}>
              <Ico icon={XCircleIcon} sm /> Não vou dar
            </Button>
          )}
          <div className="w-full sm:w-[150px]">
            <Select
              variant="sm"
              aria-label="Escolher substituto"
              value=""
              onChange={e => { if (e.target.value) onSubstituto(e.target.value); }}
            >
              <option value="">Substituto…</option>
              {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
          </div>
        </div>
      ) : vago ? (
        <Button variant="secondary" size="sm" onClick={onAssumir} fullWidth className="sm:w-auto">Dou eu</Button>
      ) : null}
    </div>
  );
}

// ─── Página "Agenda" (professor) — planear quem dá cada aula dos próximos 30 dias ──
export default function AgendaPage() {
  const { user } = useAuth();
  const { data: turmas = [] } = useTurmasDoProfessorQuery(user?.id);
  const { data: aulasFuturas = [] } = useAulasFuturasQuery();
  const { data: professoresLista = [] } = useProfessoresListaQuery();
  const definirMut = useDefinirProfessorAulaMutation();
  const [pending, setPending] = useState<string | null>(null);

  const definir = async (turmaId: string, data: string, professorId: string | null) => {
    const key = `${turmaId}|${data}`;
    setPending(key);
    try {
      await definirMut.mutateAsync({ turmaId, data, professorId });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível alterar o professor da aula.');
    } finally {
      setPending(null);
    }
  };

  // Ocorrências das minhas turmas nos próximos 30 dias, com a linha de
  // `aulas` sobreposta quando já existe (substituto, aula libertada, etc).
  const aulaPorChave = new Map<string, Aula>();
  for (const a of aulasFuturas) aulaPorChave.set(`${a.turmaId}|${a.data}`, a);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeIso = ymdLocal(hoje);
  const meusTurmaIds = new Set(turmas.map(t => t.id));

  const minhasOcorrencias: Ocorrencia[] = [];
  for (let i = 0; i < HORIZONTE_DIAS; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    const dia = DAYS_FULL[(d.getDay() + 6) % 7]; // undefined ao domingo — sem aulas
    if (!dia) continue;
    const iso = ymdLocal(d);
    for (const t of turmas) {
      if (!t.diaSemana.includes(dia)) continue;
      const aula = aulaPorChave.get(`${t.id}|${iso}`);
      minhasOcorrencias.push({
        key: `${t.id}|${iso}`,
        turma: t,
        data: iso,
        efetivoId: aula ? aula.professorId : (t.professorId || null),
        efetivoNome: aula ? aula.professorNome : (t.professorNome || null),
      });
    }
  }

  const ocorrenciasPorDia: { data: string; itens: Ocorrencia[] }[] = [];
  for (const o of minhasOcorrencias) {
    const ultimo = ocorrenciasPorDia[ocorrenciasPorDia.length - 1];
    if (ultimo && ultimo.data === o.data) ultimo.itens.push(o);
    else ocorrenciasPorDia.push({ data: o.data, itens: [o] });
  }

  // Aulas de outras turmas que ficaram sem professor — qualquer
  // professor as pode assumir.
  const porCobrir = aulasFuturas
    .filter(a => !a.professorId && !meusTurmaIds.has(a.turmaId))
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div>
      <PageHeader
        eyebrow="Professor"
        title="Agenda"
        subtitle="Retira-te de uma aula, escolhe um substituto, ou assume uma aula sem professor, para hoje ou os próximos 30 dias."
      />

      <div className="mb-2 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Próximas Aulas</div>
      {ocorrenciasPorDia.length === 0 ? (
        <div className="py-6 text-[13px] text-center text-muted">Sem aulas agendadas nas tuas turmas.</div>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          {ocorrenciasPorDia.map(g => (
            <div key={g.data}>
              <CabecalhoDia iso={g.data} hojeIso={hojeIso} />
              <Card padding="none" className={g.data === hojeIso ? 'border-gb-red/30' : undefined}>
                {g.itens.map(o => {
                  const souEu = !!user?.id && o.efetivoId === user.id;
                  const souTitular = !!user?.id && o.turma.professorId === user.id;
                  return (
                    <AgendaLinha
                      key={o.key}
                      turmaNome={o.turma.nome}
                      horario={o.turma.horario}
                      sala={o.turma.sala}
                      efetivoId={o.efetivoId}
                      efetivoNome={o.efetivoNome}
                      souEu={souEu}
                      podeGerir={souEu || souTitular}
                      vago={!o.efetivoId}
                      professores={professoresLista.filter(p => p.id !== user?.id)}
                      loading={pending === o.key}
                      onAssumir={() => definir(o.turma.id, o.data, user!.id)}
                      onLibertar={() => definir(o.turma.id, o.data, null)}
                      onSubstituto={(id) => definir(o.turma.id, o.data, id)}
                    />
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

      {porCobrir.length > 0 && (
        <>
          <div className="mb-2 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Aulas por Cobrir</div>
          <Card padding="none">
            {porCobrir.map(a => (
              <div key={a.id} className="py-3 px-[18px] border-t border-border-subtle first:border-t-0">
                <div className="flex flex-wrap gap-2 justify-between items-start mb-2.5">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-primary">{a.turmaNome}</div>
                    <div className="inline-flex gap-1.5 items-center mt-0.5 text-[11.5px] text-muted">
                      <Ico icon={CalendarDaysIcon} sm />{formatarDia(a.data)}
                      <span>·</span><Ico icon={ClockIcon} sm />{a.horario || '-'}
                    </div>
                  </div>
                  <Badge color="warning">Sem professor</Badge>
                </div>
                {pending === `${a.turmaId}|${a.data}`
                  ? <span className="text-[11px] text-muted">a guardar…</span>
                  : <Button variant="secondary" size="sm" onClick={() => definir(a.turmaId, a.data, user!.id)} fullWidth className="sm:w-auto">Dou eu</Button>}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
