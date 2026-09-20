import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { useAlunos, useGruposFamiliares, usePagamentos } from '../../lib/useData';
import { criarPortalSession } from '../../services/api/edgeFunctions';
import { fmtData } from '../../lib/financeiro';
import { GBLogoFull } from '../../components/GBLogo';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { SkeletonList } from '../../components/common/Skeleton';
import { Ico, Cog6ToothIcon, CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '../../lib/icons';

const money = (n: number) => `€${n.toFixed(2)}`;

/**
 * Portal do responsável de pagamentos de um plano família que NÃO treina
 * (role 'encarregado', sem linha `alunos`). Só faturação: estado da subscrição,
 * membros cobertos, histórico, e o botão para o Stripe Customer Portal.
 */
export default function PortalEncarregado() {
  const { user, logout } = useAuth();
  const { data: grupos } = useGruposFamiliares();
  const { data: alunos } = useAlunos();
  const { data: pagamentos } = usePagamentos();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const grupo = grupos.find(g => g.titularEmail.toLowerCase() === (user?.email || '').toLowerCase());
  if (!grupo) return <div className="p-8"><SkeletonList rows={4} /></div>;

  const membros = alunos.filter(a => a.grupoFamiliarId === grupo.id);
  const pags = [...pagamentos.filter(p => (p as { grupoFamiliarId?: string }).grupoFamiliarId === grupo.id)]
    .sort((a, b) => b.vencimento.localeCompare(a.vencimento));

  const emDia = grupo.status === 'ativo';

  const gerir = async () => {
    if (ocupado) return;
    setErro(''); setOcupado(true);
    try {
      const { url } = await criarPortalSession();
      window.location.assign(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível abrir a gestão da subscrição.');
      setOcupado(false);
    }
  };

  return (
    <div className="min-h-screen font-ui bg-base">
      <header className="flex sticky top-0 z-50 justify-between items-center px-5 h-16 border-b border-border bg-card">
        <GBLogoFull size={44} />
        <button onClick={logout} className="text-[12px] font-semibold text-gb-red hover:underline">Terminar sessão</button>
      </header>

      <div className="mx-auto py-8 px-5 max-w-[640px]">
        <div className="mb-5">
          <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Responsável de pagamentos</div>
          <h1 className="font-display text-xl font-black uppercase text-primary">{user?.nome || grupo.titularNome}</h1>
        </div>

        {/* Estado da subscrição */}
        <div className={['p-5 rounded-xl border', emDia ? 'border-gb-green/25 bg-gb-green/[0.06]' : 'border-gb-red/30 bg-gb-red/[0.06]'].join(' ')}>
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between items-start">
            <div>
              <div className={['inline-flex gap-1.5 items-center text-xs font-bold', emDia ? 'text-gb-green-dark' : 'text-gb-red'].join(' ')}>
                <Ico icon={emDia ? CheckCircleIcon : ExclamationTriangleIcon} sm />
                {emDia ? 'Débito automático ativo' : grupo.status === 'suspenso' ? 'Subscrição suspensa' : 'Subscrição inativa'}
              </div>
              <div className="mt-1.5 text-[13px] text-secondary">
                Plano <strong>{grupo.planoNome}</strong> · {membros.length} praticante{membros.length === 1 ? '' : 's'}
              </div>
            </div>
            <button
              onClick={gerir} disabled={ocupado}
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
          {erro && <div className="mt-2.5 text-xs font-semibold text-gb-red">{erro}</div>}
        </div>

        {/* Membros */}
        <Card padding="lg" className="mt-4">
          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Praticantes cobertos</div>
          <div className="divide-y divide-border-subtle">
            {membros.map(m => (
              <div key={m.id} className="flex gap-3 justify-between items-center py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate text-primary">{m.nome}</div>
                  <div className="mt-0.5 text-[11px] truncate text-muted">{m.email}</div>
                </div>
                <Badge color={m.status === 'ativo' ? 'success' : m.status === 'suspenso' ? 'danger' : 'neutral'}>{m.status}</Badge>
              </div>
            ))}
            {membros.length === 0 && <p className="py-3 text-[13px] text-center text-muted">A carregar praticantes…</p>}
          </div>
        </Card>

        {/* Histórico */}
        <Card padding="lg" className="mt-4">
          <div className="mb-3 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted">Histórico de pagamentos</div>
          {pags.length === 0 ? (
            <p className="py-3 text-[13px] text-center text-muted">Ainda não há pagamentos.</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {pags.map(p => (
                <div key={p.id} className="flex gap-3 justify-between items-center py-3">
                  <div>
                    <div className="text-[13px] font-medium text-primary">{p.plano}</div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {p.status === 'pago' && p.pagamento ? `Pago a ${fmtData(p.pagamento)}` : `Vencimento ${fmtData(p.vencimento)}`}
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className="font-mono text-[13px] font-bold text-primary">{money(p.valor)}</span>
                    <Badge color={p.status === 'pago' ? 'success' : p.status === 'vencido' ? 'danger' : 'warning'}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
