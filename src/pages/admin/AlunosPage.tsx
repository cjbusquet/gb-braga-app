/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react';
import { useResponsaveis, db } from '../../lib/useData';
import { useAlunosQuery, useInvalidateAlunos } from '../../lib/queries';
import { useAuth } from '../../lib/auth';
import { useToast } from '../../components/common/Toast';
import { beltConfig } from '../../lib/gbBrand';
import { FAIXAS_PROGRESSAO, isMatriculaPendente } from '../../lib/alunoDomain';
import NovaMatriculaModal from './NovaMatriculaModal';
import { Ico, PencilIcon, CheckCircleIcon, XCircleIcon, XMarkIcon, ArrowPathIcon, ArrowLeftIcon, PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon, AdjustmentsHorizontalIcon, CheckIcon, SaveIcon, CircleIcon, BanIcon, ClockIcon } from '../../lib/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from '../../components/common/Button';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Select from '../../components/common/Select';
import { SkeletonList } from '../../components/common/Skeleton';
import BeltBadge from '../../components/common/BeltBadge';

const PAGE_SIZE = 20;

const FAIXAS_ORDER = FAIXAS_PROGRESSAO;

/** Estado apresentado na UI — sobrepõe o status da BD com "pendente" enquanto a matrícula não é confirmada. */
function statusEfetivo(a: any): string {
  return isMatriculaPendente(a) ? 'pendente' : a.status;
}

// ── Utilitários de idade ────────────────────────────────────────────────────

function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null;
  const nasc = new Date(dataNasc);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

function eMenor(dataNasc: string): boolean {
  const idade = calcularIdade(dataNasc);
  return idade !== null && idade < 18;
}

function podeCheckinAutonomo(dataNasc: string): boolean {
  const idade = calcularIdade(dataNasc);
  return idade !== null && idade >= 12 && idade < 18;
}

const RELACAO_LABELS: Record<string, string> = {
  pai: 'Pai', mae: 'Mãe', avo: 'Avó/Avô', tutor: 'Tutor Legal', outro: 'Responsável',
};

const FIELD_CLASS = 'box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 text-[13px] rounded-sm border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const LABEL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';

// ── EditAlunoModal ──────────────────────────────────────────────────────────

