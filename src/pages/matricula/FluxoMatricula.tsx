/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { usePlanos, db } from '../../lib/useData';
import { calcularIdade } from '../../lib/alunoDomain';
import { useAuth } from '../../lib/auth';
import { useUpdateProfile } from '../../hooks/useProfile';
import { criarCheckoutSession, criarMatriculaFamilia } from '../../services/api/edgeFunctions';
import { supabase, isConfigured } from '../../lib/supabaseClient';
import { GBLogoFull } from '../../components/GBLogo';
import Button from '../../components/common/Button';
import type { Plano } from '../../types';
import {
  Ico,
  type HeroIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DumbbellIcon,
  GamepadIcon,
  AddressCardIcon,
  PeopleRoofIcon,
  GemIcon,
  CheckIcon,
  CheckCircleIcon,
  ClockIcon,
  UserShieldIcon,
  CircleUserIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  ArrowsRotateIcon,
  CoinsIcon,
  FileInvoiceDollarIcon,
  LayerGroupIcon,
  UnlockIcon,
  PenNibIcon,
  InboxIcon,
} from '../../lib/icons';
import type { ReactNode } from 'react';

type Step = 'plano' | 'ficha' | 'contrato' | 'pagamento' | 'pendente' | 'completo';

interface FichaData {
  nomeAluno: string; dataNasc: string; nif: string; morada: string;
  codPostal: string; telefone: string; email: string; faixa: string;
  necessidades: string; temEE: boolean;
  nomeEE: string; nifEE: string; telEE: string; emailEE: string;
  encPagamento: 'aluno' | 'ee' | 'outro';
  nomePag: string; nifPag: string; telPag: string; emailPag: string;
  /* plano — only used in staff (isStaff) flow */
  planoId: string;
  /* account creation — only used in registerMode */
  senha: string; confirmarSenha: string;
}

interface ContratoData {
  aceitaImagem: boolean; aceitaRGPD: boolean; aceitaContrato: boolean;
  assinatura: string;
}

// ── Matrícula de plano família ──────────────────────────────────────────────
interface MembroFamilia { nome: string; dataNasc: string; faixa: string; grau: string; email: string; senha: string; confirmarSenha: string }
interface FamiliaData {
  titular: {
    nome: string; email: string; nif: string; telefone: string;
    morada: string; codPostal: string; treina: boolean;
    dataNasc: string; faixa: string; grau: string;
    senha: string; confirmarSenha: string;
  };
  membros: MembroFamilia[];
  encEE: { ativo: boolean; nome: string; nif: string; telefone: string; email: string };
}

const FAIXAS = ['Branca','Cinza e Branca','Cinza','Cinza e Preta','Amarela e Branca','Amarela','Amarela e Preta','Laranja e Branca','Laranja','Laranja e Preta','Verde e Branca','Verde','Verde e Preta','Azul','Roxa','Marrom','Preta'];
const CATEGORIAS: { id: string; label: string; icon: HeroIcon }[] = [{id:'adulto',label:'Adulto',icon:DumbbellIcon},{id:'kids',label:'Kids',icon:GamepadIcon},{id:'familia',label:'Família',icon:PeopleRoofIcon},{id:'fundador',label:'Sócio Fundador',icon:GemIcon}];

// Alinhado com o design system da app (ver Input.tsx / Select.tsx / Card.tsx /
// NovaMatriculaModal): campos rounded-sm sobre bg-elevated, labels muted
// minúsculas, secções como eyebrow. Botões via <Button>.
const INP_CLASS = 'block box-border w-full py-2.5 px-3 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border border-border bg-elevated text-primary outline-none transition-all duration-200 focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const CARD_CLASS = 'p-5 mb-4 rounded-lg border border-border bg-card sm:p-7';
const LBL_CLASS = 'block mb-1 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted';
const SEC_CLASS = 'pb-2 mb-3.5 text-[10.5px] font-semibold tracking-[1px] uppercase text-muted border-b border-border';

// ── Data de nascimento em dd/mm/aaaa ─────────────────────────────────────────
/** "25041990" ou "25/04/1990" → "25/04/1990" (máscara enquanto se escreve). */
function maskDMY(raw: string): string {
  const n = raw.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}
/** "25/04/1990" → Date válida ou null (rejeita datas impossíveis e no futuro). */
function parseDMY(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m.map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  const ok = d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd && d <= new Date();
  return ok ? d : null;
}
/** "25/04/1990" → "1990-04-25" (para gravar em data_nascimento DATE). */
function dmyToIso(s: string): string {
  const d = parseDMY(s);
  return d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    : '';
}

function StepBar({ step, isStaff = false }: { step: Step; isStaff?: boolean }) {
  const steps = isStaff
    ? [{id:'ficha',label:'Ficha'},{id:'contrato',label:'Contrato'},{id:'completo',label:'Ativo'}]
    : [{id:'plano',label:'Plano'},{id:'ficha',label:'Ficha'},{id:'contrato',label:'Contrato'},{id:'completo',label:'Ativo'}];
  const idx = steps.findIndex(s => s.id === step
    || (step==='pendente' && s.id==='completo')
    || (step==='pagamento' && s.id==='completo'));
  return (
    <div className="flex items-center mb-7">
      {steps.map((s,i) => (
        <div key={s.id} className={['flex items-center', i<steps.length-1 ? 'flex-1' : 'flex-none'].join(' ')}>
          <div className="flex flex-col gap-1 items-center">
            <div className={['flex justify-center items-center w-[30px] h-[30px] text-xs font-bold rounded-full', i<=idx ? 'text-white bg-gb-red' : 'text-muted bg-border'].join(' ')}>
              {i<idx?<FontAwesomeIcon icon={CheckIcon} className="w-3 h-3" />:i+1}
            </div>
            <span className={['text-[10.5px] whitespace-nowrap', i===idx ? 'font-bold text-primary' : i<idx ? 'font-normal text-gb-red' : 'font-normal text-muted'].join(' ')}>{s.label}</span>
          </div>
          {i<steps.length-1 && <div className={['flex-1 h-0.5 mx-1.5 mb-4', i<idx ? 'bg-gb-red' : 'bg-border'].join(' ')}/>}
        </div>
      ))}
    </div>
  );
}

const FICHA_BLANK: FichaData = {
  nomeAluno:'', dataNasc:'', nif:'', morada:'', codPostal:'', telefone:'', email:'',
  faixa:'', necessidades:'', temEE:false, nomeEE:'', nifEE:'', telEE:'', emailEE:'',
  encPagamento:'aluno', nomePag:'', nifPag:'', telPag:'', emailPag:'',
  planoId:'', senha:'', confirmarSenha:'',
};

/** Existe uma conta com este email? (RPC público, SECURITY DEFINER — patch 34) */
async function emailJaRegistado(email: string): Promise<boolean> {
  if (!isConfigured) return false;
  try {
    const { data, error } = await supabase.rpc('email_existe', { e: email.trim() });
    return !error && data === true;
  } catch {
    return false; // na dúvida deixa avançar; o signUp apanha o duplicado
  }
}

