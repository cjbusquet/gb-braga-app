/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAlunos, useGraduacoes, db } from '../../lib/useData';
import { beltConfig } from '../../lib/gbBrand';
import { Ico, TrophyIcon, ChatBubbleLeftRightIcon, BoltIcon, MartialArtsIcon, MedalIcon, CheckIcon } from '../../lib/icons';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

// Progressão completa GB: branca → faixas infantis → azul → adulto
const FAIXAS = [
  'branca',
  'cinza-branca','cinza','cinza-preta',
  'amarela-branca','amarela','amarela-preta',
  'laranja-branca','laranja','laranja-preta',
  'verde-branca','verde','verde-preta',
  'azul','roxa','marrom','preta',
];

function proxFaixaGrau(faixa: string, grau: number): { faixa: string; grau: number } {
  if (grau < 4) return { faixa, grau: grau + 1 };
  const idx = FAIXAS.indexOf(faixa);
  if (idx < FAIXAS.length - 1) return { faixa: FAIXAS[idx + 1], grau: 0 };
  return { faixa, grau };
}

function BeltBadge({ faixa, grau }: { faixa: string; grau: number }) {
  const cfg = beltConfig[faixa] || { bg: '#888', text: '#fff', label: faixa };
  return (
    <span className="inline-flex gap-1.5 items-center shrink-0">
      <span
        className="inline-flex box-border justify-center items-center py-1 px-2.5 w-[104px] overflow-hidden text-[11px] font-bold whitespace-nowrap rounded-full"
        style={{ background: cfg.bg, color: cfg.text, border: faixa === 'branca' ? '1px solid #ccc' : 'none' }}
      >
        {cfg.label}
      </span>
      {grau > 0 && <span className="text-[10px] font-bold text-muted">G{grau}</span>}
    </span>
  );
}

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border border-border bg-elevated text-primary transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-gb-red/25 focus:border-gb-red';
const LABEL_CLASS = 'block mb-1.5 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

type Tab = 'candidatos' | 'registar' | 'historico';