function EditAlunoModal({ aluno, onClose }: { aluno: any; onClose: () => void }) {
  const [nome, setNome]           = useState(aluno.nome || '');
  const email                     = aluno.email || '';
  const [telefone, setTel]        = useState(aluno.telefone || '');
  const [nif, setNif]             = useState(aluno.nif || '');
  const [dataNasc, setDataNasc]   = useState(aluno.dataNascimento || '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const { data: vinculos } = useResponsaveis(aluno.id);
  const idade = calcularIdade(dataNasc);
  const precisaResp = eMenor(dataNasc) && vinculos.length === 0;

  const handleSave = async () => {
    if (!dataNasc || precisaResp) return;
    setSaving(true);
    try {
      await db.atualizarAluno(aluno.id, { nome, telefone, nif, dataNascimento: dataNasc });
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch(e) {
      console.error(e);
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="flex fixed inset-0 z-[1000] justify-center items-center p-5 bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="p-7 w-full max-w-[500px] rounded-lg border border-border bg-card"
      >
        <div className="flex justify-between mb-5">
          <div className="text-[15px] font-extrabold text-primary">
            Editar — {aluno.nome}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex justify-center items-center p-2 -m-2 bg-none rounded-full border-none cursor-pointer text-muted transition-colors duration-200 hover:text-primary hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"
          >
            <Ico icon={XMarkIcon} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="col-span-full">
            <label className={LABEL_CLASS}>Nome completo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input type="email" value={email} disabled className={[FIELD_CLASS, 'opacity-50 cursor-not-allowed'].join(' ')} />
            <div className="mt-1 text-[10.5px] text-muted">O email é a credencial de login e não pode ser alterado aqui.</div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Telefone</label>
            <input value={telefone} onChange={e => setTel(e.target.value)} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>NIF</label>
            <input value={nif} onChange={e => setNif(e.target.value)} className={FIELD_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Data de Nascimento *</label>
            <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)}
              className={[FIELD_CLASS, !dataNasc ? 'border-gb-red/50' : ''].join(' ')} />
            {!dataNasc && <div className="mt-1 text-[11px] text-gb-red">Obrigatório</div>}
            {idade !== null && (
              <div className={['mt-1 text-[11px]', idade < 18 ? 'text-amber-600' : 'text-muted'].join(' ')}>
                {idade} anos{idade < 18 ? (idade >= 12 ? ' · Menor · Check-in autónomo' : ' · Menor · Requer responsável') : ' · Adulto'}
              </div>
            )}
          </div>
        </div>

        {precisaResp && (
          <div className="p-2.5 px-3.5 mt-3.5 rounded-lg border border-amber-600/30 bg-amber-600/[0.08]">
            <div className="text-xs font-semibold text-amber-600">Encarregado de Educação obrigatório</div>
            <div className="mt-1 text-[11.5px] text-amber-800">
              Este aluno é menor de 18 anos. Fecha esta janela e adiciona um responsável no perfil do aluno antes de guardar.
            </div>
          </div>
        )}

        <div className="flex gap-2.5 mt-4.5">
          <Button variant="secondary" className="flex-1" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary" className={['flex-[2]', saved ? '!bg-gb-green' : ''].join(' ')}
            disabled={saving || saved || !dataNasc || precisaResp}
            onClick={handleSave}
          >
            {saved ? (
              <><Ico icon={CheckIcon} sm /> Guardado!</>
            ) : saving ? (
              <><Ico icon={ArrowPathIcon} sm /> A guardar...</>
            ) : (
              <><Ico icon={SaveIcon} sm /> Guardar</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── ResponsaveisSection ─────────────────────────────────────────────────────

const RELACAO_OPTS = ['pai', 'mae', 'avo', 'tutor', 'outro'];

const FORM_INIT = { nome: '', email: '', telefone: '', nif: '', tipoRelacao: 'pai', podeCheckin: true, eTitularFinanceiro: false };

const MINI_FIELD_CLASS = 'box-border w-full py-1.5 px-2.5 min-h-11 sm:min-h-0 text-[12.5px] rounded-md border outline-none transition-all duration-200 border-border bg-elevated text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const MINI_LABEL_CLASS = 'block mb-0.5 text-[10px] font-bold tracking-[0.7px] uppercase text-muted';

function ResponsaveisSection({ aluno }: { aluno: any }) {
  const { data: vinculos, refetch } = useResponsaveis(aluno.id);
  const [adding, setAdding]         = useState(false);
  const [form, setForm]             = useState(FORM_INIT);
  const [saving, setSaving]         = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const autonomo = podeCheckinAutonomo(aluno.dataNascimento);

  const handleAdd = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      const resp = await db.criarResponsavel({ nome: form.nome, email: form.email, telefone: form.telefone, nif: form.nif });
      await db.vincularResponsavel(aluno.id, resp.id, {
        tipoRelacao: form.tipoRelacao,
        podeCheckin: form.podeCheckin,
        eTitularFinanceiro: form.eTitularFinanceiro,
      });
      setAdding(false);
      setForm(FORM_INIT);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (vinculoId: string) => {
    if (!confirm('Remover este responsável do aluno?')) return;
    setRemovingId(vinculoId);
    try {
      await db.desvincularResponsavel(vinculoId);
      refetch();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="pt-4 mt-5 border-t border-border-subtle">

      {/* Header */}
      <div className="flex justify-between items-center mb-2.5">
        <div>
          <span className="text-[11px] font-bold tracking-[0.6px] uppercase text-muted">
            Responsáveis
          </span>
          {autonomo ? (
            <span className="py-0.5 px-1.5 ml-2 text-[10px] font-semibold text-emerald-600 rounded-full bg-emerald-600/10">
              Check-in autónomo
            </span>
          ) : (
            <span className="py-0.5 px-1.5 ml-2 text-[10px] font-semibold text-amber-600 rounded-full bg-amber-600/10">
              Requer responsável p/ check-in
            </span>
          )}
        </div>
        <button
          onClick={() => { setAdding(a => !a); setForm(FORM_INIT); }}
          className={[
            'py-1 px-3 min-h-11 sm:min-h-0 text-xs font-semibold rounded-md border cursor-pointer transition-colors duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
            adding ? 'border-border bg-elevated text-muted hover:bg-border-subtle active:bg-border-subtle' : 'bg-transparent border-gb-red text-gb-red hover:bg-gb-red/10 active:bg-gb-red/10',
          ].join(' ')}
        >
          {adding ? 'Cancelar' : '+ Adicionar'}
        </button>
      </div>

      {/* Lista de responsáveis */}
      {vinculos.length === 0 && !adding && (
        <div className="py-1.5 text-xs text-muted">
          Nenhum responsável registado.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {vinculos.map((v: any) => (
          <div key={v.id} className="flex gap-2.5 items-center py-2.5 px-3.5 rounded-lg border border-border bg-elevated">
            {/* Avatar */}
            <div className="flex justify-center items-center w-8 h-8 text-[13px] font-bold rounded-full shrink-0 text-gb-red bg-gb-red/10">
              {v.responsavel.nome.charAt(0)}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-primary">{v.responsavel.nome}</div>
              <div className="mt-px text-[11.5px] text-muted">
                {v.responsavel.telefone || v.responsavel.email || '—'}
              </div>
            </div>
            {/* Badges */}
            <div className="flex gap-1 shrink-0">
              <span className="py-0.5 px-1.5 text-[10px] font-semibold text-muted rounded-full bg-elevated">
                {RELACAO_LABELS[v.tipoRelacao] ?? v.tipoRelacao}
              </span>
              {v.podeCheckin && (
                <span className="py-0.5 px-1.5 text-[10px] font-semibold text-emerald-600 rounded-full bg-emerald-600/10">
                  Check-in
                </span>
              )}
              {v.eTitularFinanceiro && (
                <span className="py-0.5 px-1.5 text-[10px] font-semibold text-amber-600 rounded-full bg-amber-600/10">
                  Fatura
                </span>
              )}
            </div>
            {/* Remove */}
            <button
              onClick={() => handleRemove(v.id)}
              disabled={removingId === v.id}
              className={[
                'flex justify-center items-center p-1 min-h-11 min-w-11 bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-gb-red active:text-gb-red',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                removingId === v.id ? 'opacity-40' : 'opacity-100',
              ].join(' ')}
            >
              <Ico icon={TrashIcon} sm />
            </button>
          </div>
        ))}
      </div>

      {/* Formulário inline de adição */}
      {adding && (
        <div className="p-4 mt-2.5 rounded-md border border-gb-red/20 bg-elevated">
          <div className="mb-3 text-[11px] font-bold tracking-[0.6px] uppercase text-muted">
            Novo Responsável
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="col-span-full">
              <label className={MINI_LABEL_CLASS}>Nome completo *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do responsável" className={MINI_FIELD_CLASS} />
            </div>
            <div>
              <label className={MINI_LABEL_CLASS}>Telefone</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="+351 9XX XXX XXX" className={MINI_FIELD_CLASS} />
            </div>
            <div>
              <label className={MINI_LABEL_CLASS}>NIF</label>
              <input value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} placeholder="000000000" className={MINI_FIELD_CLASS} />
            </div>
            <div>
              <label className={MINI_LABEL_CLASS}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className={MINI_FIELD_CLASS} />
            </div>
            <div>
              <label className={MINI_LABEL_CLASS}>Relação</label>
              <select value={form.tipoRelacao} onChange={e => setForm(f => ({ ...f, tipoRelacao: e.target.value }))} className={[MINI_FIELD_CLASS, 'cursor-pointer'].join(' ')}>
                {RELACAO_OPTS.map(r => <option key={r} value={r}>{RELACAO_LABELS[r]}</option>)}
              </select>
            </div>
          </div>

          {/* Permissões */}
          <div className="flex flex-wrap gap-4 mt-3">
            <label className="flex gap-1.5 items-center py-1.5 text-[12.5px] cursor-pointer text-secondary">
              <input type="checkbox" checked={form.podeCheckin} onChange={e => setForm(f => ({ ...f, podeCheckin: e.target.checked }))} />
              Pode fazer check-in
            </label>
            <label className="flex gap-1.5 items-center py-1.5 text-[12.5px] cursor-pointer text-secondary">
              <input type="checkbox" checked={form.eTitularFinanceiro} onChange={e => setForm(f => ({ ...f, eTitularFinanceiro: e.target.checked }))} />
              Titular da fatura
            </label>
          </div>

          <div className="flex gap-2 mt-3.5">
            <button onClick={() => { setAdding(false); setForm(FORM_INIT); }}
              className="flex-1 py-2 min-h-11 sm:min-h-0 text-[12.5px] rounded-md border cursor-pointer transition-colors duration-200 border-border bg-base text-muted hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
              Cancelar
            </button>
            <button onClick={handleAdd} disabled={saving || !form.nome.trim()}
              className={[
                'flex-[2] py-2 min-h-11 sm:min-h-0 text-[12.5px] font-bold text-white rounded-md border-none transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                saving || !form.nome.trim() ? 'bg-neutral-400' : 'cursor-pointer bg-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark',
              ].join(' ')}>
              {saving ? 'A guardar...' : <span className="inline-flex gap-1.5 items-center"><Ico icon={CheckIcon} sm />Guardar Responsável</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AlunosPage ──────────────────────────────────────────────────────────────

export default function AlunosPage() {
  const { user } = useAuth();
  const toast = useToast();
  // restringir_update_aluno() (trigger na BD) só deixa admin/superadmin/
  // atendimento mudar alunos.status — um professor consegue clicar,
  // recebe 200, mas o valor é revertido para OLD.status ainda dentro do
  // trigger. Sem esta gate, os botões pareciam "funcionar por um
  // instante" (update optimista) e depois reverter sozinhos assim que
  // o refetch trazia o status verdadeiro (nunca mudou).
  const podeAlterarStatus = user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'atendimento';
  const { data: alunos = [], isLoading: alunosLoading } = useAlunosQuery();
  const invalidate = useInvalidateAlunos();
  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroFaixa, setFiltroFaixa]   = useState('todas');
  const [soGraduaveis, setSoGraduaveis] = useState(false);
  const [sortBy, setSortBy]             = useState<'nome-az' | 'nome-za' | 'faixa-asc' | 'faixa-desc' | 'freq-desc'>('nome-az');
  const [page, setPage]                 = useState(1);
  // Debounce: só filtra 300ms depois do utilizador parar de escrever.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);
  const [selected, setSelected]         = useState<any>(null);
  const [editModal, setEditModal]       = useState(false);
  const [showMatricula, setShowMatricula] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const changeStatus = async (newStatus: 'ativo' | 'suspenso' | 'inativo') => {
    const labels: Record<string, string> = {
      ativo:    'Reativar este aluno?',
      suspenso: 'Suspender este aluno? O acesso será bloqueado temporariamente.',
      inativo:  'Marcar este aluno como inativo? O perfil ficará arquivado.',
    };
    if (!confirm(labels[newStatus])) return;
    setStatusLoading(true);
    try {
      await db.atualizarAluno(selected.id, { status: newStatus });
      setSelected({ ...selected, status: newStatus });
      invalidate();
    } catch (e) {
      console.error('Erro ao alterar status:', e);
      toast.error('Erro ao alterar o estado do aluno. Tente novamente.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Faixas únicas presentes nos alunos (para o filtro de faixa)
  const faixasDisponiveis = useMemo(() =>
    [...new Set(alunos.map((a: any) => a.faixa).filter(Boolean))]
      .sort((a, b) => FAIXAS_ORDER.indexOf(a as any) - FAIXAS_ORDER.indexOf(b as any)),
  [alunos]);

  const filtered = useMemo(() => {
    let result = [...alunos] as any[];
    if (filtroStatus !== 'todos') result = result.filter(a => statusEfetivo(a) === filtroStatus);
    if (filtroFaixa !== 'todas') result = result.filter(a => a.faixa === filtroFaixa);
    if (soGraduaveis) result = result.filter(a => (a.frequencia || 0) >= 70);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.nome?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'nome-az':   return (a.nome || '').localeCompare(b.nome || '');
        case 'nome-za':   return (b.nome || '').localeCompare(a.nome || '');
        case 'faixa-asc': return FAIXAS_ORDER.indexOf(a.faixa) - FAIXAS_ORDER.indexOf(b.faixa) || (a.grau || 0) - (b.grau || 0);
        case 'faixa-desc':return FAIXAS_ORDER.indexOf(b.faixa) - FAIXAS_ORDER.indexOf(a.faixa) || (b.grau || 0) - (a.grau || 0);
        case 'freq-desc': return (b.frequencia || 0) - (a.frequencia || 0);
        default: return 0;
      }
    });
    return result;
  }, [alunos, filtroStatus, filtroFaixa, soGraduaveis, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const setFilter = (setter: (v: any) => void) => (v: any) => { setter(v); setPage(1); };

  const statusBadgeColor = (status: string) =>
    status === 'ativo' ? 'success' : status === 'pendente' ? 'warning' : status === 'suspenso' ? 'warning' : 'neutral';

  // ── Perfil do aluno seleccionado ────────────────────────────
  const renderPerfil = () => {
    const idade = calcularIdade(selected.dataNascimento);
    const menor = eMenor(selected.dataNascimento);

    return (
      <div>
        <button onClick={() => setSelected(null)} className="flex gap-1.5 items-center py-2 mb-4 min-h-11 sm:min-h-0 text-[13px] bg-none border-none cursor-pointer transition-colors duration-200 text-muted hover:text-primary active:text-primary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
          <Ico icon={ArrowLeftIcon} sm /> Voltar
        </button>
        <div className="p-6 rounded-lg border border-border bg-card">

          {/* Cabeçalho */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex gap-3.5 items-center">
              <div className="flex justify-center items-center w-[52px] h-[52px] text-xl font-bold text-white rounded-full shrink-0 bg-gb-red">
                {selected.nome?.charAt(0) || '?'}
              </div>
              <div>
                <div className="text-[17px] font-bold text-primary">{selected.nome}</div>
                <div className="text-[13px] text-muted">{selected.email}</div>
                {/* Badge de idade */}
                {idade !== null && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={['py-0.5 px-2 text-[10.5px] font-semibold rounded-full', menor ? 'text-amber-600 bg-amber-600/10' : 'text-muted bg-elevated'].join(' ')}>
                      {idade} anos{menor ? ' · Menor' : ' · Adulto'}
                    </span>
                    {menor && podeCheckinAutonomo(selected.dataNascimento) && (
                      <span className="py-0.5 px-2 text-[10.5px] font-semibold text-emerald-600 rounded-full bg-emerald-600/10">
                        Check-in autónomo (≥12)
                      </span>
                    )}
                    {menor && !podeCheckinAutonomo(selected.dataNascimento) && (
                      <span className="py-0.5 px-2 text-[10.5px] font-semibold text-red-600 rounded-full bg-red-600/10">
                        Requer responsável
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botões de acção */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { if (!isMatriculaPendente(selected)) setEditModal(true); }}
                disabled={isMatriculaPendente(selected)}
                title={isMatriculaPendente(selected) ? 'Matrícula pendente de confirmação — ação bloqueada até à aprovação do pagamento.' : undefined}
                className="flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border cursor-pointer transition-colors duration-200 border-border bg-elevated text-secondary hover:bg-border-subtle active:bg-border-subtle outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-elevated">
                <Ico icon={PencilIcon} sm /> Editar
              </button>
              {podeAlterarStatus && (selected.status === 'suspenso' || selected.status === 'inativo') && (
                <button onClick={() => changeStatus('ativo')} disabled={statusLoading || isMatriculaPendente(selected)}
                  title={isMatriculaPendente(selected) ? 'Matrícula pendente de confirmação — ação bloqueada até à aprovação do pagamento.' : undefined}
                  className={[
                    'flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] text-gb-green rounded-sm border cursor-pointer transition-colors duration-200 border-gb-green/35 bg-gb-green/10 hover:bg-gb-green/20 active:bg-gb-green/20',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                    statusLoading || isMatriculaPendente(selected) ? 'opacity-50' : 'opacity-100',
                  ].join(' ')}>
                  <Ico icon={CheckCircleIcon} sm /> Reativar
                </button>
              )}
              {podeAlterarStatus && selected.status !== 'suspenso' && (
                <button onClick={() => changeStatus('suspenso')} disabled={statusLoading || isMatriculaPendente(selected)}
                  title={isMatriculaPendente(selected) ? 'Matrícula pendente de confirmação — ação bloqueada até à aprovação do pagamento.' : undefined}
                  className={[
                    'flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] text-amber-600 rounded-sm border cursor-pointer transition-colors duration-200 border-amber-600/30 bg-amber-600/10 hover:bg-amber-600/20 active:bg-amber-600/20',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                    statusLoading || isMatriculaPendente(selected) ? 'opacity-50' : 'opacity-100',
                  ].join(' ')}>
                  <Ico icon={XCircleIcon} sm /> Suspender
                </button>
              )}
              {podeAlterarStatus && selected.status !== 'inativo' && (
                <button onClick={() => changeStatus('inativo')} disabled={statusLoading || isMatriculaPendente(selected)}
                  title={isMatriculaPendente(selected) ? 'Matrícula pendente de confirmação — ação bloqueada até à aprovação do pagamento.' : undefined}
                  className={[
                    'flex gap-1.5 items-center py-2 px-3.5 min-h-11 sm:min-h-0 text-[12.5px] text-neutral-500 rounded-sm border cursor-pointer transition-colors duration-200 border-neutral-500/25 bg-neutral-500/[0.08] hover:bg-neutral-500/[0.16] active:bg-neutral-500/[0.16]',
                    'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                    statusLoading || isMatriculaPendente(selected) ? 'opacity-50' : 'opacity-100',
                  ].join(' ')}>
                  <Ico icon={XCircleIcon} sm /> Tornar Inativo
                </button>
              )}
            </div>
          </div>

          {/* Campos de dados */}
          {[
            ['NIF',        selected.nif || '—'],
            ['Telefone',   selected.telefone || '—'],
            ['Nascimento', selected.dataNascimento ? `${selected.dataNascimento}${idade !== null ? ` (${idade} anos)` : ''}` : '—'],
            ['Matrícula',  selected.dataMatricula || '—'],
            ['Plano',      selected.plano || '—'],
            ['Faixa',      <BeltBadge faixa={selected.faixa} grau={selected.grau} size="md" />],
            ['Frequência', `${selected.frequencia || 0}%`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-border-subtle">
              <span className="text-[12.5px] text-muted">{k}</span>
              <span className="text-[12.5px] font-medium text-primary">{v}</span>
            </div>
          ))}

          {/* Status */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[12.5px] text-muted">Status</span>
            <Badge color={statusBadgeColor(statusEfetivo(selected))}>
              {isMatriculaPendente(selected)
                ? <><Ico icon={ClockIcon} sm />Pendente</>
                : selected.status === 'ativo'
                ? <><Ico icon={CircleIcon} sm className="text-gb-green" />Ativo</>
                : selected.status === 'suspenso'
                  ? <><Ico icon={BanIcon} sm />Suspenso</>
                  : <><Ico icon={CircleIcon} sm className="text-neutral-400" />Inativo</>}
            </Badge>
          </div>

          {/* Secção de responsáveis — só para menores */}
          {menor && <ResponsaveisSection aluno={selected} />}
        </div>
      </div>
    );
  };

  return (
    <div>
      {showMatricula && (
        <NovaMatriculaModal onClose={() => setShowMatricula(false)} onSuccess={() => { setShowMatricula(false); invalidate(); }} />
      )}
      {editModal && selected && (
        <EditAlunoModal aluno={selected} onClose={() => {
          setEditModal(false);
          invalidate();
          setSelected(null);
        }} />
      )}

      <PageHeader
        eyebrow="Academia"
        title={<>Alunos <span className="text-sm font-normal text-muted">({filtered.length}{filtered.length !== alunos.length ? ` de ${alunos.length}` : ''})</span></>}
        actions={
          <Button variant="primary" className="whitespace-nowrap" onClick={() => setShowMatricula(true)}>
            <Ico icon={PlusIcon} sm /> Nova Matrícula
          </Button>
        }
      />

      {/* Filtros */}
      <div className="py-3.5 px-4 mb-4 rounded-lg border border-border bg-card">
        {/* Linha 1: Pesquisa + Ordenação */}
        <div className="flex flex-wrap gap-2.5 mb-2.5">
          <div className="flex relative flex-1 items-center min-w-[180px]">
            <Ico icon={FunnelIcon} sm className="absolute left-2.5 pointer-events-none text-muted" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Pesquisar por nome ou email..."
              className="box-border py-2 pr-3 pl-8 w-full min-h-11 sm:min-h-0 text-[12.5px] rounded-sm border outline-none transition-all duration-200 border-border bg-card text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25" />
          </div>
          <div className="flex gap-1.5 items-center">
            <Ico icon={AdjustmentsHorizontalIcon} sm className="shrink-0 text-muted" />
            <Select variant="sm" value={sortBy} onChange={e => setFilter(setSortBy)(e.target.value as typeof sortBy)}>
              <option value="nome-az">Nome A→Z</option>
              <option value="nome-za">Nome Z→A</option>
              <option value="faixa-asc">Faixa ↑</option>
              <option value="faixa-desc">Faixa ↓</option>
              <option value="freq-desc">Frequência ↓</option>
            </Select>
          </div>
        </div>

        {/* Linha 2: Status + Faixa + Graduáveis */}
        <div className="flex flex-wrap gap-2 items-center">
          {['todos','ativo','pendente','suspenso','inativo'].map(f => (
            <button key={f} onClick={() => setFilter(setFiltroStatus)(f)}
              className={[
                'py-1 px-3 min-h-11 sm:min-h-0 text-xs capitalize rounded-sm border cursor-pointer transition-colors duration-200',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                filtroStatus === f ? 'font-bold text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'font-normal text-secondary bg-elevated border-border hover:bg-border-subtle active:bg-border-subtle',
              ].join(' ')}>
              {f === 'todos' ? 'Todos' : f}
            </button>
          ))}

          {faixasDisponiveis.length > 0 && (
            <Select variant="sm" value={filtroFaixa} onChange={e => setFilter(setFiltroFaixa)(e.target.value)}>
              <option value="todas">Todas as faixas</option>
              {faixasDisponiveis.map(f => (
                <option key={f as string} value={f as string}>{(beltConfig[f as string]?.label) || f}</option>
              ))}
            </Select>
          )}

          <label className="flex gap-1.5 items-center py-1.5 ml-auto cursor-pointer">
            <input type="checkbox" checked={soGraduaveis} onChange={e => { setSoGraduaveis(e.target.checked); setPage(1); }}
              className="w-3.5 h-3.5 accent-gb-red" />
            <span className="text-xs whitespace-nowrap text-secondary">Elegíveis p/ graduação</span>
          </label>
        </div>
      </div>

      {/* Conteúdo */}
      {selected ? renderPerfil() : (
        <div>
          <div className="flex flex-col gap-2">
            {alunosLoading ? (
              <SkeletonList rows={6} />
            ) : paginated.length === 0 ? (
              <div className="p-10 text-center text-muted">
                {search || filtroFaixa !== 'todas' || filtroStatus !== 'todos' || soGraduaveis
                  ? 'Nenhum aluno corresponde aos filtros activos.'
                  : 'Ainda não há alunos. Clica em "+ Nova Matrícula".'}
              </div>
            ) : paginated.map((a: any) => {
              const idade   = calcularIdade(a.dataNascimento);
              const menor   = eMenor(a.dataNascimento);
              return (
                <button key={a.id} onClick={() => setSelected(a)}
                  className="flex gap-3.5 items-center py-3.5 px-[18px] w-full text-left rounded-lg border cursor-pointer transition-colors duration-200 border-border bg-card hover:bg-elevated active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
                  <div className="flex justify-center items-center w-10 h-10 text-[15px] font-bold rounded-full shrink-0 bg-elevated text-secondary">
                    {a.nome?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex overflow-hidden gap-1.5 items-center text-sm font-semibold text-primary">
                      <span className="overflow-hidden shrink whitespace-nowrap text-ellipsis min-w-0">{a.nome}</span>
                      {menor && (
                        <span className="py-0.5 px-1.5 text-[9.5px] font-bold whitespace-nowrap rounded-full shrink-0 text-amber-600 bg-amber-600/[0.12]">
                          {idade}a · Menor
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden text-xs whitespace-nowrap text-ellipsis text-muted">{a.email} · {a.plano || '—'}</div>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <BeltBadge faixa={a.faixa} grau={a.grau} size="sm" />
                    <Badge color={statusBadgeColor(statusEfetivo(a))}>{statusEfetivo(a)}</Badge>
                    <FontAwesomeIcon icon={ChevronRightIcon} className="w-4 h-4 text-muted" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-3 mt-4 border-t border-border">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className={[
                  'flex gap-1 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[13px] rounded-sm border transition-colors duration-200 border-border bg-card',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                  safePage === 1 ? 'text-muted opacity-50' : 'cursor-pointer text-primary opacity-100 hover:bg-elevated active:bg-elevated',
                ].join(' ')}>
                <FontAwesomeIcon icon={ChevronLeftIcon} className="w-[15px] h-[15px]" /> Anterior
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => p === '…'
                    ? <span key={`e${i}`} className="px-1 leading-8 text-muted">…</span>
                    : <button key={p} onClick={() => setPage(p as number)}
                        className={[
                          'flex justify-center items-center w-8 h-8 min-h-11 sm:min-h-0 text-[13px] rounded-md border cursor-pointer transition-colors duration-200',
                          'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                          p === safePage ? 'font-bold text-white bg-gb-red border-gb-red hover:bg-gb-red-dark active:bg-gb-red-dark' : 'font-normal text-secondary bg-card border-border hover:bg-elevated active:bg-elevated',
                        ].join(' ')}>
                        {p}
                      </button>
                  )}
              </div>

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className={[
                  'group flex gap-1 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 text-[13px] rounded-sm border transition-colors duration-200 border-border bg-card',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 disabled:cursor-not-allowed',
                  safePage === totalPages ? 'text-muted opacity-50' : 'cursor-pointer text-primary opacity-100 hover:bg-elevated active:bg-elevated',
                ].join(' ')}>
                Próximo <FontAwesomeIcon icon={ChevronRightIcon} className="w-[15px] h-[15px] transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {/* Contador de resultados */}
          {!alunosLoading && filtered.length > 0 && (
            <div className={['text-[11.5px] text-center text-muted', totalPages > 1 ? 'mt-1' : 'mt-3'].join(' ')}>
              A mostrar {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} alunos
            </div>
          )}
        </div>
      )}
    </div>
  );
}
