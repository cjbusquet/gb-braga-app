import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useAlunos } from '../../lib/useData';
import { useProfessoresListaQuery } from '../../hooks/useAulas';
import {
  useAulasParticularesQuery,
  useCriarAulaParticularMutation,
  useAtualizarAulaParticularMutation,
  useAlunosComProfileQuery,
  type AulaParticular,
} from '../../hooks/useAulasParticulares';
import { ymdLocal } from '../../lib/dataLocal';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import PageHeader from '../../components/common/PageHeader';
import CabecalhoDia from '../../components/common/CabecalhoDia';
import { Ico, PlusIcon, ClockIcon, MapPinIcon, UsersIcon, CheckIcon, XCircleIcon } from '../../lib/icons';

const STATUS_BADGE: Record<AulaParticular['status'], { color: 'success' | 'neutral' | 'warning'; label: string }> = {
  agendada:  { color: 'warning', label: 'Agendada' },
  concluida: { color: 'success', label: 'Concluída' },
  cancelada: { color: 'neutral', label: 'Cancelada' },
};

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const LABEL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

// ─── Modal "Nova Aula Particular" ──────────────────────────────
function NovaAulaParticularModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { data: alunos = [] } = useAlunos({ status: 'ativo' });
  const { data: professoresLista = [] } = useProfessoresListaQuery();
  const { data: alunosComProfile = [] } = useAlunosComProfileQuery();
  const criar = useCriarAulaParticularMutation();

  const [data, setData] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [sala, setSala] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ajudanteValue, setAjudanteValue] = useState('');
  const [alunoSearch, setAlunoSearch] = useState('');
  const [alunoIds, setAlunoIds] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState('');

  const alunosFiltrados = alunos.filter(a =>
    !alunoSearch || a.nome.toLowerCase().includes(alunoSearch.toLowerCase()),
  );

  const toggleAluno = (id: string) => {
    setAlunoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const podeGuardar = !!data && !!horaInicio && alunoIds.size > 0 && !criar.isPending;

  const guardar = async (close: () => void) => {
    if (!podeGuardar) return;
    setErro('');
    const id = ajudanteValue ? ajudanteValue.split(':')[1] : null;
    try {
      await criar.mutateAsync({
        data,
        horaInicio,
        horaFim: horaFim || null,
        sala: sala.trim() || null,
        observacoes: observacoes.trim() || null,
        ajudanteId: id,
        alunoIds: Array.from(alunoIds),
      });
      close();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível marcar a aula particular.');
    }
  };

  return (
    <Modal onClose={onClose} title="Nova Aula Particular" maxWidth={560}>
      {close => (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Data *</label>
              <input type="date" value={data} onChange={e => setData(e.target.value)} className={FIELD_CLASS} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLASS}>Hora início *</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} className={FIELD_CLASS} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Hora fim</label>
                <input type="time" value={horaFim} onChange={e => setHoraFim(e.target.value)} className={FIELD_CLASS} />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Sala</label>
              <input value={sala} onChange={e => setSala(e.target.value)} placeholder="Tatame 1" className={FIELD_CLASS} />
            </div>
            <div>
              <Select label="Ajudante (opcional)" value={ajudanteValue} onChange={e => setAjudanteValue(e.target.value)}>
                <option value="">Nenhum</option>
                {professoresLista.filter(p => p.id !== user?.id).length > 0 && (
                  <optgroup label="Professores">
                    {professoresLista.filter(p => p.id !== user?.id).map(p => (
                      <option key={`professor:${p.id}`} value={`professor:${p.id}`}>{p.nome}</option>
                    ))}
                  </optgroup>
                )}
                {alunosComProfile.length > 0 && (
                  <optgroup label="Alunos">
                    {alunosComProfile.map(a => (
                      <option key={`aluno:${a.profileId}`} value={`aluno:${a.profileId}`}>{a.nome}</option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </div>
          </div>

          <div className="mt-3">
            <label className={LABEL_CLASS}>Observações</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2}
              className={[FIELD_CLASS, 'resize-none'].join(' ')} placeholder="Foco da aula, objetivos..." />
          </div>

          <div className="mt-3">
            <label className={LABEL_CLASS}>Alunos * ({alunoIds.size} selecionado{alunoIds.size === 1 ? '' : 's'})</label>
            <input value={alunoSearch} onChange={e => setAlunoSearch(e.target.value)} placeholder="Pesquisar aluno..."
              className={[FIELD_CLASS, 'mb-2'].join(' ')} />
            <div className="overflow-y-auto max-h-[180px] rounded-sm border border-border">
              {alunosFiltrados.length === 0 ? (
                <div className="py-3 text-[12.5px] text-center text-muted">Nenhum aluno encontrado.</div>
              ) : alunosFiltrados.map((a, i) => (
                <label key={a.id}
                  className={[
                    'flex gap-2.5 items-center py-2 px-3 min-h-11 sm:min-h-0 cursor-pointer transition-colors duration-200 hover:bg-elevated',
                    i > 0 ? 'border-t border-border-subtle' : '',
                  ].join(' ')}>
                  <input type="checkbox" checked={alunoIds.has(a.id)} onChange={() => toggleAluno(a.id)}
                    className="w-4 h-4 accent-gb-red" />
                  <span className="flex-1 text-[13px] text-primary">{a.nome}</span>
                </label>
              ))}
            </div>
          </div>

          {erro && <div className="mt-3 text-[12.5px] text-gb-red">{erro}</div>}

          <div className="flex gap-2.5 mt-4.5">
            <Button variant="secondary" className="flex-1" disabled={criar.isPending} onClick={close}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-[2]" disabled={!podeGuardar} onClick={() => guardar(close)}>
              {criar.isPending ? 'A marcar...' : <><Ico icon={CheckIcon} sm /> Marcar Aula</>}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Página "Particulares" (professor) ─────────────────────────
export default function ParticularesPage() {
  const { user } = useAuth();
  const { data: aulas = [], isLoading } = useAulasParticularesQuery(user?.id);
  const atualizar = useAtualizarAulaParticularMutation();
  const [showModal, setShowModal] = useState(false);

  const hojeIso = ymdLocal(new Date());

  const grupos: { data: string; aulas: AulaParticular[] }[] = [];
  for (const a of aulas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.data === a.data) ultimo.aulas.push(a);
    else grupos.push({ data: a.data, aulas: [a] });
  }

  // Dadas = concluídas, quer o professor tenha sido titular ou ajudante —
  // é o que entra nas estatísticas de "aulas particulares dadas" pedidas.
  const dadas = aulas.filter(a => a.status === 'concluida');
  const hoje = new Date();
  const dadasEsteMes = dadas.filter(a => {
    const d = new Date(`${a.data}T00:00:00`);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  return (
    <div>
      {showModal && <NovaAulaParticularModal onClose={() => setShowModal(false)} />}

      <PageHeader
        eyebrow="Professor"
        title="Particulares"
        subtitle="Marca e gere as tuas aulas particulares"
        actions={
          <Button variant="primary" className="whitespace-nowrap" onClick={() => setShowModal(true)}>
            <Ico icon={PlusIcon} sm /> Nova Aula Particular
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="py-3.5 px-4 rounded-xl border border-border bg-card">
          <div className="mb-1 text-[10.5px] text-muted">Dadas este mês</div>
          <div className="text-2xl font-extrabold text-primary">{dadasEsteMes}</div>
        </div>
        <div className="py-3.5 px-4 rounded-xl border border-border bg-card">
          <div className="mb-1 text-[10.5px] text-muted">Dadas (total)</div>
          <div className="text-2xl font-extrabold text-primary">{dadas.length}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-[13px] text-center text-muted">A carregar...</div>
      ) : grupos.length === 0 ? (
        <div className="py-16 text-[13px] text-center text-muted">Ainda não marcaste nenhuma aula particular.</div>
      ) : (
        <div className="flex flex-col gap-5">
          {grupos.map(g => (
            <div key={g.data}>
              <CabecalhoDia iso={g.data} hojeIso={hojeIso} />
              <Card padding="none">
                {g.aulas.map((a, i) => {
                  const souTitular = a.professorId === user?.id;
                  return (
                    <div key={a.id} className={['py-3.5 px-[18px]', i > 0 ? 'border-t border-border-subtle' : ''].join(' ')}>
                      <div className="flex flex-wrap gap-2 justify-between items-start">
                        <div className="min-w-0">
                          <div className="inline-flex gap-1.5 items-center text-[13px] font-bold text-primary">
                            <Ico icon={ClockIcon} sm />{a.horaInicio}{a.horaFim ? `–${a.horaFim}` : ''}
                            {a.sala && <><span className="text-muted">·</span><Ico icon={MapPinIcon} sm />{a.sala}</>}
                          </div>
                          <div className="inline-flex gap-1.5 items-center mt-1 text-[12px] text-secondary">
                            <Ico icon={UsersIcon} sm />{a.alunos.map(al => al.nome).join(', ')}
                          </div>
                          {a.ajudanteNome && (
                            <div className="mt-0.5 text-[11px] text-muted">
                              Ajudante: {a.ajudanteNome} {a.ajudanteTipo === 'aluno' ? '(aluno)' : '(professor)'}
                            </div>
                          )}
                          {a.observacoes && <div className="mt-1 text-[11.5px] text-muted">{a.observacoes}</div>}
                        </div>
                        <div className="flex gap-2 items-center shrink-0">
                          <Badge color={STATUS_BADGE[a.status].color}>{STATUS_BADGE[a.status].label}</Badge>
                        </div>
                      </div>
                      {souTitular && a.status === 'agendada' && (
                        <div className="flex gap-2 mt-2.5">
                          <Button variant="secondary" size="sm" disabled={atualizar.isPending}
                            onClick={() => atualizar.mutate({ id: a.id, status: 'concluida' })}>
                            <Ico icon={CheckIcon} sm /> Concluir
                          </Button>
                          <Button variant="secondary" size="sm" disabled={atualizar.isPending}
                            onClick={() => atualizar.mutate({ id: a.id, status: 'cancelada' })}>
                            <Ico icon={XCircleIcon} sm /> Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
