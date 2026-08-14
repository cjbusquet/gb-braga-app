/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { usePlanos, db } from '../../lib/useData';
import { beltConfig } from '../../lib/gbBrand';
import { Ico, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '../../lib/icons';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import BeltBadge from '../../components/common/BeltBadge';
import Select from '../../components/common/Select';

const FAIXAS = [
  'branca',
  'cinza-branca','cinza','cinza-preta',
  'amarela-branca','amarela','amarela-preta',
  'laranja-branca','laranja','laranja-preta',
  'verde-branca','verde','verde-preta',
  'azul','roxa','marrom','preta',
];
const CATS = ['adulto','kids','familia','fundador'];

const RELACAO_LABELS: Record<string, string> = {
  pai: 'Pai', mae: 'Mãe', avo: 'Avó/Avô', tutor: 'Tutor Legal', outro: 'Responsável',
};
const RELACAO_OPTS = ['pai', 'mae', 'avo', 'tutor', 'outro'];

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const LABEL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

function VoltarButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      <Ico icon={ArrowLeftIcon} sm /> Voltar
    </Button>
  );
}

export default function NovaMatriculaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const { data: todosPlanos } = usePlanos();

  // Step 1 — plano
  const [cat, setCat]         = useState('adulto');
  const [planoId, setPlanoId] = useState('');

  // Step 2 — dados pessoais
  const [nome, setNome]       = useState('');
  const [email, setEmail]     = useState('');
  const [telefone, setTel]    = useState('');
  const [nif, setNif]         = useState('');
  const [dataNasc, setDataNasc] = useState('');
  const [faixa, setFaixa]     = useState('branca');
  const [grau, setGrau]       = useState('0');

  // Step 3 — responsável (só para menores)
  const [respNome, setRespNome]       = useState('');
  const [respEmail, setRespEmail]     = useState('');
  const [respTel, setRespTel]         = useState('');
  const [respNif, setRespNif]         = useState('');
  const [respRelacao, setRespRelacao] = useState('pai');
  const [respCheckin, setRespCheckin] = useState(true);
  const [respFatura, setRespFatura]   = useState(false);

  const [step, setStep]     = useState<1|2|3|4>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const planos   = todosPlanos.filter((p: any) => p.categoria === cat);
  const planoSel = todosPlanos.find((p: any) => p.id === planoId);
  const idade    = calcularIdade(dataNasc);
  const eMenor   = idade !== null && idade < 18;
  const totalSteps = eMenor ? 4 : 3;

  // Step 2 → 3: se menor vai para responsável, senão vai para confirmar
  const avancarDeStep2 = () => {
    if (!nome || !email || !dataNasc) return;
    setStep(eMenor ? 3 : 4);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const aluno = await db.criarAluno({
        nome, email, telefone, nif, dataNasc,
        faixa, grau: parseInt(grau) || 0,
        planoId, planoNome: planoSel?.nome,
      });

      // Se tem responsável preenchido, cria e vincula
      if (eMenor && respNome.trim() && aluno?.id) {
        const resp = await db.criarResponsavel({
          nome: respNome, email: respEmail, telefone: respTel, nif: respNif,
        });
        if (resp?.id) {
          await db.vincularResponsavel(aluno.id, resp.id, {
            tipoRelacao: respRelacao,
            podeCheckin: respCheckin,
            eTitularFinanceiro: respFatura,
          });
        }
      }

      setSaved(true);
      onSuccess?.();
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error('Erro ao criar aluno:', e);
      setSaving(false);
    }
  };

  const stepLabel: Record<number, string> = {
    1: 'Selecionar Plano',
    2: 'Dados Pessoais',
    3: 'Responsável',
    4: 'Confirmar',
  };

  return (
    <Modal onClose={onClose} eyebrow={`Nova Matrícula · Passo ${step} de ${totalSteps}`} title={stepLabel[step]}>
      {/* Barra de progresso */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
          <div key={s} className={['flex-1 h-[3px] rounded', s <= step ? 'bg-gb-red' : 'bg-border'].join(' ')} />
        ))}
      </div>

      {/* ── STEP 1 — Plano ── */}
      {step === 1 && (
        <div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {CATS.map(c => (
              <button key={c} onClick={() => { setCat(c); setPlanoId(''); }}
                className={[
                  'py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] capitalize rounded-md border cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  cat === c ? 'text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'text-secondary bg-elevated border-border hover:bg-border-subtle active:bg-border-subtle',
                ].join(' ')}>
                {c}
              </button>
            ))}
          </div>
          {planos.length === 0 ? (
            <div className="p-5 text-center text-muted">A carregar planos...</div>
          ) : (
            <div className="flex flex-col gap-2">
              {planos.map((p: any) => (
                <button key={p.id} onClick={() => setPlanoId(p.id)}
                  className={[
                    'flex justify-between items-center py-3 px-4 min-h-11 text-left rounded-md border-2 cursor-pointer transition-colors duration-200',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                    planoId === p.id ? 'border-gb-red bg-gb-red/5 hover:bg-gb-red/10 active:bg-gb-red/10' : 'border-border bg-elevated hover:bg-border-subtle active:bg-border-subtle',
                  ].join(' ')}>
                  <div>
                    <div className="text-[13px] font-semibold text-primary">{p.nome}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{p.descricao}</div>
                  </div>
                  <div className={['ml-4 text-xl font-extrabold shrink-0', planoId === p.id ? 'text-gb-red' : 'text-primary'].join(' ')}>
                    €{p.valor}<span className="text-[11px] font-normal text-muted">/mês</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-5">
            <Button variant="primary" disabled={!planoId} onClick={() => planoId && setStep(2)}>
              Seguinte <Ico icon={ArrowRightIcon} sm />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Dados pessoais ── */}
      {step === 2 && (
        <div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="col-span-full">
              <label className={LABEL_CLASS}>Nome completo *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do aluno" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Telefone</label>
              <input value={telefone} onChange={e => setTel(e.target.value)} placeholder="+351 9XX XXX XXX" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>NIF</label>
              <input value={nif} onChange={e => setNif(e.target.value)} placeholder="000000000" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Data de Nascimento *</label>
              <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)}
                className={[FIELD_CLASS, !dataNasc ? 'border-gb-red/50' : ''].join(' ')} />
              {idade !== null && (
                <div className={['mt-1 text-[11px]', eMenor ? 'text-amber-600' : 'text-neutral-500'].join(' ')}>
                  {idade} anos
                  {eMenor
                    ? (idade >= 12 ? ' · Menor · check-in autónomo permitido' : ' · Menor · próximo passo: responsável')
                    : ' · Adulto'}
                </div>
              )}
            </div>
            <div>
              <Select label="Faixa actual" value={faixa} onChange={e => setFaixa(e.target.value)}>
                {FAIXAS.map(f => <option key={f} value={f}>{beltConfig[f]?.label || f}</option>)}
              </Select>
            </div>
            <div>
              <Select label="Grau" value={grau} onChange={e => setGrau(e.target.value)}>
                {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex justify-between mt-5">
            <VoltarButton onClick={() => setStep(1)} />
            <Button variant="primary" disabled={!nome || !email || !dataNasc} onClick={avancarDeStep2}>
              {eMenor ? 'Seguinte — Responsável' : 'Seguinte'} <Ico icon={ArrowRightIcon} sm />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Responsável (só menores) ── */}
      {step === 3 && eMenor && (
        <div>
          {/* Info do menor */}
          <div className="py-2.5 px-3.5 mb-4 rounded-lg border border-amber-600/25 bg-amber-600/[0.08]">
            <div className="text-xs font-semibold text-amber-700">
              {nome} · {idade} anos · Menor de Idade
            </div>
            <div className="mt-1 text-[11.5px] text-amber-800">
              {idade! >= 12
                ? 'Pode fazer check-in de forma autónoma. É obrigatório registar um responsável.'
                : 'Tem menos de 12 anos — é obrigatório registar um responsável para check-in.'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="col-span-full">
              <label className={LABEL_CLASS}>Nome do responsável *</label>
              <input value={respNome} onChange={e => setRespNome(e.target.value)} placeholder="Nome completo" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Telefone</label>
              <input value={respTel} onChange={e => setRespTel(e.target.value)} placeholder="+351 9XX XXX XXX" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>NIF do responsável</label>
              <input value={respNif} onChange={e => setRespNif(e.target.value)} placeholder="000000000" className={FIELD_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Email</label>
              <input type="email" value={respEmail} onChange={e => setRespEmail(e.target.value)} placeholder="email@exemplo.com" className={FIELD_CLASS} />
            </div>
            <div>
              <Select label="Relação" value={respRelacao} onChange={e => setRespRelacao(e.target.value)}>
                {RELACAO_OPTS.map(r => <option key={r} value={r}>{RELACAO_LABELS[r]}</option>)}
              </Select>
            </div>
          </div>

          {/* Permissões */}
          <div className="flex flex-wrap gap-5 mt-3.5">
            <label className="flex gap-1.5 items-center py-1.5 text-[13px] cursor-pointer text-secondary">
              <input type="checkbox" checked={respCheckin} onChange={e => setRespCheckin(e.target.checked)} />
              Pode fazer check-in
            </label>
            <label className="flex gap-1.5 items-center py-1.5 text-[13px] cursor-pointer text-secondary">
              <input type="checkbox" checked={respFatura} onChange={e => setRespFatura(e.target.checked)} />
              Titular da fatura
            </label>
          </div>

          <div className="flex justify-between mt-5">
            <VoltarButton onClick={() => setStep(2)} />
            <Button variant="primary" disabled={!respNome.trim()} onClick={() => setStep(4)}>
              Seguinte <Ico icon={ArrowRightIcon} sm />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4 (ou 3 se adulto) — Confirmar ── */}
      {step === 4 && (
        <div>
          <div className="p-4 mb-5 rounded-md bg-elevated">
            {[
              ['Nome',        nome],
              ['Email',       email],
              ['Telefone',    telefone || '—'],
              ['NIF',         nif || '—'],
              ['Nascimento',  dataNasc ? `${dataNasc}${idade !== null ? ` (${idade} anos)` : ''}` : '—'],
              ['Faixa',       <BeltBadge faixa={faixa} grau={parseInt(grau) || 0} size="md" />],
              ['Plano',       planoSel?.nome || '—'],
              ['Mensalidade', `€${planoSel?.valor || 0}/mês`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-border-subtle">
                <span className="text-[12.5px] text-muted">{k}</span>
                <span className="text-[12.5px] font-medium text-primary">{v}</span>
              </div>
            ))}
            {eMenor && respNome && (
              <div className="py-2 px-2.5 mt-2.5 rounded bg-amber-600/[0.07]">
                <div className="mb-1 text-[10.5px] font-bold tracking-[0.5px] uppercase text-amber-700">Responsável</div>
                <div className="text-[12.5px] font-medium text-primary">{respNome} · {RELACAO_LABELS[respRelacao]}</div>
                {respTel && <div className="text-xs text-muted">{respTel}</div>}
              </div>
            )}
          </div>

          {saved && (
            <div className="flex gap-1.5 items-center py-2.5 px-4 mb-4 text-[13px] font-semibold text-green-600 rounded-lg border border-green-500/30 bg-green-500/10">
              <Ico icon={CheckIcon} sm /> Aluno criado com sucesso!
            </div>
          )}

          <div className="flex justify-between">
            <VoltarButton onClick={() => setStep(eMenor ? 3 : 2)} />
            <Button
              variant="primary"
              disabled={saving || saved}
              className={saved ? '!bg-green-500 !shadow-none' : undefined}
              onClick={handleSave}
            >
              {saved
                ? <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Criado!</span>
                : saving ? 'A guardar...' : <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Confirmar Matrícula</span>}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