export default function GraduacaoPage() {
  const { data: alunos }      = useAlunos();
  const { data: graduacoesDB } = useGraduacoes();
  const [tab, setTab]          = useState<Tab>('candidatos');
  const [graduacoes, setGraduacoes] = useState<any[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (graduacoesDB?.length) setGraduacoes(graduacoesDB);
  }, [graduacoesDB]);
  const [alunoSel, setAlunoSel]     = useState('');
  const [novaFaixa, setNovaFaixa]   = useState('branca');
  const [novoGrau, setNovoGrau]     = useState(0);
  const [obs, setObs]               = useState('');
  const [notificar, setNotificar]   = useState(true);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(false);

  // When aluno changes, pre-fill next belt
  useEffect(() => {
    if (!alunoSel) return;
    const aluno = alunos.find((a: any) => a.id === alunoSel);
    if (aluno) {
      const prox = proxFaixaGrau(aluno.faixa || 'branca', aluno.grau || 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNovaFaixa(prox.faixa);
      setNovoGrau(prox.grau);
    }
  }, [alunoSel, alunos]);

  const candidatos = alunos.filter((a: any) => (a.frequencia || 0) >= 70);

  const handleRegistar = async () => {
    if (!alunoSel) return;
    const aluno = alunos.find((a: any) => a.id === alunoSel);
    if (!aluno) return;
    setSaving(true);
    try {
      const nova = {
        id: `g${Date.now()}`,
        alunoId: alunoSel, alunoNome: aluno.nome,
        faixaAnterior: aluno.faixa || 'branca', grauAnterior: aluno.grau || 0,
        faixaNova: novaFaixa, grauNovo: novoGrau,
        data: new Date().toISOString().split('T')[0],
        professorNome: 'Professor', observacao: obs,
      };
      setGraduacoes(p => [nova, ...p]);
      await db.registarGraduacao({
        alunoId: alunoSel, alunoNome: aluno.nome,
        faixaAnterior: aluno.faixa || 'branca', grauAnterior: aluno.grau || 0,
        faixaNova: novaFaixa, grauNovo: novoGrau,
        professorNome: 'Professor', observacao: obs,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setAlunoSel(''); setObs(''); setTab('historico'); }, 2000);
    } catch (e) {
      console.error('Erro ao registar graduação:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Academia" title="Graduação" />

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-5 border-b border-border">
        {([['candidatos','Candidatos'],['registar','Registar'],['historico','Histórico']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={[
              'py-2 px-4 -mb-px min-h-11 sm:min-h-0 text-[13px] bg-none border-none border-b-2 cursor-pointer whitespace-nowrap transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              tab === id ? 'font-bold border-gb-red text-gb-red' : 'font-normal border-transparent text-muted hover:text-secondary active:text-secondary',
            ].join(' ')}>
            {label}
          </button>
        ))}
      </div>

      {/* CANDIDATOS */}
      {tab === 'candidatos' && (
        <div>
          <div className="flex flex-col gap-3 justify-between items-start py-3 px-4 mb-4 rounded-[10px] border border-amber-500/20 bg-amber-500/[0.07] sm:flex-row sm:items-center">
            <div className="flex gap-2.5 items-center">
              <Ico icon={BoltIcon} lg className="text-amber-500" />
              <div>
                <div className="text-[13px] font-bold text-amber-500">{candidatos.length} alunos elegíveis</div>
                <div className="text-xs text-muted">Frequência ≥ 70%</div>
              </div>
            </div>
            <button onClick={() => alert(`WhatsApp enviado para ${candidatos.length} alunos!`)}
              className="flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-[7px] border-none cursor-pointer bg-[#25D366] transition-colors duration-200 hover:bg-[#1fb658] active:bg-[#1aa04d] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
              <Ico icon={ChatBubbleLeftRightIcon} sm /> Notificar todos
            </button>
          </div>

          {candidatos.length === 0 ? (
            <div className="p-10 text-center text-muted">
              <FontAwesomeIcon icon={MartialArtsIcon} className="mb-2 w-7 h-7" />
              <div>Nenhum candidato com frequência ≥ 70%</div>
              <div className="mt-1 text-xs">Adiciona presenças para os alunos aparecerem aqui</div>
            </div>
          ) : candidatos.map((aluno: any) => {
            const prox = proxFaixaGrau(aluno.faixa || 'branca', aluno.grau || 0);
            return (
              <div key={aluno.id} className="flex flex-col gap-3.5 items-start py-4 px-4 mb-2.5 rounded-xl border border-border bg-card sm:flex-row sm:items-center">
                <div className="flex gap-3.5 items-center min-w-0">
                  <div className="flex justify-center items-center w-[42px] h-[42px] text-base font-bold rounded-full shrink-0 bg-elevated text-secondary">
                    {aluno.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-sm font-bold text-primary">{aluno.nome}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <BeltBadge faixa={aluno.faixa || 'branca'} grau={aluno.grau || 0} />
                      <span className="text-[11px] text-muted">→</span>
                      <BeltBadge faixa={prox.faixa} grau={prox.grau} />
                      <span className="ml-2 text-[11px] text-muted">Freq: {aluno.frequencia || 0}%</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setAlunoSel(aluno.id); setNovaFaixa(prox.faixa); setNovoGrau(prox.grau); setTab('registar'); }}
                  className="flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-xs font-bold text-white rounded-[7px] border-none shadow-red cursor-pointer shrink-0 bg-gb-red transition-colors duration-200 hover:bg-gb-red-dark active:bg-gb-red-dark outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                  <Ico icon={TrophyIcon} sm /> Registar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* REGISTAR */}
      {tab === 'registar' && (
        <div className="max-w-[600px]">
          <Card padding="lg">

            <div className="mb-3.5">
              <label className={LABEL_CLASS}>Aluno *</label>
              <select value={alunoSel} onChange={e => setAlunoSel(e.target.value)} className={FIELD_CLASS}>
                <option value="">— Seleccionar aluno —</option>
                {alunos.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nome} · {a.faixa} G{a.grau}</option>
                ))}
              </select>
              {alunos.length === 0 && (
                <div className="mt-1 text-[11px] text-muted">Nenhum aluno encontrado. Adiciona alunos primeiro.</div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 mb-3.5 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Nova Faixa</label>
                <select value={novaFaixa} onChange={e => setNovaFaixa(e.target.value)} className={FIELD_CLASS}>
                  {FAIXAS.map(f => <option key={f} value={f}>{(beltConfig[f]?.label) || f}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Novo Grau</label>
                <select value={novoGrau} onChange={e => setNovoGrau(parseInt(e.target.value))} className={FIELD_CLASS}>
                  {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className={LABEL_CLASS}>Observações</label>
              <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} placeholder="Notas sobre a graduação..."
                className={[FIELD_CLASS, 'resize-none'].join(' ')}/>
            </div>

            <label className="flex gap-2 items-center mb-4 cursor-pointer">
              <input type="checkbox" checked={notificar} onChange={() => setNotificar(n => !n)} className="w-[15px] h-[15px] accent-[#25D366] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
              <span className="inline-flex gap-1.5 items-center text-[13px] text-secondary"><Ico icon={ChatBubbleLeftRightIcon} sm /> Notificar aluno via WhatsApp</span>
            </label>

            {success && (
              <div className="flex gap-1.5 items-center py-2.5 px-3.5 mb-3.5 text-[13px] font-semibold text-green-600 rounded-lg border border-green-500/30 bg-green-500/10">
                <Ico icon={CheckIcon} sm />Graduação registada! OSS! <Ico icon={MartialArtsIcon} sm />
              </div>
            )}

            <Button
              variant="primary" size="lg" fullWidth
              disabled={!alunoSel || saving || success}
              className={success ? '!bg-green-500 !shadow-none' : undefined}
              onClick={handleRegistar}
            >
              {success ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Graduação registada!</span> : saving ? 'A guardar...' : <span className="inline-flex gap-1.5 items-center">Confirmar Graduação — OSS! <Ico icon={MartialArtsIcon} sm /></span>}
            </Button>
          </Card>
        </div>
      )}

      {/* HISTÓRICO */}
      {tab === 'historico' && (
        <div>
          {graduacoes.length === 0 ? (
            <div className="p-10 text-center text-muted">
              <FontAwesomeIcon icon={MedalIcon} className="mb-2 w-7 h-7" />
              <div>Sem graduações registadas</div>
            </div>
          ) : graduacoes.map((g: any) => (
            <div key={g.id} className="flex gap-3.5 items-center py-4 px-4 mb-2.5 rounded-xl border border-border bg-card">
              <div className="flex-1">
                <div className="mb-1 text-sm font-bold text-primary">{g.alunoNome || g.aluno_nome}</div>
                <div className="flex gap-2 items-center">
                  <BeltBadge faixa={g.faixaAnterior || g.faixa_anterior || 'branca'} grau={g.grauAnterior || g.grau_anterior || 0} />
                  <span className="text-[11px] text-muted">→</span>
                  <BeltBadge faixa={g.faixaNova || g.faixa_nova || 'branca'} grau={g.grauNovo || g.grau_novo || 0} />
                </div>
              </div>
              <div className="text-xs text-right text-muted">
                {g.data}<br/>{g.professorNome || g.professor_nome || '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
