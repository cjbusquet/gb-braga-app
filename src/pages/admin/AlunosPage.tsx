/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useResponsaveis, db } from '../../lib/useData';
import { useAlunosQuery, useInvalidateAlunos } from '../../lib/queries';
import { GB, beltConfig } from '../../lib/gbBrand';
import { useMobile } from '../../lib/useMobile';
import NovaMatriculaModal from './NovaMatriculaModal';
import { Ico, PencilIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, XMarkIcon, PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '../../lib/icons';

const PAGE_SIZE = 20;

const FAIXAS_ORDER = [
  'branca','cinza-branca','cinza','cinza-preta',
  'amarela-branca','amarela','amarela-preta',
  'laranja-branca','laranja','laranja-preta',
  'verde-branca','verde','verde-preta',
  'azul','roxa','marrom','preta',
];

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

// ── EditAlunoModal ──────────────────────────────────────────────────────────

function EditAlunoModal({ aluno, onClose }: { aluno: any; onClose: () => void }) {
  const [nome, setNome]           = useState(aluno.nome || '');
  const [email, setEmail]         = useState(aluno.email || '');
  const [telefone, setTel]        = useState(aluno.telefone || '');
  const [nif, setNif]             = useState(aluno.nif || '');
  const [dataNasc, setDataNasc]   = useState(aluno.dataNascimento || '');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const idade = calcularIdade(dataNasc);

  const handleSave = async () => {
    if (!dataNasc) return;
    setSaving(true);
    try {
      await db.atualizarAluno(aluno.id, { nome, email, telefone, nif, dataNascimento: dataNasc });
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch(e) {
      console.error(e);
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 11px', color: 'var(--text-primary)',
    fontSize: 13, boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    display: 'block', color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 600,
    letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, maxWidth: 500, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 800 }}>Editar — {aluno.nome}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ico icon={XMarkIcon} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={lbl}>Nome completo</label>
            <input value={nome} onChange={e => setNome(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Telefone</label>
            <input value={telefone} onChange={e => setTel(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>NIF</label>
            <input value={nif} onChange={e => setNif(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Data de Nascimento *</label>
            <input type="date" value={dataNasc} onChange={e => setDataNasc(e.target.value)} style={{ ...inp, borderColor: !dataNasc ? 'rgba(200,16,46,0.5)' : undefined }} />
            {!dataNasc && <div style={{ color: '#C8102E', fontSize: 11, marginTop: 3 }}>Obrigatório</div>}
            {idade !== null && (
              <div style={{ marginTop: 4, fontSize: 11, color: idade < 18 ? '#D97706' : 'var(--text-muted)' }}>
                {idade} anos{idade < 18 ? (idade >= 12 ? ' · Menor · Check-in autónomo' : ' · Menor · Requer responsável') : ' · Adulto'}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || saved || !dataNasc} style={{ flex: 2, background: saved ? '#22C55E' : (saving || !dataNasc) ? '#aaa' : GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (saving || !dataNasc) ? 'not-allowed' : 'pointer' }}>
            {saved ? '✓ Guardado!' : saving ? 'A guardar...' : '💾 Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ResponsaveisSection ─────────────────────────────────────────────────────

const RELACAO_OPTS = ['pai', 'mae', 'avo', 'tutor', 'outro'];

const FORM_INIT = { nome: '', email: '', telefone: '', nif: '', tipoRelacao: 'pai', podeCheckin: true, eTitularFinanceiro: false };

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

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '7px 10px', color: 'var(--text-primary)', fontSize: 12.5,
    boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    display: 'block', color: 'var(--text-muted)', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 3,
  };

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
            Responsáveis
          </span>
          {autonomo && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 7px', borderRadius: 99 }}>
              Check-in autónomo
            </span>
          )}
          {!autonomo && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, background: 'rgba(217,119,6,0.1)', color: '#D97706', padding: '2px 7px', borderRadius: 99 }}>
              Requer responsável p/ check-in
            </span>
          )}
        </div>
        <button
          onClick={() => { setAdding(a => !a); setForm(FORM_INIT); }}
          style={{ background: adding ? 'var(--bg-elevated)' : 'transparent', border: `1px solid ${adding ? 'var(--border)' : GB.red}`, borderRadius: 6, padding: '4px 12px', color: adding ? 'var(--text-muted)' : GB.red, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
        >
          {adding ? 'Cancelar' : '+ Adicionar'}
        </button>
      </div>

      {/* Lista de responsáveis */}
      {vinculos.length === 0 && !adding && (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '6px 0' }}>
          Nenhum responsável registado.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {vinculos.map((v: any) => (
          <div key={v.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Avatar */}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(200,16,46,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GB.red, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
              {v.responsavel.nome.charAt(0)}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{v.responsavel.nome}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 1 }}>
                {v.responsavel.telefone || v.responsavel.email || '—'}
              </div>
            </div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(99,102,241,0.1)', color: '#6366F1', padding: '2px 7px', borderRadius: 99 }}>
                {RELACAO_LABELS[v.tipoRelacao] ?? v.tipoRelacao}
              </span>
              {v.podeCheckin && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 7px', borderRadius: 99 }}>
                  Check-in
                </span>
              )}
              {v.eTitularFinanceiro && (
                <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(217,119,6,0.1)', color: '#D97706', padding: '2px 7px', borderRadius: 99 }}>
                  Fatura
                </span>
              )}
            </div>
            {/* Remove */}
            <button
              onClick={() => handleRemove(v.id)}
              disabled={removingId === v.id}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, opacity: removingId === v.id ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ico icon={TrashIcon} sm />
            </button>
          </div>
        ))}
      </div>

      {/* Formulário inline de adição */}
      {adding && (
        <div style={{ marginTop: 10, background: 'var(--bg-elevated)', border: `1px solid ${GB.red}30`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
            Novo Responsável
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Nome completo *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do responsável" style={inp} />
            </div>
            <div>
              <label style={lbl}>Telefone</label>
              <input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="+351 9XX XXX XXX" style={inp} />
            </div>
            <div>
              <label style={lbl}>NIF</label>
              <input value={form.nif} onChange={e => setForm(f => ({ ...f, nif: e.target.value }))} placeholder="000000000" style={inp} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Relação</label>
              <select value={form.tipoRelacao} onChange={e => setForm(f => ({ ...f, tipoRelacao: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                {RELACAO_OPTS.map(r => <option key={r} value={r}>{RELACAO_LABELS[r]}</option>)}
              </select>
            </div>
          </div>

          {/* Permissões */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.podeCheckin} onChange={e => setForm(f => ({ ...f, podeCheckin: e.target.checked }))} />
              Pode fazer check-in
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={form.eTitularFinanceiro} onChange={e => setForm(f => ({ ...f, eTitularFinanceiro: e.target.checked }))} />
              Titular da fatura
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => { setAdding(false); setForm(FORM_INIT); }} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', color: 'var(--text-muted)', fontSize: 12.5, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleAdd} disabled={saving || !form.nome.trim()} style={{ flex: 2, background: saving || !form.nome.trim() ? '#aaa' : GB.red, border: 'none', borderRadius: 6, padding: '8px', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: saving || !form.nome.trim() ? 'not-allowed' : 'pointer' }}>
              {saving ? 'A guardar...' : '✓ Guardar Responsável'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AlunosPage ──────────────────────────────────────────────────────────────

export default function AlunosPage() {
  const { data: alunos = [], isLoading: alunosLoading } = useAlunosQuery();
  const invalidate = useInvalidateAlunos();
  const [search, setSearch]             = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroFaixa, setFiltroFaixa]   = useState('todas');
  const [soGraduaveis, setSoGraduaveis] = useState(false);
  const [sortBy, setSortBy]             = useState<'nome-az' | 'nome-za' | 'faixa-asc' | 'faixa-desc' | 'freq-desc'>('nome-az');
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState<any>(null);
  const [editModal, setEditModal]       = useState(false);
  const [showMatricula, setShowMatricula] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const { isMobile }                    = useMobile();

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
      alert('Erro ao alterar o estado do aluno. Tente novamente.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Faixas únicas presentes nos alunos (para o filtro de faixa)
  const faixasDisponiveis = useMemo(() =>
    [...new Set(alunos.map((a: any) => a.faixa).filter(Boolean))]
      .sort((a, b) => FAIXAS_ORDER.indexOf(a as string) - FAIXAS_ORDER.indexOf(b as string)),
  [alunos]);

  const filtered = useMemo(() => {
    let result = [...alunos] as any[];
    if (filtroStatus !== 'todos') result = result.filter(a => a.status === filtroStatus);
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
        case 'faixa-asc': return FAIXAS_ORDER.indexOf(a.faixa) - FAIXAS_ORDER.indexOf(b.faixa);
        case 'faixa-desc':return FAIXAS_ORDER.indexOf(b.faixa) - FAIXAS_ORDER.indexOf(a.faixa);
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

  // ── Perfil do aluno seleccionado ────────────────────────────
  const renderPerfil = () => {
    const idade = calcularIdade(selected.dataNascimento);
    const menor = eMenor(selected.dataNascimento);

    return (
      <div>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ico icon={ArrowLeftIcon} sm /> Voltar
        </button>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>

          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: GB.red, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                {selected.nome?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 17, fontWeight: 700 }}>{selected.nome}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selected.email}</div>
                {/* Badge de idade */}
                {idade !== null && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, background: menor ? 'rgba(217,119,6,0.1)' : 'rgba(99,102,241,0.1)', color: menor ? '#D97706' : '#6366F1', padding: '2px 8px', borderRadius: 99 }}>
                      {idade} anos{menor ? ' · Menor' : ' · Adulto'}
                    </span>
                    {menor && podeCheckinAutonomo(selected.dataNascimento) && (
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 8px', borderRadius: 99 }}>
                        Check-in autónomo (≥12)
                      </span>
                    )}
                    {menor && !podeCheckinAutonomo(selected.dataNascimento) && (
                      <span style={{ fontSize: 10.5, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#DC2626', padding: '2px 8px', borderRadius: 99 }}>
                        Requer responsável
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botões de acção */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setEditModal(true)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: 'var(--text-secondary)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ico icon={PencilIcon} sm /> Editar
              </button>
              {(selected.status === 'suspenso' || selected.status === 'inativo') && (
                <button onClick={() => changeStatus('ativo')} disabled={statusLoading} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#16A34A', fontSize: 12.5, cursor: 'pointer', opacity: statusLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ico icon={CheckCircleIcon} sm /> Reativar
                </button>
              )}
              {selected.status !== 'suspenso' && (
                <button onClick={() => changeStatus('suspenso')} disabled={statusLoading} style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#D97706', fontSize: 12.5, cursor: 'pointer', opacity: statusLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ico icon={XCircleIcon} sm /> Suspender
                </button>
              )}
              {selected.status !== 'inativo' && (
                <button onClick={() => changeStatus('inativo')} disabled={statusLoading} style={{ background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.25)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', color: '#6B7280', fontSize: 12.5, cursor: 'pointer', opacity: statusLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
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
            ['Faixa',      `${selected.faixa} · Grau ${selected.grau}`],
            ['Frequência', `${selected.frequencia || 0}%`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{k}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 500 }}>{v}</span>
            </div>
          ))}

          {/* Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>Status</span>
            <span style={{
              background: selected.status === 'ativo' ? 'rgba(34,197,94,0.1)' : selected.status === 'suspenso' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)',
              color:      selected.status === 'ativo' ? '#16A34A'             : selected.status === 'suspenso' ? '#D97706'             : '#6B7280',
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize',
            }}>
              {selected.status === 'ativo' ? '● Ativo' : selected.status === 'suspenso' ? '⛔ Suspenso' : '○ Inativo'}
            </span>
          </div>

          {/* Secção de responsáveis — só para menores */}
          {menor && <ResponsaveisSection aluno={selected} />}
        </div>
      </div>
    );
  };

  const inp: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
    color: 'var(--text-primary)', fontSize: 12.5,
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

      {/* Cabeçalho da página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3 }}>Academia</div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
            Alunos <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 400 }}>({filtered.length}{filtered.length !== alunos.length ? ` de ${alunos.length}` : ''})</span>
          </h1>
        </div>
        <button onClick={() => setShowMatricula(true)} style={{ background: GB.red, border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-red)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ico icon={PlusIcon} sm /> Nova Matrícula
        </button>
      </div>

      {/* Filtros */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 16 }}>
        {/* Linha 1: Pesquisa + Ordenação */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Ico icon={FunnelIcon} sm style={{ position: 'absolute', left: 10, color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input value={search} onChange={e => { setFilter(setSearch)(e.target.value); }} placeholder="Pesquisar por nome ou email..."
              style={{ ...inp, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ico icon={AdjustmentsHorizontalIcon} sm style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <select value={sortBy} onChange={e => setFilter(setSortBy)(e.target.value as typeof sortBy)} style={inp}>
              <option value="nome-az">Nome A→Z</option>
              <option value="nome-za">Nome Z→A</option>
              <option value="faixa-asc">Faixa ↑</option>
              <option value="faixa-desc">Faixa ↓</option>
              <option value="freq-desc">Frequência ↓</option>
            </select>
          </div>
        </div>

        {/* Linha 2: Status + Faixa + Graduáveis */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {['todos','ativo','suspenso','inativo'].map(f => (
            <button key={f} onClick={() => setFilter(setFiltroStatus)(f)}
              style={{ background: filtroStatus === f ? GB.red : 'var(--bg-elevated)', border: `1px solid ${filtroStatus === f ? GB.red : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '5px 12px', color: filtroStatus === f ? '#fff' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize', fontWeight: filtroStatus === f ? 700 : 400 }}>
              {f === 'todos' ? 'Todos' : f}
            </button>
          ))}

          {faixasDisponiveis.length > 0 && (
            <select value={filtroFaixa} onChange={e => setFilter(setFiltroFaixa)(e.target.value)} style={{ ...inp, fontSize: 12 }}>
              <option value="todas">Todas as faixas</option>
              {faixasDisponiveis.map(f => (
                <option key={f as string} value={f as string}>{(beltConfig[f as string]?.label) || f}</option>
              ))}
            </select>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
            <input type="checkbox" checked={soGraduaveis} onChange={e => { setSoGraduaveis(e.target.checked); setPage(1); }}
              style={{ accentColor: GB.red, width: 14, height: 14 }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap' }}>Elegíveis p/ graduação</span>
          </label>
        </div>
      </div>

      {/* Conteúdo */}
      {selected ? renderPerfil() : (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alunosLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 13 }}>A carregar alunos...</div>
            ) : paginated.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                {search || filtroFaixa !== 'todas' || filtroStatus !== 'todos' || soGraduaveis
                  ? 'Nenhum aluno corresponde aos filtros activos.'
                  : 'Ainda não há alunos. Clica em "+ Nova Matrícula".'}
              </div>
            ) : paginated.map((a: any) => {
              const beltCfg = beltConfig[a.faixa] || { bg: '#888', text: '#fff' };
              const idade   = calcularIdade(a.dataNascimento);
              const menor   = eMenor(a.dataNascimento);
              return (
                <div key={a.id} onClick={() => setSelected(a)}
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {a.nome?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0 }}>{a.nome}</span>
                      {menor && (
                        <span style={{ fontSize: 9.5, fontWeight: 700, background: 'rgba(217,119,6,0.12)', color: '#D97706', padding: '1px 6px', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          {idade}a · Menor
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email} · {a.plano || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ background: beltCfg.bg, color: beltCfg.text, fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 99, border: a.faixa === 'branca' ? '1px solid #ccc' : 'none' }}>
                      {(beltConfig[a.faixa]?.label) || a.faixa}
                    </span>
                    <span style={{ background: a.status === 'ativo' ? 'rgba(34,197,94,0.1)' : a.status === 'suspenso' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)', color: a.status === 'ativo' ? '#16A34A' : a.status === 'suspenso' ? '#D97706' : '#6B7280', fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                      {a.status}
                    </span>
                    <ChevronRightIcon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', color: safePage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13, cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.5 : 1 }}>
                <ChevronLeftIcon style={{ width: 15, height: 15 }} /> Anterior
              </button>

              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) => p === '…'
                    ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', lineHeight: '32px' }}>…</span>
                    : <button key={p} onClick={() => setPage(p as number)}
                        style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${p === safePage ? GB.red : 'var(--border)'}`, background: p === safePage ? GB.red : 'var(--bg-card)', color: p === safePage ? '#fff' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontWeight: p === safePage ? 700 : 400 }}>
                        {p}
                      </button>
                  )}
              </div>

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 14px', color: safePage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 13, cursor: safePage === totalPages ? 'not-allowed' : 'pointer', opacity: safePage === totalPages ? 0.5 : 1 }}>
                Próximo <ChevronRightIcon style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}

          {/* Contador de resultados */}
          {!alunosLoading && filtered.length > 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5, marginTop: totalPages > 1 ? 4 : 12 }}>
              A mostrar {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length} alunos
            </div>
          )}
        </div>
      )}
    </div>
  );
}