function FichaInscricao({ onNext, onBack, initial, registerMode = false, isStaff = false, planos = [] }: { onNext:(d:FichaData)=>void; onBack?:()=>void; initial?: FichaData | null; registerMode?: boolean; isStaff?: boolean; planos?: import('../../types').Plano[] }) {
  const [catStaff, setCatStaff] = useState('adulto');
  const [d, setD] = useState<FichaData>(initial ?? FICHA_BLANK);
  const [err, setErr] = useState<Record<string,string>>({});
  const [aVerificar, setAVerificar] = useState(false);

  // Menor de 18 (data em dd/mm/aaaa). Todos os sítios que usam `temEE` já
  // fazem `|| isMinor`, por isso não é preciso forçar o estado.
  const idadeAluno = calcularIdade(dmyToIso(d.dataNasc));
  const isMinor = idadeAluno !== null && idadeAluno < 18;

  const set = (k: keyof FichaData) => (e: React.ChangeEvent<any>) =>
    setD(p => ({ ...p, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const field = (k: keyof FichaData, label: string, type='text', ph='', required=true) => (
    <div className="mb-3" data-field={k}>
      <label className={LBL_CLASS}>{label}{required ? ' *' : ''}</label>
      <input type={type} name={k} value={d[k] as string} onChange={set(k)} placeholder={ph}
        aria-invalid={!!err[k]}
        className={[INP_CLASS, err[k] ? '!border-gb-red bg-gb-red/[0.04]' : ''].join(' ')}/>
      {err[k] && <div className="mt-1 text-[11px] font-semibold text-gb-red">{err[k]}</div>}
    </div>
  );

  const validate = () => {
    const e: Record<string,string> = {};
    if (!d.nomeAluno.trim()) e.nomeAluno='Obrigatório';
    if (!d.dataNasc) e.dataNasc='Obrigatório';
    else if (!parseDMY(d.dataNasc)) e.dataNasc='Data inválida, usa dd/mm/aaaa';
    if (!/^\d{9}$/.test(d.nif)) e.nif='9 dígitos';
    if (!d.morada.trim()) e.morada='Obrigatório';
    if (!/^\d{4}-\d{3}$/.test(d.codPostal)) e.codPostal='Formato: 4710-409';
    if (!d.telefone.trim()) e.telefone='Obrigatório';
    if (!d.email.includes('@')) e.email='Email inválido';
    if (d.temEE || isMinor) {
      if (!d.nomeEE.trim()) e.nomeEE='Obrigatório';
      if (!/^\d{9}$/.test(d.nifEE)) e.nifEE='9 dígitos';
      if (!d.telEE.trim()) e.telEE='Obrigatório';
      if (!d.emailEE.includes('@')) e.emailEE='Email inválido';
    }
    if (d.encPagamento==='outro' && !d.nomePag.trim()) e.nomePag='Obrigatório';
    if (registerMode) {
      if (d.senha.length < 6) e.senha='Mínimo 6 caracteres';
      if (d.senha !== d.confirmarSenha) e.confirmarSenha='As passwords não coincidem';
    }
    setErr(e);
    const keys = Object.keys(e);
    if (keys.length) {
      requestAnimationFrame(() => {
        const wrap = document.querySelector<HTMLElement>(`[data-field="${keys[0]}"]`);
        wrap?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        wrap?.querySelector<HTMLElement>('input,select,textarea')?.focus();
      });
    }
    return keys.length === 0;
  };

  const submit = async () => {
    if (!validate() || aVerificar) return;
    // Verifica o email ANTES de avançar — se já existir, corrige-se aqui sem
    // perder o resto da ficha (o estado é preservado ao voltar atrás).
    if (registerMode) {
      setAVerificar(true);
      const existe = await emailJaRegistado(d.email);
      setAVerificar(false);
      if (existe) {
        setErr(e => ({ ...e, email: 'Já existe uma conta com este email. Usa outro ou entra pelo login.' }));
        requestAnimationFrame(() => {
          const w = document.querySelector<HTMLElement>('[data-field="email"]');
          w?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          w?.querySelector<HTMLElement>('input')?.focus();
        });
        return;
      }
    }
    onNext({ ...d, dataNasc: dmyToIso(d.dataNasc) });
  };

  return (
    <div className={CARD_CLASS}>
      <div className="mb-4">
        <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Gracie Barra Braga</div>
        <h2 className="font-display text-lg font-extrabold uppercase text-primary">Ficha de Inscrição</h2>
      </div>
      <p className="py-2.5 px-3.5 mb-5 text-[12.5px] leading-[1.7] rounded-sm border text-secondary border-border bg-elevated">
        Preenche a ficha para formalizar a adesão e ativar o seguro de aluno.{' '}
        <strong className="text-gb-red">Uma ficha por aluno.</strong>
      </p>

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={AddressCardIcon} sm />Identificação do Aluno</span></div>
      <p className="mb-3.5 text-[11px] text-muted">Todos os campos marcados com * são obrigatórios</p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {field('nomeAluno','Nome do Aluno')}
        <div className="mb-3" data-field="dataNasc">
          <label className={LBL_CLASS}>Data de Nascimento *</label>
          <input
            type="text" name="dataNasc" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10}
            value={d.dataNasc} aria-invalid={!!err.dataNasc}
            onChange={e => setD(p => ({ ...p, dataNasc: maskDMY(e.target.value) }))}
            className={[INP_CLASS, err.dataNasc ? '!border-gb-red bg-gb-red/[0.04]' : ''].join(' ')}
          />
          {err.dataNasc && <div className="mt-1 text-[11px] font-semibold text-gb-red">{err.dataNasc}</div>}
        </div>
        {field('nif','NIF','text','000000000')}
        {field('telefone','Telefone','tel','+351 9XX XXX XXX')}
      </div>
      {field('email','Email','email','email@exemplo.com')}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr]">
        {field('morada','Morada')}
        {field('codPostal','Código Postal','text','4710-409')}
      </div>
      <div className="mb-3.5">
        <label className={LBL_CLASS}>Faixa (se aplicável)</label>
        <select value={d.faixa} onChange={set('faixa')} className={[INP_CLASS, 'cursor-pointer'].join(' ')}>
          <option value="">Escolha a sua faixa</option>
          {FAIXAS.map(fx=><option key={fx} value={fx}>{fx}</option>)}
        </select>
      </div>
      <div className="mb-[22px]">
        <label className={LBL_CLASS}>Necessidades especiais (opcional)</label>
        <textarea value={d.necessidades} onChange={set('necessidades')} rows={2}
          placeholder="Alergias, condições médicas, limitações físicas..."
          className={[INP_CLASS, 'resize-none'].join(' ')}/>
      </div>

      <div className="flex justify-between items-center pb-2 mb-3.5 border-b border-border">
        <span className="inline-flex gap-1.5 items-center text-[10.5px] font-semibold tracking-[1px] uppercase text-muted"><Ico icon={UserShieldIcon} sm />Encarregado de Educação</span>
        {isMinor && (
          <span className="py-1 px-2.5 text-[10px] font-extrabold tracking-[0.6px] text-white uppercase rounded-md bg-gb-red">
            Obrigatório
          </span>
        )}
      </div>

      {isMinor ? (
        /* Minor: locked notice — cannot uncheck */
        <div className="flex gap-2.5 items-center py-2.5 px-3.5 mb-3.5 rounded-lg border border-gb-red/25 bg-gb-red/[0.06]">
          <FontAwesomeIcon icon={ExclamationTriangleIcon} className="w-4 h-4 text-gb-red" />
          <span className="text-[13px] font-semibold text-gb-red">
            O aluno tem menos de 18 anos, dados do Encarregado de Educação são obrigatórios.
          </span>
        </div>
      ) : (
        /* Adult: optional toggle */
        <div className="flex gap-2.5 items-center py-2.5 px-3.5 mb-3.5 rounded-lg cursor-pointer transition-colors duration-200 bg-card hover:bg-elevated"
          onClick={()=>setD(p=>({...p, temEE:!p.temEE}))}>
          <input type="checkbox" checked={d.temEE} onChange={()=>{}} className="w-4 h-4 cursor-pointer outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
          <span className="text-[13px] text-secondary">Aplicável (menor de 18 anos ou dependente)</span>
        </div>
      )}

      {(d.temEE || isMinor) && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {field('nomeEE','Nome')}
          {field('nifEE','NIF','text','000000000')}
          {field('telEE','Telefone','tel')}
          {field('emailEE','Email','email')}
        </div>
      )}

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={FileInvoiceDollarIcon} sm />Encarregado do Pagamento da Mensalidade</span></div>
      {(['aluno','ee','outro'] as const).map(val => {
        const labels = { aluno:'O aluno', ee:'O encarregado de educação', outro:'Nenhum dos mencionados (outro)' };
        return (
          <label key={val}
            className={[
              'flex gap-2.5 items-center py-2.5 px-3.5 mb-2 rounded-lg border cursor-pointer transition-colors duration-200',
              d.encPagamento===val ? 'border-gb-red bg-gb-red/5' : 'border-border bg-card hover:bg-elevated',
            ].join(' ')}>
            <input type="radio" name="ep" checked={d.encPagamento===val} onChange={()=>setD(p=>({...p,encPagamento:val}))} className="outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
            <span className="text-[13px] text-secondary">{labels[val]}</span>
          </label>
        );
      })}
      {d.encPagamento==='outro' && (
        <div className="p-3.5 px-4 mt-3 rounded-sm bg-elevated">
          <p className="mb-3 text-[11px] text-muted">Preencha os dados do responsável pelo pagamento:</p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {field('nomePag','Nome')}
            {field('nifPag','NIF','text','000000000')}
            {field('telPag','Telefone','tel')}
            {field('emailPag','Email','email')}
          </div>
        </div>
      )}

      {/* ── Plano (staff enrollment only) ── */}
      {isStaff && planos.length > 0 && (
        <>
          <div className={[SEC_CLASS, 'mt-2'].join(' ')}><span className="inline-flex gap-1.5 items-center"><Ico icon={LayerGroupIcon} sm />Plano de Adesão</span></div>
          <div className="flex flex-wrap gap-2 mb-3.5">
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={()=>setCatStaff(c.id)}
                className={[
                  'flex gap-1.5 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-lg border cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  catStaff===c.id ? 'font-bold text-gb-red border-gb-red bg-gb-red/8' : 'font-normal text-secondary border-border bg-card hover:bg-elevated active:bg-elevated',
                ].join(' ')}>
                <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" /> {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 mb-[22px]">
            {planos.filter(p => p.ativo && (p as any).categoria === catStaff).map(p => (
              <button key={p.id} onClick={()=>setD(prev=>({...prev, planoId: p.id}))}
                className={[
                  'flex justify-between items-center py-3.5 px-[18px] text-left rounded-lg border-2 transition-all duration-200 cursor-pointer active:scale-[0.99]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  d.planoId===p.id ? 'border-gb-red bg-gb-red/[0.04]' : 'border-border bg-card hover:bg-elevated',
                ].join(' ')}>
                <div>
                  <div className="mb-0.5 text-sm font-bold text-primary">{p.nome}</div>
                  <div className="text-xs text-muted">{p.descricao}</div>
                </div>
                <div className="flex-shrink-0 ml-4 text-right">
                  <div className={['font-display text-xl font-black', d.planoId===p.id ? 'text-gb-red' : 'text-primary'].join(' ')}>€{p.valor}</div>
                  <div className="text-[11px] text-muted">/mês</div>
                </div>
              </button>
            ))}
            {planos.filter(p => p.ativo && (p as any).categoria === catStaff).length === 0 && (
              <p className="p-3 px-4 text-[13px] rounded-sm text-muted bg-elevated">
                Sem planos disponíveis nesta categoria.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Password section (only in registerMode) ── */}
      {registerMode && (
        <>
          <div className={[SEC_CLASS, 'mt-2'].join(' ')}><span className="inline-flex gap-1.5 items-center"><Ico icon={UnlockIcon} sm />Criar Acesso à Plataforma</span></div>
          <p className="mb-3.5 text-xs leading-[1.6] text-muted">
            Define a password que vais usar para entrar no portal do aluno.
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {field('senha','Password','password','Mínimo 6 caracteres')}
            {field('confirmarSenha','Confirmar Password','password','Repete a password')}
          </div>
        </>
      )}

      {Object.keys(err).length > 0 && (
        <div className="flex gap-1.5 items-center py-2.5 px-3.5 mt-4 text-[12.5px] font-semibold rounded-sm border text-gb-red border-gb-red/25 bg-gb-red/[0.06]">
          <Ico icon={ExclamationTriangleIcon} sm />
          {err.email && Object.keys(err).length === 1
            ? err.email
            : `Faltam ${Object.keys(err).length} ${Object.keys(err).length === 1 ? 'campo' : 'campos'}, os erros estão assinalados a vermelho.`}
        </div>
      )}

      <div className="flex justify-between mt-4">
        {onBack
          ? <Button variant="secondary" onClick={onBack}><Ico icon={ArrowLeftIcon} sm /> Voltar</Button>
          : <span />}
        <Button variant="primary" size="lg" loading={aVerificar} onClick={submit}>
          {aVerificar ? 'A verificar…' : <>Seguinte <Ico icon={ArrowRightIcon} sm /></>}
        </Button>
      </div>
    </div>
  );
}

// ── Ficha família — vários praticantes numa só matrícula ────────────────────
function familiaComoFicha(f: FamiliaData): FichaData {
  return {
    ...FICHA_BLANK,
    nomeAluno: f.titular.nome, nif: f.titular.nif, email: f.titular.email,
    telefone: f.titular.telefone, morada: f.titular.morada, codPostal: f.titular.codPostal,
  };
}

const MEMBRO_BLANK: MembroFamilia = { nome: '', dataNasc: '', faixa: '', grau: '0', email: '', senha: '', confirmarSenha: '' };

function FichaFamilia({ initial, nMembros, planoNome, onNext, onBack }: {
  initial: FamiliaData | null; nMembros: number; planoNome: string;
  onNext: (f: FamiliaData) => void; onBack: () => void;
}) {
  const blank: FamiliaData = {
    titular: { nome:'', email:'', nif:'', telefone:'', morada:'', codPostal:'', treina:true, dataNasc:'', faixa:'', grau:'0', senha:'', confirmarSenha:'' },
    // sempre dimensionado ao máximo (nMembros) — renderizamos/validamos só os
    // primeiros `nBlocos`, evitando mexer no estado quando o toggle muda.
    membros: Array.from({ length: nMembros }, () => ({ ...MEMBRO_BLANK })),
    encEE: { ativo:false, nome:'', nif:'', telefone:'', email:'' },
  };
  const [f, setF] = useState<FamiliaData>(initial ?? blank);
  const [err, setErr] = useState<Record<string,string>>({});
  const [aVerificar, setAVerificar] = useState(false);

  const nBlocos = f.titular.treina ? nMembros - 1 : nMembros;
  const membrosVis = f.membros.slice(0, nBlocos);

  const idades = [
    ...(f.titular.treina ? [calcularIdade(dmyToIso(f.titular.dataNasc))] : []),
    ...membrosVis.map(m => calcularIdade(dmyToIso(m.dataNasc))),
  ];
  const temMenor = idades.some(i => i !== null && i < 18);

  const setT = (k: keyof FamiliaData['titular']) => (v: string | boolean) =>
    setF(p => ({ ...p, titular: { ...p.titular, [k]: v } }));
  const setM = (i: number, k: keyof MembroFamilia) => (v: string) =>
    setF(p => ({ ...p, membros: p.membros.map((m, j) => j === i ? { ...m, [k]: v } : m) }));
  const setEE = (k: keyof FamiliaData['encEE']) => (v: string | boolean) =>
    setF(p => ({ ...p, encEE: { ...p.encEE, [k]: v } }));

  const inp = (val: string, onChange: (v: string) => void, key: string, ph = '', data = false, type: 'text' | 'password' = 'text') => (
    <input
      type={type} inputMode={data ? 'numeric' : undefined} placeholder={ph} value={val}
      maxLength={data ? 10 : undefined}
      onChange={e => onChange(data ? maskDMY(e.target.value) : e.target.value)}
      aria-invalid={!!err[key]}
      className={[INP_CLASS, err[key] ? '!border-gb-red bg-gb-red/[0.04]' : ''].join(' ')}
    />
  );
  const campo = (label: string, val: string, onChange: (v: string) => void, key: string, opts: { ph?: string; data?: boolean; opcional?: boolean; type?: 'text' | 'password' } = {}) => (
    <div className="mb-3" data-field={key}>
      <label className={LBL_CLASS}>{label}{opts.opcional ? '' : ' *'}</label>
      {inp(val, onChange, key, opts.ph, opts.data, opts.type)}
      {err[key] && <div className="mt-1 text-[11px] font-semibold text-gb-red">{err[key]}</div>}
    </div>
  );
  const faixaSelect = (val: string, onChange: (v: string) => void) => (
    <select value={val} onChange={e => onChange(e.target.value)} className={[INP_CLASS, 'cursor-pointer'].join(' ')}>
      <option value="">Faixa (se aplicável)</option>
      {FAIXAS.map(fx => <option key={fx} value={fx}>{fx}</option>)}
    </select>
  );

  const validate = async () => {
    const e: Record<string,string> = {};
    const t = f.titular;
    if (!t.nome.trim()) e['t-nome'] = 'Obrigatório';
    if (!t.email.includes('@')) e['t-email'] = 'Email inválido';
    if (t.nif && !/^\d{9}$/.test(t.nif)) e['t-nif'] = '9 dígitos';
    if (!t.telefone.trim()) e['t-telefone'] = 'Obrigatório';
    if (!t.morada.trim()) e['t-morada'] = 'Obrigatório';
    if (!/^\d{4}-\d{3}$/.test(t.codPostal)) e['t-codPostal'] = 'Formato: 4710-409';
    if (t.senha.length < 6) e['t-senha'] = 'Mínimo 6 caracteres';
    else if (t.senha !== t.confirmarSenha) e['t-confirmarSenha'] = 'As passwords não coincidem';
    if (t.treina) {
      if (!t.dataNasc) e['t-dataNasc'] = 'Obrigatório';
      else if (!parseDMY(t.dataNasc)) e['t-dataNasc'] = 'Data inválida (dd/mm/aaaa)';
    }
    membrosVis.forEach((m, i) => {
      if (!m.nome.trim()) e[`m${i}-nome`] = 'Obrigatório';
      if (!m.dataNasc) e[`m${i}-dataNasc`] = 'Obrigatório';
      else if (!parseDMY(m.dataNasc)) e[`m${i}-dataNasc`] = 'Data inválida (dd/mm/aaaa)';
      if (m.email && !m.email.includes('@')) e[`m${i}-email`] = 'Email inválido';
      if (m.senha.length < 6) e[`m${i}-senha`] = 'Mínimo 6 caracteres';
      else if (m.senha !== m.confirmarSenha) e[`m${i}-confirmarSenha`] = 'As passwords não coincidem';
    });
    if (temMenor || f.encEE.ativo) {
      if (!f.encEE.nome.trim()) e['ee-nome'] = 'Obrigatório';
      if (!/^\d{9}$/.test(f.encEE.nif)) e['ee-nif'] = '9 dígitos';
      if (!f.encEE.telefone.trim()) e['ee-telefone'] = 'Obrigatório';
      if (!f.encEE.email.includes('@')) e['ee-email'] = 'Email inválido';
    }
    setErr(e);
    if (Object.keys(e).length) {
      const k = Object.keys(e)[0];
      requestAnimationFrame(() => {
        const w = document.querySelector<HTMLElement>(`[data-field="${k}"]`);
        w?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        w?.querySelector<HTMLElement>('input,select')?.focus();
      });
      return false;
    }
    // emails livres?
    setAVerificar(true);
    if (await emailJaRegistado(t.email)) {
      setAVerificar(false);
      setErr({ 't-email': 'Já existe uma conta com este email.' });
      requestAnimationFrame(() => document.querySelector('[data-field="t-email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return false;
    }
    for (let i = 0; i < membrosVis.length; i++) {
      const em = membrosVis[i].email.trim();
      if (em && await emailJaRegistado(em)) {
        setAVerificar(false);
        setErr({ [`m${i}-email`]: 'Já existe uma conta com este email.' });
        requestAnimationFrame(() => document.querySelector(`[data-field="m${i}-email"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        return false;
      }
    }
    setAVerificar(false);
    return true;
  };

  const submit = async () => { if (!aVerificar && await validate()) onNext({ ...f, membros: membrosVis }); };

  return (
    <div className={CARD_CLASS}>
      <div className="mb-4">
        <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Gracie Barra Braga</div>
        <h2 className="font-display text-lg font-extrabold uppercase text-primary">Ficha · {planoNome}</h2>
      </div>
      <p className="py-2.5 px-3.5 mb-5 text-[12.5px] leading-[1.7] rounded-sm border text-secondary border-border bg-elevated">
        Preenche os dados de <strong>todos os {nMembros} praticantes</strong>. Uma
        subscrição no responsável cobre a família toda.
      </p>

      {/* Responsável de pagamentos */}
      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={FileInvoiceDollarIcon} sm />Responsável de pagamentos</span></div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {campo('Nome', f.titular.nome, setT('nome') as (v:string)=>void, 't-nome')}
        {campo('Email', f.titular.email, setT('email') as (v:string)=>void, 't-email', { ph: 'email@exemplo.com' })}
        {campo('NIF', f.titular.nif, setT('nif') as (v:string)=>void, 't-nif', { ph: '000000000', opcional: true })}
        {campo('Telefone', f.titular.telefone, setT('telefone') as (v:string)=>void, 't-telefone', { ph: '+351 9XX XXX XXX' })}
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr]">
        {campo('Morada', f.titular.morada, setT('morada') as (v:string)=>void, 't-morada')}
        {campo('Código Postal', f.titular.codPostal, setT('codPostal') as (v:string)=>void, 't-codPostal', { ph: '4710-409' })}
      </div>

      {/* Password do responsável — definida já aui, para não interromper o
          fluxo entre a matrícula e o pagamento (os outros membros recebem um
          link por email, que podem usar quando quiserem). */}
      <div className={[SEC_CLASS, 'mt-2'].join(' ')}><span className="inline-flex gap-1.5 items-center"><Ico icon={UnlockIcon} sm />Criar Acesso à Plataforma</span></div>
      <p className="mb-3 text-[12px] text-muted">Vais usar esta password para entrar no teu portal.</p>
      <div className="grid grid-cols-1 gap-3.5 mb-1 sm:grid-cols-2">
        {campo('Password', f.titular.senha, setT('senha') as (v:string)=>void, 't-senha', { ph: 'Mínimo 6 caracteres', type: 'password' })}
        {campo('Confirmar Password', f.titular.confirmarSenha, setT('confirmarSenha') as (v:string)=>void, 't-confirmarSenha', { ph: 'Repete a password', type: 'password' })}
      </div>

      <label className="flex gap-2.5 items-center py-2.5 px-3.5 mt-2 mb-3.5 rounded-sm border border-border cursor-pointer bg-elevated hover:bg-card">
        <input type="checkbox" checked={f.titular.treina} onChange={e => setT('treina')(e.target.checked)} className="w-4 h-4 accent-gb-red"/>
        <span className="text-[13px] text-secondary">O responsável também treina (conta como praticante)</span>
      </label>
      {f.titular.treina && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 mb-1">
          {campo('Data de nascimento', f.titular.dataNasc, setT('dataNasc') as (v:string)=>void, 't-dataNasc', { ph: 'dd/mm/aaaa', data: true })}
          <div className="mb-3"><label className={LBL_CLASS}>Faixa</label>{faixaSelect(f.titular.faixa, setT('faixa') as (v:string)=>void)}</div>
          <div className="mb-3"><label className={LBL_CLASS}>Grau</label>
            <select value={f.titular.grau} onChange={e => setT('grau')(e.target.value)} className={[INP_CLASS, 'cursor-pointer'].join(' ')}>
              {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Membros */}
      {membrosVis.map((m, i) => (
        <div key={i}>
          <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={CircleUserIcon} sm />{f.titular.treina ? `Membro ${i + 2}` : `Membro ${i + 1}`}</span></div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {campo('Nome', m.nome, setM(i, 'nome'), `m${i}-nome`)}
            {campo('Data de nascimento', m.dataNasc, setM(i, 'dataNasc'), `m${i}-dataNasc`, { ph: 'dd/mm/aaaa', data: true })}
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[1fr_100px_2fr]">
            <div className="mb-3"><label className={LBL_CLASS}>Faixa</label>{faixaSelect(m.faixa, setM(i, 'faixa'))}</div>
            <div className="mb-3"><label className={LBL_CLASS}>Grau</label>
              <select value={m.grau} onChange={e => setM(i, 'grau')(e.target.value)} className={[INP_CLASS, 'cursor-pointer'].join(' ')}>
                {[0,1,2,3,4].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3.5 mb-1 sm:grid-cols-3">
            <div className="mb-3" data-field={`m${i}-email`}>
              <label className={LBL_CLASS}>Email (opcional)</label>
              {inp(m.email, setM(i, 'email'), `m${i}-email`, 'vazio → usa o email do responsável')}
              {err[`m${i}-email`] && <div className="mt-1 text-[11px] font-semibold text-gb-red">{err[`m${i}-email`]}</div>}
            </div>
            {campo('Password', m.senha, setM(i, 'senha'), `m${i}-senha`, { ph: 'Mínimo 6 caracteres', type: 'password' })}
            {campo('Confirmar Password', m.confirmarSenha, setM(i, 'confirmarSenha'), `m${i}-confirmarSenha`, { ph: 'Repete a password', type: 'password' })}
          </div>
        </div>
      ))}

      {/* Encarregado de Educação (se algum praticante for menor) */}
      {(temMenor || f.encEE.ativo) && (
        <>
          <div className="flex justify-between items-center pb-2 mb-3.5 border-b border-border">
            <span className="inline-flex gap-1.5 items-center text-[10.5px] font-semibold tracking-[1px] uppercase text-muted"><Ico icon={UserShieldIcon} sm />Encarregado de Educação</span>
            {temMenor && <span className="py-1 px-2.5 text-[10px] font-extrabold tracking-[0.6px] text-white uppercase rounded-md bg-gb-red">Obrigatório</span>}
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {campo('Nome', f.encEE.nome, setEE('nome') as (v:string)=>void, 'ee-nome')}
            {campo('NIF', f.encEE.nif, setEE('nif') as (v:string)=>void, 'ee-nif', { ph: '000000000' })}
            {campo('Telefone', f.encEE.telefone, setEE('telefone') as (v:string)=>void, 'ee-telefone')}
            {campo('Email', f.encEE.email, setEE('email') as (v:string)=>void, 'ee-email')}
          </div>
        </>
      )}

      {Object.keys(err).length > 0 && (
        <div className="flex gap-1.5 items-center py-2.5 px-3.5 mt-4 text-[12.5px] font-semibold rounded-sm border text-gb-red border-gb-red/25 bg-gb-red/[0.06]">
          <Ico icon={ExclamationTriangleIcon} sm />
          {Object.keys(err).length === 1 ? Object.values(err)[0] : `Corrige os ${Object.keys(err).length} campos assinalados a vermelho.`}
        </div>
      )}

      <div className="flex justify-between mt-4">
        <Button variant="secondary" onClick={onBack}><Ico icon={ArrowLeftIcon} sm /> Voltar</Button>
        <Button variant="primary" size="lg" loading={aVerificar} onClick={submit}>
          {aVerificar ? 'A verificar…' : <>Seguinte <Ico icon={ArrowRightIcon} sm /></>}
        </Button>
      </div>
    </div>
  );
}

function ContratoAssinatura({ ficha, onNext, onBack }: { ficha:FichaData; onNext:(c:ContratoData)=>void; onBack:()=>void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const [c, setC] = useState<ContratoData>({ aceitaImagem:false, aceitaRGPD:false, aceitaContrato:false, assinatura:'' });
  const [errors, setErrors] = useState<string[]>([]);
  const [showErr, setShowErr] = useState(false);
  const hoje = new Date().toLocaleDateString('pt-PT',{day:'numeric',month:'long',year:'numeric'});

  const getPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width/rect.width, sy = canvas.height/rect.height;
    if (e.touches) return { x:(e.touches[0].clientX-rect.left)*sx, y:(e.touches[0].clientY-rect.top)*sy };
    return { x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy };
  };

  const start = (e: any) => { e.preventDefault(); const ctx=canvasRef.current!.getContext('2d')!; const p=getPos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); setDrawing(true); setHasSig(true); };
  const move = (e: any) => { if(!drawing) return; e.preventDefault(); const ctx=canvasRef.current!.getContext('2d')!; const p=getPos(e); ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.strokeStyle='#111'; ctx.lineTo(p.x,p.y); ctx.stroke(); };
  const end = () => { setDrawing(false); setC(p=>({...p, assinatura:canvasRef.current!.toDataURL()})); };
  const clear = () => { canvasRef.current!.getContext('2d')!.clearRect(0,0,640,160); setHasSig(false); setC(p=>({...p,assinatura:''})); };

  const validate = () => {
    const e: string[] = [];
    if (!c.aceitaImagem) e.push('Autoriza a utilização de imagem');
    if (!c.aceitaRGPD) e.push('Aceita o tratamento de dados (RGPD)');
    if (!c.aceitaContrato) e.push('Confirma que leste e aceitas o contrato');
    if (!hasSig) e.push('Assina o contrato');
    setErrors(e);
    setShowErr(true);
    if (e.length) {
      requestAnimationFrame(() =>
        document.querySelector('[data-err-summary]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
    }
    return e.length === 0;
  };

  const chk = (key: keyof ContratoData, label: string) => {
    const on = c[key] as boolean;
    const bad = showErr && !on;
    return (
      <label className={[
        'flex gap-3 items-start py-3 px-4 mb-2.5 rounded-lg border cursor-pointer transition-colors duration-200',
        on ? 'border-gb-red bg-gb-red/[0.04]' : bad ? '!border-gb-red bg-gb-red/[0.04]' : 'border-border bg-card hover:bg-elevated',
      ].join(' ')}>
        <input type="checkbox" checked={on} onChange={()=>setC(p=>({...p,[key]:!p[key as keyof ContratoData]}))}
          className="mt-0.5 w-4 h-4 shrink-0 outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
        <span className={['text-[13px] leading-[1.5]', bad ? 'font-semibold text-gb-red' : 'text-secondary'].join(' ')}>{label}</span>
      </label>
    );
  };

  return (
    <div className={CARD_CLASS}>
      <div className="mb-4">
        <div className="mb-1 text-[10.5px] tracking-[1px] uppercase text-muted">Gracie Barra Braga · {hoje}</div>
        <h2 className="font-display text-lg font-extrabold uppercase text-primary">Contrato de Adesão</h2>
      </div>

      <div className="p-4 mb-5 text-[13.5px] leading-[1.8] rounded-lg border text-secondary border-border bg-elevated">
        <p className="mb-3">
          O presente contrato é celebrado entre <strong>Tribo Laurada Lda.</strong> (NIF 518948471), proprietária da escola de Jiu-Jitsu <strong>Gracie Barra Braga</strong>, com sede na Rua Nova de Santa Cruz, 11 – 4710-409 Braga, e o(a) aluno(a){' '}
          <strong>{ficha.nomeAluno||'_______________'}</strong>, NIF <strong>{ficha.nif||'_________'}</strong>,{' '}
          residente em <strong>{ficha.morada||'_______________'}{ficha.codPostal?`, ${ficha.codPostal}`:''}</strong>.
        </p>
        <p className="mb-2 font-bold">O aluno compromete-se a:</p>
        <ul className="mb-3 ml-[18px]">
          {['Efetuar o pagamento da mensalidade até ao dia 5 de cada mês;','Utilizar o uniforme oficial da Gracie Barra durante os treinos e eventos;','Cumprir o regulamento interno da escola;','Autorizar a utilização da sua imagem em fotografias e vídeos para fins institucionais;','Declarar estar fisicamente apto para a prática do Jiu-Jitsu.'].map((item,i)=>(
            <li key={i} className="mb-1.5">{item}</li>
          ))}
        </ul>
        <p className="pt-2.5 text-[12.5px] border-t text-secondary border-border">
          O contrato entra em vigor na data da assinatura e mantém-se válido enquanto o aluno frequentar a escola.
        </p>
      </div>

      <div className="mb-5">
        {chk('aceitaImagem','Autorizo a utilização da minha imagem para fins institucionais e promocionais da Gracie Barra Braga.')}
        {chk('aceitaRGPD','Aceito o tratamento dos meus dados pessoais conforme o RGPD e a Política de Privacidade da escola.')}
        {chk('aceitaContrato','O contrato de adesão foi lido e estou de acordo.')}
      </div>

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={PenNibIcon} sm />Assine aqui com o rato ou dedo</span></div>
      <div className={['overflow-hidden relative rounded-lg border bg-elevated', showErr && !hasSig ? '!border-gb-red' : 'border-border'].join(' ')}>
        <canvas ref={canvasRef} width={640} height={160} className="block w-full cursor-crosshair [touch-action:none]"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!hasSig && (
          <div className="flex absolute inset-0 justify-center items-center pointer-events-none">
            <span className="text-sm text-[#C0BFCA]">Assine aqui...</span>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-1.5 mb-5">
        <button onClick={clear} className="py-1.5 px-3.5 min-h-11 sm:min-h-0 text-xs bg-none rounded-md border cursor-pointer border-border text-muted transition-colors duration-200 hover:bg-elevated hover:text-primary active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
          Limpar
        </button>
      </div>

      {errors.length>0 && (
        <div data-err-summary className="py-2.5 px-3.5 mb-4 rounded-sm border border-gb-red/25 bg-gb-red/[0.06]">
          <div className="inline-flex gap-1.5 items-center mb-1 text-[12.5px] font-bold text-gb-red">
            <Ico icon={ExclamationTriangleIcon} sm />Falta {errors.length === 1 ? 'isto' : `${errors.length} coisas`}:
          </div>
          {errors.map((e,i)=><div key={i} className="text-[12px] text-gb-red">• {e}</div>)}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}><Ico icon={ArrowLeftIcon} sm /> Voltar</Button>
        <Button variant="primary" size="lg" onClick={()=>{ if(validate()) onNext(c); }}>
          Seguinte <Ico icon={ArrowRightIcon} sm />
        </Button>
      </div>
    </div>
  );
}

function EscolhaPagamento({ ficha, onNext, onBack, modo = 'pagamento', initialPlanoId = '', initialMetodo = 'stripe' }: {
  ficha?: FichaData | null; onNext:(pid:string,met:'stripe'|'numerario')=>void; onBack?:()=>void;
  modo?: 'plano' | 'pagamento';
  initialPlanoId?: string; initialMetodo?: 'stripe'|'numerario';
}) {
  const { data: allPlanos } = usePlanos();
  const catInicial = allPlanos.find(p=>p.id===initialPlanoId) as { categoria?: string } | undefined;
  const [cat, setCat] = useState(catInicial?.categoria ?? 'adulto');
  const [planoId, setPlanoId] = useState(initialPlanoId);
  const [metodo, setMetodo] = useState<'stripe'|'numerario'>(initialMetodo);
  const planos = allPlanos.filter(p=>p.ativo && (p as any).categoria===cat);
  const sel = planos.find(p=>p.id===planoId);

  return (
    <div className={CARD_CLASS}>
      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={LayerGroupIcon} sm />Escolha o plano</span></div>
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIAS.map(c=>(
          <button key={c.id} onClick={()=>{ setCat(c.id); setPlanoId(''); if (c.id === 'familia') setMetodo('stripe'); }}
            className={[
              'flex gap-1.5 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 font-ui text-[13px] rounded-sm border cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              cat===c.id ? 'font-semibold text-primary border-gb-red bg-card' : 'font-normal text-muted border-border bg-card hover:bg-elevated active:bg-elevated',
            ].join(' ')}>
            <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" /> {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 mb-1.5">
        {planos.map(p=>{
          const on = planoId===p.id;
          return (
            <button key={p.id} onClick={()=>setPlanoId(p.id)}
              className={[
                'flex justify-between items-center py-3 px-3.5 text-left rounded-sm border transition-colors duration-200 cursor-pointer',
                'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                on ? 'border-gb-red bg-card' : 'border-border bg-elevated hover:bg-card',
              ].join(' ')}>
              <div className="flex gap-2.5 items-center min-w-0">
                <span className={['flex justify-center items-center w-4 h-4 rounded-full border shrink-0', on ? 'border-gb-red' : 'border-border'].join(' ')}>
                  {on && <span className="w-2 h-2 rounded-full bg-gb-red" />}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate text-primary">{p.nome}</div>
                  <div className="text-[11px] truncate text-muted">{p.descricao}</div>
                </div>
              </div>
              <div className="ml-3 text-right shrink-0">
                <div className="font-display text-lg font-black text-primary">€{p.valor}</div>
                <div className="text-[10.5px] text-muted">/mês</div>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mb-5 text-[10.5px] text-muted">Preços com IVA 23% incluído.</p>

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={WalletIcon} sm />Forma de pagamento</span></div>
      {cat === 'familia' && (
        <p className="mb-2 text-[11.5px] text-muted">
          Planos família só suportam débito automático: a subscrição cobre todos os praticantes numa só cobrança.
        </p>
      )}
      {([
        { v: 'stripe' as const, icon: ArrowsRotateIcon, titulo: 'Débito automático (Stripe)', extra: <span className="text-[11px] font-normal text-muted">· recomendado</span>,
          desc: 'Cartão de débito ou crédito. A 1.ª mensalidade é cobrada agora e renova todos os meses. Cancelas quando quiseres.' },
        // Numerário para família ainda não está implementado (exigiria uma
        // conta+password por praticante e um pedido de aprovação por membro) —
        // esconder em vez de deixar cair num ecrã final em branco.
        ...(cat === 'familia' ? [] : [{ v: 'numerario' as const, icon: CoinsIcon, titulo: 'Numerário (dinheiro)', extra: null,
          desc: 'Pagamento na receção até ao dia 5 de cada mês. Fica pendente de aprovação de um administrador.' }]),
      ]).map(o=>{
        const on = metodo===o.v;
        return (
          <label key={o.v} className={[
            'flex gap-3 items-start py-3 px-3.5 mb-2 rounded-sm border cursor-pointer transition-colors duration-200',
            on ? 'border-gb-red bg-card' : 'border-border bg-elevated hover:bg-card',
          ].join(' ')}>
            <input type="radio" name="met" checked={on} onChange={()=>setMetodo(o.v)}
              className="mt-1 accent-gb-red outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
            <div>
              <div className="inline-flex gap-1.5 items-center mb-0.5 text-[13px] font-semibold text-primary"><Ico icon={o.icon} sm />{o.titulo} {o.extra}</div>
              <div className="text-[12px] leading-[1.5] text-muted">{o.desc}</div>
            </div>
          </label>
        );
      })}

      {sel && (
        <div className="p-3.5 mt-3 mb-5 rounded-sm border border-border bg-elevated">
          <div className="mb-2 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">Resumo</div>
          {[
            ...(ficha?.nomeAluno ? [['Aluno', ficha.nomeAluno]] : []),
            ['Plano', sel.nome],
            ...((sel as { membros?: number }).membros && (sel as { membros?: number }).membros! > 1
              ? [['Praticantes', String((sel as { membros?: number }).membros)]] : []),
            ['Mensalidade', `€${sel.valor}/mês`],
            ['Pagamento', metodo==='stripe' ? 'Débito automático' : 'Numerário, pendente aprovação'],
          ].map(([k,v])=>(
            <div key={k} className="flex justify-between py-1.5 border-b border-border-subtle last:border-0">
              <span className="text-[12.5px] text-muted">{k}</span>
              <span className="text-[12.5px] font-semibold text-primary">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        {onBack && <Button variant="secondary" onClick={onBack}><Ico icon={ArrowLeftIcon} sm /> Voltar</Button>}
        <Button variant="primary" size="lg" disabled={!planoId} className={onBack ? '' : 'ml-auto'} onClick={()=>{ if(planoId) onNext(planoId,metodo); }}>
          {modo==='plano'
            ? <>Seguinte <Ico icon={ArrowRightIcon} sm /></>
            : metodo==='stripe'
              ? <><Ico icon={ArrowsRotateIcon} sm />Concluir com Stripe</>
              : <><Ico icon={LayerGroupIcon} sm />Submeter para aprovação</>}
        </Button>
      </div>
    </div>
  );
}

type AccountStatus = 'idle' | 'creating' | 'ok' | 'confirm_email' | 'error';

// ── Ecrãs finais (pendente / completo / erro) — mesmo cartão da ficha ────────
const TOM = {
  sucesso: { cor: 'text-gb-green-dark', icon: CheckCircleIcon },
  aviso:   { cor: 'text-amber-600',     icon: ClockIcon },
  erro:    { cor: 'text-gb-red',        icon: ExclamationTriangleIcon },
} as const;

function TelaFinal({ tom, titulo, children }: {
  tom: keyof typeof TOM; titulo: string; children: ReactNode;
}) {
  const t = TOM[tom];
  return (
    <div className={CARD_CLASS}>
      <div className="mb-4">
        <div className={['inline-flex gap-1.5 items-center mb-1 text-[10.5px] font-semibold tracking-[1px] uppercase', t.cor].join(' ')}>
          <Ico icon={t.icon} sm />Gracie Barra Braga
        </div>
        <h2 className="font-display text-lg font-extrabold uppercase text-primary">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function DetalhesInscricao({ linhas }: { linhas: [string, string][] }) {
  return (
    <div className="p-3.5 mb-4 rounded-sm border border-border bg-elevated">
      <div className="mb-2 text-[10.5px] font-semibold tracking-[0.8px] uppercase text-muted">Detalhes</div>
      {linhas.map(([k, v]) => (
        <div key={k} className="flex justify-between py-1.5 border-b border-border-subtle last:border-0">
          <span className="text-[12.5px] text-muted">{k}</span>
          <span className="text-[12.5px] font-semibold text-primary">{v}</span>
        </div>
      ))}
    </div>
  );
}

const contactoLinha = (
  <p className="text-[12px] text-muted">
    Dúvidas?{' '}
    <a href="https://wa.me/351927773854" className="font-semibold text-gb-red hover:underline">WhatsApp +351 927 773 854</a>
    {' · '}
    <a href="mailto:atendimento@gbbraga.com" className="text-gb-red hover:underline">atendimento@gbbraga.com</a>
  </p>
);

function Pendente({ ficha, contrato, plano, registerMode, onVoltar }: {
  ficha: FichaData; contrato: ContratoData | null; plano: Plano|undefined;
  registerMode?: boolean; onVoltar?: () => void;
}) {
  const { user } = useAuth();
  const [acctStatus, setAcctStatus] = useState<AccountStatus>('creating');
  const [acctErr, setAcctErr] = useState('');
  const [contratoErr, setContratoErr] = useState('');
  const updateProfile = useUpdateProfile();
  const jaCorreu = useRef(false);

  useEffect(() => {
    if (jaCorreu.current) return; // signUp não é idempotente (StrictMode 2×)
    jaCorreu.current = true;

    const run = async () => {

      let authUserId: string | null = user?.id ?? null;
      let needsConfirm = false;

      /* 1 ── Create auth account (registerMode only) */
      if (registerMode) {
        if (!isConfigured) { setAcctStatus('ok'); return; }
        const { data, error } = await supabase.auth.signUp({
          email: ficha.email,
          password: ficha.senha,
          options: { data: { nome: ficha.nomeAluno } },
        });
        if (error) {
          setAcctErr(error.message.includes('already registered')
            ? 'Este email já está registado. Vai ao Login e usa "Entrar".'
            : error.message);
          setAcctStatus('error');
          return;
        }
        authUserId = data.user?.id ?? null;
        needsConfirm = !data.session;
      }

      /* 2 ── Insert into alunos (status: inativo — awaiting admin approval) */
      let alunoId: string | null = null;
      try {
        const alunoData = await db.criarAluno({
          profileId: authUserId,
          nome:      ficha.nomeAluno,
          email:     ficha.email,
          telefone:  ficha.telefone,
          nif:       ficha.nif,
          faixa:     ficha.faixa || 'branca',
          grau:      0,
          morada:    ficha.morada,
          codPostal: ficha.codPostal,
          dataNasc:  ficha.dataNasc,
          planoId:   plano?.id   ?? null,
          planoNome: plano?.nome ?? null,
          status:    'inativo',
          metodoPagamento: 'numerario',
        });
        alunoId = alunoData?.id ?? null;
      } catch (e) { console.warn('criarAluno (pendente) error:', e); }

      /* 3 ── Save contract */
      if (alunoId && contrato) {
        try {
          await db.criarContrato({
            alunoId,
            alunoNome:     ficha.nomeAluno,
            alunoNif:      ficha.nif,
            planoId:       plano?.id    ?? null,
            planoNome:     plano?.nome  ?? null,
            valor:         plano?.valor ?? 0,
            assinaturaImg: contrato.assinatura,
            aceitaImagem:  contrato.aceitaImagem,
            aceitaRGPD:    contrato.aceitaRGPD,
            encPagamento:  ficha.encPagamento,
          });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('criarContrato (pendente) error:', msg);
          setContratoErr(msg);
        }
      }

      /* 4 ── Submit cash payment request */
      if (alunoId) {
        try {
          await db.submeterNumerario({
            alunoId,
            nomeAluno: ficha.nomeAluno,
            email:     ficha.email,
            telefone:  ficha.telefone,
            planoId:   plano?.id    ?? null,
            planoNome: plano?.nome  ?? null,
            valor:     plano?.valor ?? 0,
          });
        } catch (e) { console.warn('submeterNumerario error:', e); }
      }

      /* 5 ── Update profile (matricula_completa = false — pending approval) */
      if (authUserId) {
        try {
          await updateProfile.mutateAsync({
            id: authUserId,
            patch: {
              nome:               ficha.nomeAluno,
              telefone:           ficha.telefone,
              matricula_completa: false,
            },
          });
        } catch (e) {
          console.error('Profile update error (pendente):', e instanceof Error ? e.message : e);
        }
      }

      setAcctStatus(needsConfirm ? 'confirm_email' : 'ok');
    };

    run().catch(e => {
      console.error('Pendente save error:', e);
      setAcctStatus('ok'); // still show the pending screen even if DB save fails
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TelaFinal tom="aviso" titulo="Inscrição pendente de aprovação">
      <p className="mb-4 text-[13px] leading-[1.7] text-secondary">
        Registámos a tua inscrição com <strong>pagamento em numerário</strong>. Um
        administrador vai rever o pedido e recebes contacto em <strong>{ficha.email}</strong>{' '}
        quando a conta ficar ativa.
      </p>

      {registerMode && acctStatus === 'creating' && (
        <div className="flex gap-2.5 items-center mb-4 text-[13px] text-muted">
          <div className="w-4 h-4 rounded-full border-2 border-border border-t-amber-600 animate-[spin_0.8s_linear_infinite]"/>
          A criar a tua conta…
        </div>
      )}
      {registerMode && acctStatus === 'confirm_email' && (
        <div className="flex gap-1.5 items-start py-2.5 px-3.5 mb-4 text-[12.5px] leading-[1.6] rounded-sm border text-secondary border-border bg-elevated">
          <Ico icon={InboxIcon} sm /><span><strong>Verifica o teu email</strong>: enviámos um link de confirmação para <strong>{ficha.email}</strong>.</span>
        </div>
      )}
      {registerMode && acctStatus === 'error' && (
        <div className="flex gap-1.5 items-center py-2.5 px-3.5 mb-4 text-[12.5px] font-semibold rounded-sm border text-gb-red border-gb-red/25 bg-gb-red/[0.06]">
          <Ico icon={ExclamationTriangleIcon} sm />{acctErr}
        </div>
      )}

      <DetalhesInscricao linhas={[
        ['Aluno', ficha.nomeAluno],
        ['Plano', plano?.nome || '-'],
        ['Mensalidade', plano ? `€${plano.valor}/mês` : '-'],
        ['Pagamento', 'Numerário, aguarda aprovação'],
        ['Email', ficha.email],
      ]} />

      {contratoErr && (
        <div className="py-2.5 px-3.5 mb-4 text-[12px] rounded-sm border text-gb-red border-gb-red/25 bg-gb-red/[0.06]">
          <div className="inline-flex gap-1.5 items-center mb-1 font-bold"><Ico icon={ExclamationTriangleIcon} sm />Erro ao guardar o contrato</div>
          {contratoErr}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-between items-center">
        {contactoLinha}
        {registerMode && onVoltar && (
          <Button variant="secondary" onClick={onVoltar}><Ico icon={ArrowLeftIcon} sm /> Voltar ao login</Button>
        )}
      </div>
    </TelaFinal>
  );
}

function Completo({ ficha, contrato, plano, isStaff, registerMode, onConcludo, onCorrigirFicha }: {
  ficha: FichaData; contrato: ContratoData | null; plano: Plano|undefined;
  isStaff?: boolean; registerMode?: boolean; onConcludo?: () => void; onCorrigirFicha?: () => void;
}) {
  const { user } = useAuth();
  const [acctStatus, setAcctStatus] = useState<AccountStatus>('creating');
  const [acctErr, setAcctErr] = useState('');
  const [contratoErr, setContratoErr] = useState('');
  const updateProfile = useUpdateProfile();
  const jaCorreu = useRef(false);

  useEffect(() => {
    // Corre uma única vez — o signUp não é idempotente (StrictMode em dev
    // monta o efeito 2×, o 2.º signUp dá "duplicate key" 500 e rebenta a
    // cadeia toda).
    if (jaCorreu.current) return;
    jaCorreu.current = true;

    const run = async () => {

      let authUserId: string | null = user?.id ?? null;
      let needsConfirm = false;

      /* 1 ── Create Supabase auth account (registerMode only) */
      if (registerMode) {
        if (!isConfigured) { setAcctStatus('ok'); return; }
        const { data, error } = await supabase.auth.signUp({
          email: ficha.email,
          password: ficha.senha,
          options: { data: { nome: ficha.nomeAluno } },
        });
        if (error) {
          setAcctErr(error.message.includes('already registered')
            ? 'Este email já está registado. Vai ao Login e usa "Entrar".'
            : error.message);
          setAcctStatus('error');
          return;
        }
        authUserId = data.user?.id ?? null;
        needsConfirm = !data.session;
      }

      /* 2 ── Insert into alunos table (status 'ativo' — um aluno 'inativo' é
         imediatamente deslogado por auth.tsx/sincronizar_ban_aluno, o que
         mataria a sessão antes do checkout de subscrição arrancar). A
         subscrição em si é confirmada pelo webhook; se o checkout for
         abandonado, fica 'ativo' sem subscrição para o admin tratar. */
      let alunoId: string | null = null;
      try {
        const alunoData = await db.criarAluno({
          profileId: authUserId,
          nome:      ficha.nomeAluno,
          email:     ficha.email,
          telefone:  ficha.telefone,
          nif:       ficha.nif,
          faixa:     ficha.faixa || 'branca',
          grau:      0,
          morada:    ficha.morada,
          codPostal: ficha.codPostal,
          dataNasc:  ficha.dataNasc,
          planoId:   plano?.id   ?? null,
          planoNome: plano?.nome ?? null,
          status:    'ativo',
        });
        alunoId = alunoData?.id ?? null;
      } catch (e) {
        console.warn('criarAluno error:', e);
      }

      /* 3 ── Save contract */
      if (alunoId && contrato) {
        try {
          await db.criarContrato({
            alunoId,
            alunoNome:     ficha.nomeAluno,
            alunoNif:      ficha.nif,
            planoId:       plano?.id    ?? null,
            planoNome:     plano?.nome  ?? null,
            valor:         plano?.valor ?? 0,
            assinaturaImg: contrato.assinatura,
            aceitaImagem:  contrato.aceitaImagem,
            aceitaRGPD:    contrato.aceitaRGPD,
            encPagamento:  ficha.encPagamento,
          });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.warn('criarContrato error:', msg);
          setContratoErr(msg);
        }
      }

      /* 4 ── Staff enrollment: create the first monthly payment record.
         Self/Stripe path: no manual row — as linhas de pagamento passam a vir
         do webhook invoice.paid depois da subscrição arrancar. */
      if (isStaff && alunoId && plano) {
        try {
          const venc = new Date();
          venc.setDate(5);
          if (venc <= new Date()) venc.setMonth(venc.getMonth() + 1);
          await db.criarPagamento({
            alunoId,
            alunoNome: ficha.nomeAluno,
            planoId:   plano.id,
            planoNome: plano.nome,
            valor:     plano.valor,
            vencimento: venc.toISOString().split('T')[0],
          });
        } catch (e) { console.warn('criarPagamento error:', e); }
      }

      /* 5 ── Update profile (matricula_completa = true) */
      if (authUserId) {
        try {
          await updateProfile.mutateAsync({
            id: authUserId,
            patch: {
              nome:               ficha.nomeAluno,
              telefone:           ficha.telefone,
              matricula_completa: true,
            },
          });
        } catch (e) {
          console.error('Profile update error:', e instanceof Error ? e.message : e);
        }
      }

      /* 6 ── Self/Stripe path with a live session → arrancar a subscrição já.
         Sem sessão (needsConfirm) o aluno ativa o débito no 1.º login, em
         "Meu Financeiro". Staff fica no ecrã de sucesso. */
      if (!isStaff && !needsConfirm && plano) {
        try {
          const { url } = await criarCheckoutSession({ planoId: plano.id });
          window.location.assign(url);
          return; // full-page redirect — não mexer mais no estado
        } catch (e) {
          console.warn('criarCheckoutSession (matrícula) error:', e);
          // cai para o ecrã 'ok' com nota para ativar depois
        }
      }

      if (!needsConfirm) {
        // All DB work done and session is live — notify parent so it can
        // refresh the user profile and unmount this registration flow.
        onConcludo?.();
      }
      setAcctStatus(needsConfirm ? 'confirm_email' : 'ok');
    };

    run().catch(e => {
      console.error('Completo save error:', e);
      setAcctErr(String(e));
      setAcctStatus('error');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (acctStatus === 'creating') {
    return (
      <div className={CARD_CLASS}>
        <div className="flex gap-3 items-center">
          <div className="w-5 h-5 rounded-full border-2 border-elevated border-t-gb-red animate-[spin_0.8s_linear_infinite]"/>
          <p className="text-[13px] text-secondary">A criar a tua conta…</p>
        </div>
      </div>
    );
  }

  if (acctStatus === 'confirm_email') {
    return (
      <TelaFinal tom="aviso" titulo="Confirma o teu email">
        <p className="mb-4 text-[13px] leading-[1.7] text-secondary">
          Enviámos um email de confirmação para <strong>{ficha.email}</strong>. Clica no
          link para ativar a conta e depois entra para ativar o débito automático em{' '}
          <strong>Meu Financeiro</strong>.
        </p>
        {contactoLinha}
      </TelaFinal>
    );
  }

  if (acctStatus === 'error') {
    return (
      <TelaFinal tom="erro" titulo="Não foi possível criar a conta">
        <p className="mb-4 text-[13px] leading-[1.7] text-secondary">{acctErr}</p>
        <div className="flex flex-wrap gap-3 justify-between items-center">
          {contactoLinha}
          {onCorrigirFicha && (
            <Button variant="secondary" onClick={onCorrigirFicha}>
              <Ico icon={ArrowLeftIcon} sm /> Voltar e corrigir
            </Button>
          )}
        </div>
      </TelaFinal>
    );
  }

  return (
    <TelaFinal tom="sucesso" titulo="Bem-vindo à família GB">
      <p className="mb-4 text-[13px] leading-[1.7] text-secondary">
        {isStaff
          ? <>Ficha e contrato concluídos, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>. O perfil está ativo. OSS!</>
          : <>Matrícula registada, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>. Falta ativar o débito automático: entra no portal e fá-lo em <strong>Meu Financeiro</strong>. OSS!</>}
      </p>

      <DetalhesInscricao linhas={[
        ['Aluno', ficha.nomeAluno],
        ['Email', ficha.email],
        ['Plano', plano?.nome || '-'],
        ['Mensalidade', plano ? `€${plano.valor}/mês` : '-'],
      ]} />

      {contratoErr && (
        <div className="py-2.5 px-3.5 mb-4 text-[12px] rounded-sm border text-gb-red border-gb-red/25 bg-gb-red/[0.06]">
          <div className="inline-flex gap-1.5 items-center mb-1 font-bold"><Ico icon={ExclamationTriangleIcon} sm />Erro ao guardar o contrato</div>
          O aluno foi criado mas o contrato não. Contacta o administrador.
        </div>
      )}

      {registerMode && acctStatus === 'ok' && (
        <a href="/" className="inline-block">
          <Button variant="primary" size="lg">Entrar no portal <Ico icon={ArrowRightIcon} sm /></Button>
        </a>
      )}
    </TelaFinal>
  );
}

// ── Conclusão da matrícula família ─────────────────────────────────────────
function CompletoFamilia({ familia, contrato, plano, onCorrigirFicha }: {
  familia: FamiliaData; contrato: ContratoData | null; plano: Plano | undefined;
  onCorrigirFicha?: () => void;
}) {
  const [estado, setEstado] = useState<'criando' | 'pronto' | 'erro'>('criando');
  const [erro, setErro] = useState('');
  // Guardado em vez de redirecionar logo: só para mostrar o aviso de que as
  // contas ficaram criadas antes de sair para o Stripe — todas já têm a
  // password escolhida no formulário, não há nada mais a fazer aui.
  const [resultado, setResultado] = useState<{ url: string } | null>(null);
  const jaCorreu = useRef(false);

  useEffect(() => {
    if (jaCorreu.current || !plano) return;
    jaCorreu.current = true;

    (async () => {
      try {
        const { url } = await criarMatriculaFamilia({
          planoId: plano.id,
          contrato: {
            assinatura: contrato?.assinatura,
            aceitaImagem: contrato?.aceitaImagem,
            aceitaRGPD: contrato?.aceitaRGPD,
          },
          titular: {
            nome: familia.titular.nome,
            email: familia.titular.email,
            senha: familia.titular.senha,
            nif: familia.titular.nif || undefined,
            telefone: familia.titular.telefone || undefined,
            morada: familia.titular.morada || undefined,
            codPostal: familia.titular.codPostal || undefined,
            treina: familia.titular.treina,
            dataNasc: familia.titular.treina ? dmyToIso(familia.titular.dataNasc) : undefined,
            faixa: familia.titular.faixa || undefined,
            grau: Number(familia.titular.grau) || 0,
          },
          membros: familia.membros.map(m => ({
            nome: m.nome,
            dataNasc: dmyToIso(m.dataNasc),
            faixa: m.faixa || undefined,
            grau: Number(m.grau) || 0,
            email: m.email.trim() || undefined,
            senha: m.senha,
          })),
          encarregado: (familia.encEE.ativo || familia.membros.some(m => {
            const i = calcularIdade(dmyToIso(m.dataNasc));
            return i !== null && i < 18;
          }))
            ? {
                nome: familia.encEE.nome,
                nif: familia.encEE.nif || undefined,
                telefone: familia.encEE.telefone || undefined,
                email: familia.encEE.email || undefined,
              }
            : undefined,
        });
        setResultado({ url });
        setEstado('pronto');
      } catch (e) {
        const err = e as Error & { payload?: { campo?: string } };
        setErro(err.message || 'Não foi possível concluir a matrícula.');
        setEstado('erro');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (estado === 'criando') {
    return (
      <div className={CARD_CLASS}>
        <div className="flex gap-3 items-center">
          <div className="w-5 h-5 rounded-full border-2 border-elevated border-t-gb-red animate-[spin_0.8s_linear_infinite]"/>
          <p className="text-[13px] text-secondary">A criar as contas da família…</p>
        </div>
      </div>
    );
  }

  if (estado === 'pronto' && resultado) {
    return (
      <TelaFinal tom="sucesso" titulo="Contas criadas com sucesso!">
        <p className="mb-5 text-[13px] leading-[1.7] text-secondary">
          Já criámos a conta de todos os praticantes, cada uma com a password que
          definiram no formulário. Falta só ativar o pagamento.
        </p>
        <Button variant="primary" size="lg" fullWidth onClick={() => window.location.assign(resultado.url)}>
          Continuar para o pagamento <Ico icon={ArrowRightIcon} sm />
        </Button>
      </TelaFinal>
    );
  }

  return (
    <TelaFinal tom="erro" titulo="Não foi possível concluir a matrícula">
      <p className="mb-4 text-[13px] leading-[1.7] text-secondary">{erro}</p>
      <div className="flex flex-wrap gap-3 justify-between items-center">
        {contactoLinha}
        {onCorrigirFicha && (
          <Button variant="secondary" onClick={onCorrigirFicha}>
            <Ico icon={ArrowLeftIcon} sm /> Voltar e corrigir
          </Button>
        )}
      </div>
    </TelaFinal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface FluxoMatriculaProps {
  onConcludo?: () => void;
  /** rendered inside admin Layout — hides own header/wrapper */
  embedded?: boolean;
  /** public self-registration — adds password fields, creates Supabase account */
  registerMode?: boolean;
  /** called when user clicks "← Voltar ao login" in registerMode */
  onVoltar?: () => void;
}

export default function FluxoMatricula({ embedded = false, registerMode = false, onVoltar, onConcludo }: FluxoMatriculaProps) {
  const { data: planos } = usePlanos();
  const { user } = useAuth();
  const isStaff = !registerMode && (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'professor' || user?.role === 'atendimento');

  // Público: escolhe o plano primeiro. Staff: começa na ficha (escolhe lá).
  const [step, setStep]       = useState<Step>(registerMode ? 'plano' : 'ficha');
  const [ficha, setFicha]     = useState<FichaData | null>(null);
  const [familia, setFamilia] = useState<FamiliaData | null>(null);
  const [contrato, setContrato] = useState<ContratoData | null>(null);
  const [planoId, setPlanoId] = useState('');
  const [metodo, setMetodo]   = useState<'stripe'|'numerario'>('stripe');
  const plano = planos.find(p=>p.id===planoId);
  const nMembros = (plano as { membros?: number } | undefined)?.membros ?? 1;
  const eFamilia = nMembros > 1;

  useEffect(() => { if (!embedded) window.scrollTo(0,0); }, [step, embedded]);

  const content = (
    <>
      {!embedded && (
        <div className="mb-1 text-[10.5px] font-bold tracking-[1.5px] text-gb-red uppercase">
          Gracie Barra Braga
        </div>
      )}
      <div className="flex justify-between items-center mb-5">
        <h1 className={['m-0 font-display font-black text-primary uppercase', embedded ? 'text-lg' : 'text-[22px]'].join(' ')}>
          {embedded
            ? <span className="inline-flex gap-2 items-center"><Ico icon={LayerGroupIcon} /> Nova Matrícula de Aluno</span>
            : registerMode ? 'Matrícula' : 'Nova Matrícula'}
        </h1>
        {registerMode && onVoltar && step === 'plano' && (
          <button onClick={onVoltar} className="py-1.5 px-3.5 min-h-11 sm:min-h-0 font-ui text-[13px] bg-none rounded-lg border cursor-pointer border-border text-muted transition-colors duration-200 hover:bg-elevated hover:text-primary active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            ← Voltar ao login
          </button>
        )}
      </div>
      <StepBar step={step} isStaff={isStaff}/>

      {/* Passo 1 (só público) — plano + forma de pagamento */}
      {step==='plano' && (
        <EscolhaPagamento
          modo="plano"
          initialPlanoId={planoId} initialMetodo={metodo}
          onNext={(pid,met)=>{ setPlanoId(pid); setMetodo(met); setStep('ficha'); }}
        />
      )}

      {/* Passo 2 — ficha (individual ou família) */}
      {step==='ficha' && registerMode && eFamilia && (
        <FichaFamilia
          initial={familia} nMembros={nMembros} planoNome={plano?.nome ?? ''}
          onBack={()=>setStep('plano')}
          onNext={f=>{ setFamilia(f); setStep('contrato'); }}
        />
      )}
      {step==='ficha' && (!registerMode || !eFamilia) && (
        <FichaInscricao
          initial={ficha} registerMode={registerMode} isStaff={isStaff} planos={planos}
          onBack={registerMode ? ()=>setStep('plano') : onVoltar}
          onNext={d=>{ setFicha(d); if(d.planoId) setPlanoId(d.planoId); setStep('contrato'); }}
        />
      )}

      {/* Passo 3 — contrato */}
      {step==='contrato' && (ficha || familia) && (
        <ContratoAssinatura
          ficha={ficha ?? familiaComoFicha(familia!)}
          onBack={()=>setStep('ficha')}
          onNext={c=>{ setContrato(c); setStep(isStaff ? 'completo' : (metodo==='numerario' ? 'pendente' : 'completo')); }}
        />
      )}

      {/* Passo 4 — concluir */}
      {step==='pendente'  && ficha && <Pendente ficha={ficha} contrato={contrato} plano={plano} registerMode={registerMode} onVoltar={onVoltar}/>}
      {step==='completo'  && (
        eFamilia && familia
          ? <CompletoFamilia familia={familia} contrato={contrato} plano={plano} onCorrigirFicha={()=>setStep('ficha')}/>
          : ficha && <Completo ficha={ficha} contrato={contrato} plano={plano} isStaff={isStaff} registerMode={registerMode} onConcludo={onConcludo} onCorrigirFicha={()=>setStep('ficha')}/>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="mx-auto pt-1 pb-8 max-w-[720px] font-ui">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-ui bg-base">
      <header className="flex sticky top-0 z-[100] justify-between items-center py-0 px-6 h-16 border-b border-border bg-card">
        <GBLogoFull size={50}/>
        <div className="text-xs text-right text-secondary">
          Rua Nova Santa Cruz 11, Braga<br/>+351 927 773 854
        </div>
      </header>
      <div className="mx-auto py-8 px-5 max-w-[720px]">
        {content}
      </div>
    </div>
  );
}
