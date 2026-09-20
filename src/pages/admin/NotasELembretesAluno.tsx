import { useState } from 'react';
import { useNotasAlunoQuery, useCriarNotaAlunoMutation, useApagarNotaAlunoMutation } from '../../hooks/useNotasAluno';
import { useLembretesAlunoQuery, useCriarLembreteMutation, useApagarLembreteMutation } from '../../hooks/useLembretes';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Ico, TrashIcon, ClockIcon, PlusIcon } from '../../lib/icons';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  alunoId: string;
  /** Atendimento só pode consultar (RLS não deixa escrever notas/lembretes de treino) — esconde os formulários de adicionar/apagar. */
  podeEscrever?: boolean;
}

/** Notas privadas do professor + lembretes por presença — nunca visível ao aluno (RLS). */
export default function NotasELembretesAluno({ alunoId, podeEscrever = true }: Props) {
  const { data: notas = [] } = useNotasAlunoQuery(alunoId);
  const criarNota = useCriarNotaAlunoMutation();
  const apagarNota = useApagarNotaAlunoMutation();
  const [novaNota, setNovaNota] = useState('');

  const { data: lembretes = [] } = useLembretesAlunoQuery(alunoId);
  const criarLembrete = useCriarLembreteMutation();
  const apagarLembrete = useApagarLembreteMutation();
  const [textoLembrete, setTextoLembrete] = useState('');
  const [aulasAlvo, setAulasAlvo] = useState(5);

  const enviarNota = async () => {
    if (!novaNota.trim()) return;
    await criarNota.mutateAsync({ alunoId, nota: novaNota.trim() });
    setNovaNota('');
  };

  const enviarLembrete = async () => {
    if (!textoLembrete.trim() || aulasAlvo < 1) return;
    await criarLembrete.mutateAsync({ alunoId, texto: textoLembrete.trim(), aulasAlvo });
    setTextoLembrete('');
  };

  return (
    <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
      {/* Notas do professor */}
      <Card padding="lg">
        <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Notas do Professor</div>
        {podeEscrever && (
          <div className="flex gap-2 mb-3">
            <textarea value={novaNota} onChange={e => setNovaNota(e.target.value)} rows={2}
              placeholder="Observação privada, só visível à equipa técnica..."
              className="flex-1 py-2 px-3 text-[12.5px] rounded-sm border outline-none resize-none border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25" />
            <Button variant="secondary" size="sm" disabled={!novaNota.trim() || criarNota.isPending} onClick={enviarNota}>
              <Ico icon={PlusIcon} sm />
            </Button>
          </div>
        )}
        {notas.length === 0 ? (
          <div className="py-3 text-[12.5px] text-center text-muted">Sem notas ainda.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {notas.map(n => (
              <div key={n.id} className="flex gap-2 justify-between items-start py-2 px-3 rounded-sm bg-elevated">
                <div className="min-w-0">
                  <div className="text-[12.5px] break-words text-primary">{n.nota}</div>
                  <div className="mt-0.5 text-[10.5px] text-muted">{n.professorNome} · {formatarData(n.createdAt)}</div>
                </div>
                {podeEscrever && (
                  <button onClick={() => apagarNota.mutate({ id: n.id, alunoId })}
                    className="p-1 bg-none rounded-sm border-none cursor-pointer shrink-0 text-muted hover:text-gb-red">
                    <Ico icon={TrashIcon} sm />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lembretes */}
      <Card padding="lg">
        <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Lembretes por Presença</div>
        {podeEscrever && (
          <div className="flex flex-wrap gap-2 mb-3">
            <input value={textoLembrete} onChange={e => setTextoLembrete(e.target.value)}
              placeholder="Lembra-me de..."
              className="flex-1 py-2 px-3 min-w-[140px] text-[12.5px] rounded-sm border outline-none border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25" />
            <input type="number" min={1} value={aulasAlvo} onChange={e => setAulasAlvo(Number(e.target.value))}
              className="py-2 px-2.5 w-20 text-[12.5px] rounded-sm border outline-none border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25" />
            <Button variant="secondary" size="sm" disabled={!textoLembrete.trim() || criarLembrete.isPending} onClick={enviarLembrete}>
              <Ico icon={PlusIcon} sm /> em N aulas
            </Button>
          </div>
        )}
        {lembretes.length === 0 ? (
          <div className="py-3 text-[12.5px] text-center text-muted">Sem lembretes ativos.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {lembretes.map(l => (
              <div key={l.id} className="flex gap-2 justify-between items-center py-2 px-3 rounded-sm bg-elevated">
                <div className="min-w-0">
                  <div className="text-[12.5px] break-words text-primary">{l.texto}</div>
                  <div className="inline-flex gap-1.5 items-center mt-0.5 text-[10.5px] text-muted">
                    <Ico icon={ClockIcon} sm />{l.aulasDecorridas}/{l.aulasAlvo} aulas
                  </div>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  {l.concluido && <Badge color="success">Concluído</Badge>}
                  {podeEscrever && (
                    <button onClick={() => apagarLembrete.mutate({ id: l.id, alunoId })}
                      className="p-1 bg-none rounded-sm border-none cursor-pointer text-muted hover:text-gb-red">
                      <Ico icon={TrashIcon} sm />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
