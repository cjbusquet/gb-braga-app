import { useState } from 'react';
import { usePagamentos, useAlunos, useGruposFamiliares } from '../../lib/useData';
import type { GrupoFamiliar } from '../../lib/useData';
import { ACADEMIA, mockTocDocumentos } from '../../data/mockData';
import { useAuth } from '../../lib/auth';
import { criarCheckoutSession, criarPortalSession } from '../../services/api/edgeFunctions';
import { classificarFinanceiro, fmtData, rotuloPagamento } from '../../lib/financeiro';
import type { SituacaoFinanceira } from '../../lib/financeiro';
import type { Pagamento } from '../../types';
import {
  CreditCardIcon, ExclamationTriangleIcon, CheckCircleIcon, ClockIcon,
  ArrowPathIcon, ArrowDownTrayIcon, BoltIcon, Cog6ToothIcon, Ico,
} from '../../lib/icons';
import PortalPageHeader from './PortalPageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { SkeletonList } from '../../components/common/Skeleton';

const money = (n: number): string => `€${n.toFixed(2)}`;
const plural = (n: number, s: string, p: string): string => `${n} ${n === 1 ? s : p}`;

export default function MeuFinanceiro() {
  const { data: pagamentos } = usePagamentos();
  const { data: alunos } = useAlunos();
  const { data: grupos } = useGruposFamiliares();
  const { user } = useAuth();
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<null | 'ativar' | 'portal'>(null);
  const [erro, setErro] = useState('');

  const aluno = alunos.find(a => a.email === user?.email) || alunos[0];
  if (!aluno) return <SkeletonList rows={4} />;

  const pags = [...pagamentos.filter(p => p.alunoId === aluno.id)]
    .sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  const faturas = mockTocDocumentos.filter(d => d.alunoNome === aluno.nome);
  const sit = classificarFinanceiro(pags);
  const mensalidade = pags[0]?.valor;
  const plano = aluno.plano || pags[0]?.plano;
  const temSubscricao = !!aluno.stripeSubId;
  const eNumerario = aluno.metodoPagamento === 'numerario';
  const grupo = aluno.grupoFamiliarId ? grupos.find(g => g.id === aluno.grupoFamiliarId) : undefined;

  const pagar = async (pg?: Pagamento) => {
    if (!pg || pagandoId) return;
    setErro('');
    setPagandoId(pg.id);
    try {
      const { url } = await criarCheckoutSession({ pagamentoId: pg.id });
      window.location.assign(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível iniciar o pagamento. Tenta de novo.');
      setPagandoId(null);
    }
  };

  const redirecionar = (acao: 'ativar' | 'portal') => async () => {
    if (ocupado) return;
    setErro('');
    setOcupado(acao);
    try {
      const { url } = acao === 'ativar'
        ? await criarCheckoutSession({ planoId: aluno.planoId })
        : await criarPortalSession();
      window.location.assign(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Algo correu mal. Tenta de novo.');
      setOcupado(null);
    }
  };

  return (
    <div>
      <PortalPageHeader
        title="Meu Financeiro"
        description="A tua mensalidade, o histórico e as faturas."
      />

      {aluno.grupoFamiliarId ? (
        <PlanoFamiliaMembro
          grupo={grupo} plano={plano} souTitular={grupo?.titularEmail === user?.email}
          ocupado={ocupado === 'portal'} erro={erro} onGerir={redirecionar('portal')}
        />
      ) : !eNumerario ? (
        temSubscricao
          ? <SubscricaoAtiva
              plano={plano} mensalidade={mensalidade} sit={sit}
              ocupado={ocupado === 'portal'} onGerir={redirecionar('portal')}
              pagandoId={pagandoId} onPagar={pagar}
            />
          : <AtivarDebito
              plano={plano} mensalidade={mensalidade}
              ocupado={ocupado === 'ativar'} erro={erro} onAtivar={redirecionar('ativar')}
            />
      ) : null}

      {!aluno.grupoFamiliarId && (eNumerario || (!temSubscricao && sit.aRegularizar)) && (
        <HeroFinanceiro
          sit={sit} plano={plano} mensalidade={mensalidade}
          pagandoId={pagandoId} erro={erro} onPagar={pagar}
          className={!eNumerario ? 'mt-4' : ''}
        />
      )}

      {/* Histórico */}
      <Card padding="lg" className="mt-4">
        <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Histórico de pagamentos
        </div>
        {pags.length === 0 ? (
          <p className="py-4 text-[13px] text-center text-muted">Ainda não há pagamentos.</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {pags.map(p => {
              const r = rotuloPagamento(p);
              return (
                <div key={p.id} className="flex gap-3 justify-between items-center py-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate text-primary">{p.plano}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {p.status === 'pago' && p.pagamento
                        ? `Pago a ${fmtData(p.pagamento)}`
                        : `Vencimento ${fmtData(p.vencimento)}`}
                    </div>
                  </div>
                  <div className="flex gap-3 items-center shrink-0">
                    <span className="font-mono text-[13px] font-bold text-primary">{money(p.valor)}</span>
                    <Badge color={r.cor}>{r.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Faturas */}
      <Card padding="lg" className="mt-4">
        <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">
          Faturas certificadas (TOConline)
        </div>
        {faturas.length > 0 ? (
          <div className="divide-y divide-border-subtle">
            {faturas.map(f => (
              <div key={f.id} className="flex gap-3 justify-between items-center py-3">
                <div className="min-w-0">
                  <div className="font-mono text-[12.5px] font-bold truncate text-primary">{f.numero}</div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {fmtData(f.dataEmissao)} · inclui IVA {money(f.ivaTotal)}
                  </div>
                </div>
                <div className="flex gap-2.5 items-center shrink-0">
                  <span className="font-mono text-[13px] font-bold text-primary">{money(f.valorTotal)}</span>
                  {f.pdfUrl && (
                    <a href={f.pdfUrl} target="_blank" rel="noreferrer"
                      className="inline-flex gap-1 items-center py-1 px-2 text-[11px] font-semibold no-underline rounded border transition-colors text-gb-green border-gb-green/20 bg-gb-green/10 hover:bg-gb-green/20 active:bg-gb-green/20 outline-none focus-visible:ring-2 focus-visible:ring-gb-green focus-visible:ring-offset-2">
                      <Ico icon={ArrowDownTrayIcon} sm />PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-3 text-[13px] leading-[1.6] text-center text-muted">
            Ainda não há faturas. São emitidas automaticamente depois de cada pagamento confirmado.
          </p>
        )}
      </Card>
    </div>
  );
}

// ── Cartão de estado ─────────────────────────────────────────────────────────

interface HeroProps {
  sit: SituacaoFinanceira;
  plano?: string;
  mensalidade?: number;
  pagandoId: string | null;
  erro: string;
  onPagar: (pg?: Pagamento) => void;
  className?: string;
}

const TEMA = {
  em_atraso: { wrap: 'border-gb-red/30 bg-gb-red/[0.06]',        fg: 'text-gb-red',         icon: ExclamationTriangleIcon },
  a_vencer:  { wrap: 'border-amber-500/30 bg-amber-500/[0.08]',  fg: 'text-amber-600',      icon: ClockIcon },
  em_dia:    { wrap: 'border-gb-green/25 bg-gb-green/[0.06]',     fg: 'text-gb-green-dark',  icon: CheckCircleIcon },
} as const;

function HeroFinanceiro({ sit, plano, mensalidade, pagandoId, erro, onPagar, className }: HeroProps) {
  const { estado, emAberto, totalEmAberto, aRegularizar, proximaCobranca, dias } = sit;
  const t = TEMA[estado];

  return (
    <div className={['p-5 rounded-xl border', t.wrap, className || ''].join(' ')}>
      <div className={['inline-flex gap-1.5 items-center text-xs font-bold', t.fg].join(' ')}>
        <Ico icon={t.icon} sm />
        {estado === 'em_atraso'
          ? (emAberto.length > 1 ? `${emAberto.length} mensalidades em atraso` : 'Pagamento em atraso')
          : estado === 'a_vencer' ? 'Pagamento a vencer' : 'Estás em dia'}
      </div>

      {estado === 'em_dia' ? (
        <>
          <p className="mt-1.5 text-[13px] text-secondary">Não tens nada a pagar de momento.</p>
          {proximaCobranca && (
            <div className="flex flex-wrap gap-x-3 gap-y-2 justify-between items-center pt-3 mt-3 border-t border-border/60">
              <div className="text-[12.5px] text-secondary">
                <span className="text-muted">Próxima mensalidade: </span>
                <span className="font-mono font-bold text-primary">{money(proximaCobranca.valor)}</span>
                {` · ${fmtData(proximaCobranca.vencimento)}`}
                {dias != null && dias > 0 && (
                  <span className="text-muted"> (daqui a {plural(dias, 'dia', 'dias')})</span>
                )}
              </div>
              <PagarButton
                small label="Pagar já"
                loading={pagandoId === proximaCobranca.id}
                onClick={() => onPagar(proximaCobranca)}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-1.5 font-mono text-[26px] font-extrabold leading-none text-primary">
            {money(estado === 'em_atraso' ? totalEmAberto : aRegularizar!.valor)}
          </div>
          <div className="mt-2 text-[12.5px] text-secondary">
            {estado === 'em_atraso' ? (
              <>Venceu {fmtData(aRegularizar!.vencimento)}
                {dias != null && <span className={t.fg}> · há {plural(Math.abs(dias), 'dia', 'dias')}</span>}</>
            ) : dias === 0 ? (
              <span className={t.fg}>Vence hoje</span>
            ) : (
              <>Vence {fmtData(aRegularizar!.vencimento)}
                {dias != null && <span className="text-muted"> · daqui a {plural(dias, 'dia', 'dias')}</span>}</>
            )}
          </div>
          {emAberto.length > 1 && (
            <div className="mt-1 text-[11px] text-muted">
              Paga primeiro a mais antiga ({fmtData(aRegularizar!.vencimento)}). Cada mensalidade tem a sua fatura.
            </div>
          )}

          {erro && <div className="mt-2.5 text-xs font-semibold text-gb-red">{erro}</div>}

          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mt-3.5">
            <PagarButton
              label={estado === 'em_atraso' ? `Pagar ${money(aRegularizar!.valor)}` : 'Pagar agora'}
              loading={pagandoId === aRegularizar!.id}
              onClick={() => onPagar(aRegularizar)}
            />
            <a
              href={`https://wa.me/${ACADEMIA.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Olá! Queria regularizar o pagamento de ${money(estado === 'em_atraso' ? totalEmAberto : aRegularizar!.valor)} (${aRegularizar!.plano}).`,
              )}`}
              target="_blank" rel="noreferrer"
              className="text-[12px] text-muted underline-offset-2 hover:text-primary hover:underline"
            >
              ou falar com a receção
            </a>
          </div>
        </>
      )}

      {mensalidade != null && (
        <div className="pt-3 mt-3 text-[11px] text-muted border-t border-border/60">
          {plano ? `${plano} · ` : ''}{money(mensalidade)}/mês
        </div>
      )}
    </div>
  );
}

function PagarButton({ label, loading, small, icon = CreditCardIcon, onClick }: {
  label: string; loading: boolean; small?: boolean; icon?: typeof CreditCardIcon; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick} disabled={loading}
      className={[
        'inline-flex gap-1.5 justify-center items-center font-bold text-white rounded-md border-none transition-all bg-[#635BFF]',
        small ? 'py-2 px-3.5 text-[12px] min-h-9' : 'py-3 px-5 text-[13px] min-h-11',
        'outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF] focus-visible:ring-offset-2',
        loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-[#5851E6] active:scale-[0.98] active:shadow-none',
      ].join(' ')}
    >
      <Ico icon={loading ? ArrowPathIcon : icon} sm className={loading ? 'animate-spin' : ''} />
      {loading ? 'A abrir Stripe…' : label}
    </button>
  );
}

// ── Membro de um plano família ──────────────────────────────────────────────

function PlanoFamiliaMembro({ grupo, plano, souTitular, ocupado, erro, onGerir }: {
  grupo?: GrupoFamiliar; plano?: string; souTitular: boolean;
  ocupado: boolean; erro: string; onGerir: () => void;
}) {
  const emAtraso = grupo?.status !== 'ativo';
  const wrap = emAtraso ? 'border-gb-red/30 bg-gb-red/[0.06]' : 'border-gb-green/25 bg-gb-green/[0.06]';
  const fg = emAtraso ? 'text-gb-red' : 'text-gb-green-dark';
  return (
    <div className={['p-5 rounded-xl border', wrap].join(' ')}>
      <div className={['inline-flex gap-1.5 items-center text-xs font-bold', fg].join(' ')}>
        <Ico icon={emAtraso ? ExclamationTriangleIcon : CheckCircleIcon} sm />
        {emAtraso ? 'Plano família com pagamento em falta' : 'Coberto pelo plano família'}
      </div>
      <p className="mt-1.5 text-[13px] text-secondary">
        {plano ? <>Plano <strong>{plano}</strong>. </> : null}
        {souTitular
          ? 'És tu o responsável de pagamentos desta família.'
          : <>O pagamento é gerido por <strong>{grupo?.titularNome || 'o responsável da família'}</strong>.</>}
        {emAtraso && !souTitular && ' Fala com o responsável para regularizar.'}
      </p>
      {emAtraso && souTitular && (
        <>
          {erro && <div className="mt-2.5 text-xs font-semibold text-gb-red">{erro}</div>}
          <div className="mt-3">
            <PagarButton label="Ativar pagamento" icon={Cog6ToothIcon} loading={ocupado} onClick={onGerir} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Débito automático ────────────────────────────────────────────────────────

function AtivarDebito({ plano, mensalidade, ocupado, erro, onAtivar }: {
  plano?: string; mensalidade?: number; ocupado: boolean; erro: string; onAtivar: () => void;
}) {
  return (
    <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.07]">
      <div className="inline-flex gap-1.5 items-center text-xs font-bold text-amber-600">
        <Ico icon={BoltIcon} sm />Ativa o débito automático
      </div>
      <p className="mt-1.5 text-[13px] leading-[1.6] text-secondary">
        Paga a mensalidade automaticamente com o teu cartão, sem prazos para lembrar,
        cancelas quando quiseres.
      </p>
      {mensalidade != null && (
        <div className="mt-2 font-mono text-[22px] font-extrabold leading-none text-primary">
          {money(mensalidade)}<span className="text-[13px] font-normal text-muted">/mês</span>
        </div>
      )}
      {erro && <div className="mt-2.5 text-xs font-semibold text-gb-red">{erro}</div>}
      <div className="mt-3.5">
        <PagarButton label="Ativar débito automático" icon={BoltIcon} loading={ocupado} onClick={onAtivar} />
      </div>
      {plano && (
        <div className="pt-3 mt-3 text-[11px] text-muted border-t border-border/60">Plano {plano}</div>
      )}
    </div>
  );
}

function SubscricaoAtiva({ plano, mensalidade, sit, ocupado, onGerir, pagandoId, onPagar }: {
  plano?: string; mensalidade?: number; sit: SituacaoFinanceira;
  ocupado: boolean; onGerir: () => void;
  pagandoId: string | null; onPagar: (pg?: Pagamento) => void;
}) {
  const emAtraso = sit.estado === 'em_atraso';

  if (emAtraso) {
    return (
      <div className="p-5 rounded-xl border border-gb-red/30 bg-gb-red/[0.06]">
        <div className="inline-flex gap-1.5 items-center text-xs font-bold text-gb-red">
          <Ico icon={ExclamationTriangleIcon} sm />Mensalidade em atraso
        </div>
        <div className="mt-1.5 font-mono text-[24px] font-extrabold leading-none text-primary">
          {money(sit.totalEmAberto)}
        </div>
        <p className="mt-2 text-[12.5px] text-secondary">
          A cobrança automática falhou. Atualiza o cartão e a Stripe volta a tentar.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center mt-3.5">
          <PagarButton label="Atualizar cartão" icon={Cog6ToothIcon} loading={ocupado} onClick={onGerir} />
          {sit.aRegularizar && (
            <PagarButton
              small label={`Pagar ${money(sit.aRegularizar.valor)} agora`}
              loading={pagandoId === sit.aRegularizar.id}
              onClick={() => onPagar(sit.aRegularizar)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-gb-green/25 bg-gb-green/[0.06]">
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between items-start">
        <div>
          <div className="inline-flex gap-1.5 items-center text-xs font-bold text-gb-green-dark">
            <Ico icon={CheckCircleIcon} sm />Débito automático ativo
          </div>
          <div className="mt-1.5 text-[13px] text-secondary">
            <span className="font-mono font-bold text-primary">{mensalidade != null ? money(mensalidade) : ''}</span>
            {mensalidade != null ? '/mês' : ''}{plano ? ` · ${plano}` : ''}
          </div>
          {sit.proximaCobranca && (
            <div className="mt-1 text-[11.5px] text-muted">
              Próxima cobrança · {fmtData(sit.proximaCobranca.vencimento)}
            </div>
          )}
        </div>
        <button
          onClick={onGerir} disabled={ocupado}
          className={[
            'inline-flex gap-1.5 items-center py-2 px-3.5 min-h-9 text-[12px] font-semibold rounded-md border transition-colors',
            'border-border bg-card text-secondary outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
            ocupado ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-elevated active:bg-elevated',
          ].join(' ')}
        >
          <Ico icon={ocupado ? ArrowPathIcon : Cog6ToothIcon} sm className={ocupado ? 'animate-spin' : ''} />
          Gerir
        </button>
      </div>
    </div>
  );
}
