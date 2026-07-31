/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { usePlanos, db } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { useUpdateProfile } from '../../hooks/useProfile';
import { GBLogoFull } from '../../components/GBLogo';
import type { Plano } from '../../types';
import {
  Ico,
  type HeroIcon,
  MartialArtsIcon,
  StarIcon,
  UsersIcon,
  TrophyIcon,
  CheckIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  ClipboardDocumentIcon,
  KeyIcon,
  SignatureIcon,
  MoneyBagIcon,
  InboxIcon,
  ChatBubbleLeftRightIcon,
} from '../../lib/icons';

type Step = 'ficha' | 'contrato' | 'pagamento' | 'pendente' | 'completo';

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

const FAIXAS = ['Branca','Cinza e Branca','Cinza','Cinza e Preta','Amarela e Branca','Amarela','Amarela e Preta','Laranja e Branca','Laranja','Laranja e Preta','Verde e Branca','Verde','Verde e Preta','Azul','Roxa','Marrom','Preta'];
const CATEGORIAS: { id: string; label: string; icon: HeroIcon }[] = [{id:'adulto',label:'Adulto',icon:MartialArtsIcon},{id:'kids',label:'Kids',icon:StarIcon},{id:'familia',label:'Família',icon:UsersIcon},{id:'fundador',label:'Sócio Fundador',icon:TrophyIcon}];

const INP_CLASS = 'block box-border w-full py-2.5 px-3.5 min-h-11 sm:min-h-0 font-inherit text-sm rounded-lg border-[1.5px] outline-none transition-all duration-200 border-border bg-white text-primary focus:border-gb-red focus-visible:ring-2 focus-visible:ring-gb-red/25';
const BTN_CLASS = 'py-3.5 px-8 min-h-11 sm:min-h-0 font-display text-[15px] font-extrabold text-white rounded-[10px] border-none shadow-[0_4px_14px_rgba(200,16,46,0.3)] cursor-pointer bg-gb-red transition-all duration-200 hover:bg-gb-red-dark active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2';
const BTN2_CLASS = 'py-3.5 px-6 min-h-11 sm:min-h-0 font-inherit text-sm rounded-[10px] border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2';
const CARD_CLASS = 'p-7 mb-5 rounded-2xl border shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-border bg-white';
const LBL_CLASS = 'block mb-1.5 text-[11px] font-bold tracking-[0.8px] uppercase text-secondary';
const SEC_CLASS = 'pb-2 mb-3.5 text-[15px] font-bold border-b-2 text-primary border-border';

function StepBar({ step, isStaff = false }: { step: Step; isStaff?: boolean }) {
  const steps = isStaff
    ? [{id:'ficha',label:'Ficha'},{id:'contrato',label:'Contrato'},{id:'completo',label:'Ativo'}]
    : [{id:'ficha',label:'Ficha'},{id:'contrato',label:'Contrato'},{id:'pagamento',label:'Pagamento'},{id:'completo',label:'Ativo'}];
  const idx = steps.findIndex(s => s.id === step || (step==='pendente' && s.id==='completo'));
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

function FichaInscricao({ onNext, registerMode = false, isStaff = false, planos = [] }: { onNext:(d:FichaData)=>void; registerMode?: boolean; isStaff?: boolean; planos?: import('../../types').Plano[] }) {
  const blank: FichaData = {
    nomeAluno:'', dataNasc:'', nif:'', morada:'', codPostal:'', telefone:'', email:'',
    faixa:'', necessidades:'', temEE:false, nomeEE:'', nifEE:'', telEE:'', emailEE:'',
    encPagamento:'aluno', nomePag:'', nifPag:'', telPag:'', emailPag:'',
    planoId:'', senha:'', confirmarSenha:'',
  };
  const [catStaff, setCatStaff] = useState('adulto');
  const [d, setD] = useState<FichaData>(blank);
  const [err, setErr] = useState<Record<string,string>>({});

  // ── Compute whether student is under 18 ────────────────────────────────────
  const isMinor = (() => {
    if (!d.dataNasc) return false;
    const today = new Date();
    const birth = new Date(d.dataNasc);
    const age = today.getFullYear() - birth.getFullYear() -
      (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate()) ? 1 : 0);
    return age < 18;
  })();

  // When student is a minor, force temEE = true
  useEffect(() => {
    if (isMinor) setD(p => ({ ...p, temEE: true }));
  }, [isMinor]);

  const set = (k: keyof FichaData) => (e: React.ChangeEvent<any>) =>
    setD(p => ({ ...p, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const field = (k: keyof FichaData, label: string, type='text', ph='', required=true) => (
    <div className="mb-3">
      <label className={LBL_CLASS}>{label}{required ? ' *' : ''}</label>
      <input type={type} value={d[k] as string} onChange={set(k)} placeholder={ph}
        className={[INP_CLASS, err[k] ? 'border-gb-red' : ''].join(' ')}/>
      {err[k] && <div className="mt-1 text-[11px] text-gb-red">{err[k]}</div>}
    </div>
  );

  const validate = () => {
    const e: Record<string,string> = {};
    if (!d.nomeAluno.trim()) e.nomeAluno='Obrigatório';
    if (!d.dataNasc) e.dataNasc='Obrigatório';
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
    return Object.keys(e).length===0;
  };

  return (
    <div className={CARD_CLASS}>
      <div className="flex gap-3.5 items-center py-[18px] px-[22px] mb-[22px] rounded-xl" style={{ background: 'linear-gradient(135deg,#0D0508,#2A0510)' }}>
        <GBLogoFull size={50}/>
        <div>
          <div className="font-display text-base font-extrabold text-white uppercase">Ficha de Inscrição</div>
          <div className="mt-0.5 text-xs text-white/55">Gracie Barra Braga · Rua Nova Santa Cruz 11, Braga</div>
        </div>
      </div>
      <p className="py-3 px-4 mb-[22px] text-[13px] leading-[1.7] rounded-lg border text-secondary border-gb-red/[0.12] bg-gb-red/[0.04]">
        Por favor preencha a ficha de matrícula para formalizar a sua adesão e ativar o seu seguro de aluno.{' '}
        <strong className="text-gb-red">Atenção:</strong> As fichas têm que ser preenchidas uma por aluno.
      </p>

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={MartialArtsIcon} sm />Identificação do Aluno</span></div>
      <p className="mb-3.5 text-[11px] text-muted">Todos os campos marcados com * são obrigatórios</p>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {field('nomeAluno','Nome do Aluno')}
        {field('dataNasc','Data de Nascimento','date')}
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

      <div className="flex justify-between items-center pb-2 mb-3.5 border-b-2 border-border">
        <span className="inline-flex gap-1.5 items-center text-[15px] font-bold text-primary"><Ico icon={UserIcon} sm />Encarregado de Educação</span>
        {isMinor && (
          <span className="py-1 px-2.5 text-[10px] font-extrabold tracking-[0.6px] text-white uppercase rounded-md bg-gb-red">
            Obrigatório
          </span>
        )}
      </div>

      {isMinor ? (
        /* Minor: locked notice — cannot uncheck */
        <div className="flex gap-2.5 items-center py-2.5 px-3.5 mb-3.5 rounded-lg border-[1.5px] border-gb-red/25 bg-gb-red/[0.06]">
          <FontAwesomeIcon icon={ExclamationTriangleIcon} className="w-4 h-4 text-gb-red" />
          <span className="text-[13px] font-semibold text-gb-red">
            O aluno tem menos de 18 anos — dados do Encarregado de Educação são obrigatórios.
          </span>
        </div>
      ) : (
        /* Adult: optional toggle */
        <div className="flex gap-2.5 items-center py-2.5 px-3.5 mb-3.5 rounded-lg cursor-pointer transition-colors duration-200 bg-base hover:bg-elevated"
          onClick={()=>setD(p=>({...p, temEE:!p.temEE}))}>
          <input type="checkbox" checked={d.temEE} onChange={()=>{}} className="w-4 h-4 cursor-pointer outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
          <span className="text-[13px] text-[#333]">Aplicável (menor de 18 anos ou dependente)</span>
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

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={CreditCardIcon} sm />Encarregado do Pagamento da Mensalidade</span></div>
      {(['aluno','ee','outro'] as const).map(val => {
        const labels = { aluno:'O aluno', ee:'O encarregado de educação', outro:'Nenhum dos mencionados (outro)' };
        return (
          <label key={val}
            className={[
              'flex gap-2.5 items-center py-2.5 px-3.5 mb-2 rounded-lg border-[1.5px] cursor-pointer transition-colors duration-200',
              d.encPagamento===val ? 'border-gb-red bg-gb-red/5' : 'border-border bg-base hover:bg-elevated',
            ].join(' ')}>
            <input type="radio" name="ep" checked={d.encPagamento===val} onChange={()=>setD(p=>({...p,encPagamento:val}))} className="outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
            <span className="text-[13px] text-[#333]">{labels[val]}</span>
          </label>
        );
      })}
      {d.encPagamento==='outro' && (
        <div className="p-3.5 px-4 mt-3 rounded-xl bg-base">
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
          <div className={[SEC_CLASS, 'mt-2'].join(' ')}><span className="inline-flex gap-1.5 items-center"><Ico icon={ClipboardDocumentIcon} sm />Plano de Adesão</span></div>
          <div className="flex flex-wrap gap-2 mb-3.5">
            {CATEGORIAS.map(c => (
              <button key={c.id} onClick={()=>setCatStaff(c.id)}
                className={[
                  'flex gap-1.5 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 font-inherit text-[13px] rounded-lg border-[1.5px] cursor-pointer transition-colors duration-200',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  catStaff===c.id ? 'font-bold text-gb-red border-gb-red bg-gb-red/8' : 'font-normal text-secondary border-border bg-base hover:bg-elevated active:bg-elevated',
                ].join(' ')}>
                <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" /> {c.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 mb-[22px]">
            {planos.filter(p => p.ativo && (p as any).categoria === catStaff).map(p => (
              <button key={p.id} onClick={()=>setD(prev=>({...prev, planoId: p.id}))}
                className={[
                  'flex justify-between items-center py-3.5 px-[18px] text-left rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-[0.99]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
                  d.planoId===p.id ? 'border-gb-red bg-gb-red/[0.04]' : 'border-border bg-white hover:bg-elevated',
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
              <p className="p-3 px-4 text-[13px] rounded-lg text-muted bg-base">
                Sem planos disponíveis nesta categoria.
              </p>
            )}
          </div>
        </>
      )}

      {/* ── Password section (only in registerMode) ── */}
      {registerMode && (
        <>
          <div className={[SEC_CLASS, 'mt-2'].join(' ')}><span className="inline-flex gap-1.5 items-center"><Ico icon={KeyIcon} sm />Criar Acesso à Plataforma</span></div>
          <p className="mb-3.5 text-xs leading-[1.6] text-muted">
            Define a password que vais usar para entrar no portal do aluno.
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {field('senha','Password','password','Mínimo 6 caracteres')}
            {field('confirmarSenha','Confirmar Password','password','Repete a password')}
          </div>
        </>
      )}

      <div className="flex justify-end mt-4">
        <button className={BTN_CLASS} onClick={()=>{ if(validate()) onNext(d); }}>Seguinte → Contrato</button>
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
    if (!c.aceitaImagem) e.push('Autorize a utilização de imagem');
    if (!c.aceitaRGPD) e.push('Aceite o tratamento de dados (RGPD)');
    if (!c.aceitaContrato) e.push('Confirme que leu e aceita o contrato');
    if (!hasSig) e.push('Assine o contrato');
    setErrors(e);
    return e.length===0;
  };

  const chk = (key: keyof ContratoData, label: string) => (
    <label className={[
      'flex gap-3 items-start py-3 px-4 mb-2.5 rounded-xl border-[1.5px] cursor-pointer transition-colors duration-200',
      (c[key] as boolean) ? 'border-gb-red bg-gb-red/[0.04]' : 'border-border bg-base hover:bg-elevated',
    ].join(' ')}>
      <input type="checkbox" checked={c[key] as boolean} onChange={()=>setC(p=>({...p,[key]:!p[key as keyof ContratoData]}))}
        className="mt-0.5 w-4 h-4 shrink-0 outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
      <span className="text-[13px] leading-[1.5] text-[#333]">{label}</span>
    </label>
  );

  return (
    <div className={CARD_CLASS}>
      <div className="flex gap-3 items-center mb-5">
        <GBLogoFull size={46}/>
        <div>
          <div className="font-display text-[15px] font-extrabold text-primary uppercase">Contrato de Adesão</div>
          <div className="text-[11.5px] text-muted">Gracie Barra Braga · {hoje}</div>
        </div>
      </div>

      <div className="p-[22px] px-[26px] mb-[22px] text-[13.5px] leading-[1.8] rounded-xl border text-[#333] border-border bg-base">
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

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={SignatureIcon} sm />Assine aqui com o mouse ou dedo</span></div>
      <div className="overflow-hidden relative rounded-xl border-[1.5px] border-border bg-[#FAFAF9]">
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
        <div className="p-3 px-4 mb-4 rounded-lg border border-gb-red/20 bg-gb-red/5">
          <div className="mb-1.5 text-xs font-bold text-gb-red">Complete os seguintes campos:</div>
          {errors.map((e,i)=><div key={i} className="text-xs text-gb-red">• {e}</div>)}
        </div>
      )}

      <div className="flex justify-between">
        <button className={BTN2_CLASS} onClick={onBack}>← Voltar</button>
        <button className={BTN_CLASS} onClick={()=>{ if(validate()) onNext(c); }}>Seguinte → Pagamento</button>
      </div>
    </div>
  );
}

function EscolhaPagamento({ ficha, onNext, onBack }: { ficha:FichaData; onNext:(pid:string,met:'stripe'|'numerario')=>void; onBack:()=>void }) {
  const { data: allPlanos } = usePlanos();
  const [cat, setCat] = useState('adulto');
  const [planoId, setPlanoId] = useState('');
  const [metodo, setMetodo] = useState<'stripe'|'numerario'>('stripe');
  const planos = allPlanos.filter(p=>p.ativo && (p as any).categoria===cat);
  const sel = planos.find(p=>p.id===planoId);

  return (
    <div className={CARD_CLASS}>
      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={ClipboardDocumentIcon} sm />Escolha o Plano</span></div>
      <div className="flex flex-wrap gap-2 mb-[18px]">
        {CATEGORIAS.map(c=>(
          <button key={c.id} onClick={()=>{ setCat(c.id); setPlanoId(''); }}
            className={[
              'flex gap-1.5 items-center py-1.5 px-3.5 min-h-11 sm:min-h-0 font-inherit text-[13px] rounded-lg border-[1.5px] cursor-pointer transition-colors duration-200',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              cat===c.id ? 'font-bold text-gb-red border-gb-red bg-gb-red/8' : 'font-normal text-secondary border-border bg-base hover:bg-elevated active:bg-elevated',
            ].join(' ')}>
            <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" /> {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 mb-[22px]">
        {planos.map(p=>(
          <button key={p.id} onClick={()=>setPlanoId(p.id)}
            className={[
              'flex justify-between items-center py-3.5 px-[18px] text-left rounded-xl border-2 transition-all duration-200 cursor-pointer active:scale-[0.99]',
              'outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2',
              planoId===p.id ? 'border-gb-red bg-gb-red/[0.04]' : 'border-border bg-white hover:bg-elevated',
            ].join(' ')}>
            <div>
              <div className="mb-0.5 text-sm font-bold text-primary">{p.nome}</div>
              <div className="text-xs text-muted">{p.descricao} · IVA 23% incluído</div>
            </div>
            <div className="flex-shrink-0 ml-4 text-right">
              <div className={['font-display text-[22px] font-black', planoId===p.id ? 'text-gb-red' : 'text-primary'].join(' ')}>€{p.valor}</div>
              <div className="text-[11px] text-muted">/mês</div>
            </div>
          </button>
        ))}
      </div>

      <div className={SEC_CLASS}><span className="inline-flex gap-1.5 items-center"><Ico icon={CreditCardIcon} sm />Forma de Pagamento</span></div>
      <label className={[
        'flex gap-3 items-start py-3.5 px-[18px] mb-2.5 rounded-xl border-2 cursor-pointer transition-colors duration-200',
        metodo==='stripe' ? 'border-gb-red bg-gb-red/[0.04]' : 'border-border bg-base hover:bg-elevated',
      ].join(' ')}>
        <input type="radio" name="met" checked={metodo==='stripe'} onChange={()=>setMetodo('stripe')} className="mt-0.5 outline-none accent-gb-red focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2"/>
        <div>
          <div className="inline-flex gap-1.5 items-center mb-1 text-sm font-bold text-primary"><Ico icon={CreditCardIcon} sm />Débito Automático — Stripe</div>
          <div className="text-[12.5px] leading-[1.5] text-muted">Cartão de débito ou crédito. Cobrança automática no dia 5 de cada mês. Cancelamento a qualquer momento. 100% seguro.</div>
        </div>
      </label>
      <label className={[
        'flex gap-3 items-start py-3.5 px-[18px] mb-5 rounded-xl border-2 cursor-pointer transition-colors duration-200',
        metodo==='numerario' ? 'border-amber-600 bg-amber-600/5' : 'border-border bg-base hover:bg-elevated',
      ].join(' ')}>
        <input type="radio" name="met" checked={metodo==='numerario'} onChange={()=>setMetodo('numerario')} className="mt-0.5 outline-none accent-amber-600 focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"/>
        <div>
          <div className="inline-flex gap-1.5 items-center mb-1 text-sm font-bold text-primary"><Ico icon={MoneyBagIcon} sm />Numerário (dinheiro)</div>
          <div className="text-[12.5px] leading-[1.5] text-muted">
            Pagamento em dinheiro na receção até ao dia 5 de cada mês.
            <span className="font-bold text-amber-600"> Requer aprovação do Super Administrador.</span>
          </div>
        </div>
      </label>

      {sel && (
        <div className="py-3.5 px-[18px] mb-5 rounded-lg border border-border bg-base">
          <div className="mb-2 text-[10.5px] font-bold tracking-[0.8px] uppercase text-muted">Resumo</div>
          {[['Aluno',ficha.nomeAluno],['Plano',sel.nome],['Mensalidade',`€${sel.valor}/mês`],['Pagamento',metodo==='stripe'?'Stripe — débito automático':'Numerário — pendente aprovação']].map(([k,v])=>(
            <div key={k} className="flex justify-between py-1.5 border-b border-border-subtle">
              <span className="text-[12.5px] text-muted">{k}</span>
              <span className="text-[12.5px] font-semibold text-primary">{v}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button className={BTN2_CLASS} onClick={onBack}>← Voltar</button>
        <button
          className={[
            'py-3.5 px-8 min-h-11 sm:min-h-0 font-display text-[15px] font-extrabold text-white rounded-[10px] border-none transition-all duration-200',
            'outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            planoId ? 'cursor-pointer opacity-100 hover:brightness-90 active:scale-[0.98]' : 'cursor-not-allowed opacity-40',
          ].join(' ')}
          style={{
            background: metodo==='numerario' ? '#D97706' : '#C8102E',
            boxShadow: metodo==='numerario' ? '0 4px 14px rgba(217,119,6,0.3)' : '0 4px 14px rgba(200,16,46,0.3)',
            ['--tw-ring-color' as string]: metodo==='numerario' ? '#D97706' : '#C8102E',
          }}
          onClick={()=>{ if(planoId) onNext(planoId,metodo); }}>
          {metodo==='stripe'
            ?<span className="inline-flex gap-1.5 items-center"><Ico icon={CreditCardIcon} sm />Concluir com Stripe</span>
            :<span className="inline-flex gap-1.5 items-center"><Ico icon={ClipboardDocumentIcon} sm />Submeter — aguardar aprovação</span>}
        </button>
      </div>
    </div>
  );
}

type AccountStatus = 'idle' | 'creating' | 'ok' | 'confirm_email' | 'error';

function Pendente({ ficha, contrato, plano, registerMode, onVoltar }: {
  ficha: FichaData; contrato: ContratoData | null; plano: Plano|undefined;
  registerMode?: boolean; onVoltar?: () => void;
}) {
  const { user } = useAuth();
  const [acctStatus, setAcctStatus] = useState<AccountStatus>('creating');
  const [acctErr, setAcctErr] = useState('');
  const [contratoErr, setContratoErr] = useState('');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    const run = async () => {
      const { supabase, isConfigured } = await import('../../lib/supabaseClient');

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
    <div className={[CARD_CLASS, 'py-8 px-7 text-center'].join(' ')}>
      <FontAwesomeIcon icon={faHourglassHalf} className="mb-4 w-12 h-12 text-amber-600" />
      <h2 className="mb-2.5 font-display text-xl font-extrabold text-amber-600 uppercase">Inscrição Pendente de Aprovação</h2>
      <p className="mx-auto mb-[22px] max-w-[480px] text-[13.5px] leading-[1.7] text-secondary">
        A tua inscrição foi registada com <strong>pagamento em numerário</strong>. Um administrador irá rever e aprovar o pedido. Receberás um contacto em <strong>{ficha.email}</strong> quando a conta estiver ativa.
      </p>

      {/* Account status feedback (registerMode only) */}
      {registerMode && acctStatus === 'creating' && (
        <div className="flex gap-2.5 justify-center items-center mb-[18px] text-[13px] text-muted">
          <div className="w-[18px] h-[18px] rounded-full border-2 border-border border-t-amber-600 animate-[spin_0.8s_linear_infinite]"/>
          A criar a tua conta...
        </div>
      )}
      {registerMode && acctStatus === 'confirm_email' && (
        <div className="p-3 px-4 mx-auto mb-[18px] max-w-[440px] text-[13px] leading-[1.6] text-amber-800 rounded-xl border border-amber-300 bg-amber-50">
          <span className="inline-flex gap-1.5 items-center"><Ico icon={InboxIcon} sm /><strong>Verifica o teu email</strong> — enviámos um link de confirmação para <strong>{ficha.email}</strong> para ativares a conta.</span>
        </div>
      )}
      {registerMode && acctStatus === 'error' && (
        <div className="p-3 px-4 mx-auto mb-[18px] max-w-[440px] text-[13px] rounded-xl border border-gb-red/20 text-gb-red bg-gb-red/5">
          <span className="inline-flex gap-1.5 items-center"><Ico icon={ExclamationTriangleIcon} sm />{acctErr}</span>
        </div>
      )}

      <div className="p-4 px-5 mx-auto mb-5 max-w-[400px] text-left rounded-xl border border-amber-300 bg-amber-50">
        <div className="mb-2 text-[11px] font-bold tracking-[0.8px] text-amber-800 uppercase">Detalhes da inscrição</div>
        {[['Aluno',ficha.nomeAluno],['Plano',plano?.nome||'—'],['Mensalidade',plano?`€${plano.valor}/mês`:'—'],['Pagamento','Numerário — aguarda aprovação'],['Email',ficha.email]].map(([k,v])=>(
          <div key={k} className="flex justify-between py-1.5 border-b border-amber-100">
            <span className="text-[12.5px] text-amber-900">{k}</span>
            <span className="text-[12.5px] font-semibold text-amber-950">{v}</span>
          </div>
        ))}
      </div>

      <div className="mb-[22px] text-[12.5px] text-muted">
        <a href="https://wa.me/351927773854" className="inline-flex gap-1.5 items-center font-bold text-[#25D366] transition-colors duration-200 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 rounded-sm"><Ico icon={ChatBubbleLeftRightIcon} sm />+351 927 773 854</a>
        {' · '}
        <a href="mailto:atendimento@gbbraga.com" className="inline-flex items-center text-gb-red transition-colors duration-200 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 rounded-sm">atendimento@gbbraga.com</a>
      </div>

      {contratoErr && (
        <div className="p-3 px-4 mx-auto mb-4 max-w-[440px] text-left rounded-xl border border-gb-red/25 bg-gb-red/5">
          <div className="inline-flex gap-1.5 items-center mb-1 text-xs font-bold text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />Erro ao guardar contrato</div>
          <div className="text-xs text-gb-red">{contratoErr}</div>
        </div>
      )}

      {/* Back to login button — always shown in registerMode */}
      {registerMode && onVoltar && (
        <button onClick={onVoltar}
          className="py-3 px-7 min-h-11 sm:min-h-0 font-inherit text-sm font-semibold rounded-[10px] border cursor-pointer border-border bg-elevated text-secondary transition-colors duration-200 hover:bg-card active:bg-card outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
          ← Voltar ao Login
        </button>
      )}
    </div>
  );
}

function Completo({ ficha, contrato, plano, isStaff, registerMode, onConcludo }: {
  ficha: FichaData; contrato: ContratoData | null; plano: Plano|undefined;
  isStaff?: boolean; registerMode?: boolean; onConcludo?: () => void;
}) {
  const { user } = useAuth();
  const [acctStatus, setAcctStatus] = useState<AccountStatus>('creating');
  const [acctErr, setAcctErr] = useState('');
  const [contratoErr, setContratoErr] = useState('');
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    const run = async () => {
      const { supabase, isConfigured } = await import('../../lib/supabaseClient');

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

      /* 2 ── Insert into alunos table */
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

      /* 4 ── Create first monthly payment record */
      if (alunoId && plano) {
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
      <div className={[CARD_CLASS, 'py-10 px-7 text-center'].join(' ')}>
        <div className="mx-auto mb-5 w-12 h-12 rounded-full border-4 border-elevated border-t-gb-red animate-[spin_0.8s_linear_infinite]"/>
        <p className="text-sm text-secondary">A criar a tua conta...</p>
      </div>
    );
  }

  if (acctStatus === 'confirm_email') {
    return (
      <div className={[CARD_CLASS, 'py-8 px-7 text-center'].join(' ')}>
        <FontAwesomeIcon icon={InboxIcon} className="mb-4 w-[52px] h-[52px] text-gb-red" />
        <h2 className="mb-2.5 font-display text-xl font-extrabold text-primary uppercase">Confirma o teu email</h2>
        <p className="mx-auto mb-4 max-w-[460px] text-[13.5px] leading-[1.7] text-secondary">
          Enviámos um email de confirmação para <strong>{ficha.email}</strong>.<br/>
          Clica no link para activar a conta e depois volta aqui para entrar.
        </p>
        <div className="mt-3 text-[12.5px] text-muted">
          <a href="https://wa.me/351927773854" className="inline-flex gap-1.5 items-center font-bold text-[#25D366] transition-colors duration-200 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 rounded-sm"><Ico icon={ChatBubbleLeftRightIcon} sm />Suporte WhatsApp</a>
        </div>
      </div>
    );
  }

  if (acctStatus === 'error') {
    return (
      <div className={[CARD_CLASS, 'py-8 px-7 text-center'].join(' ')}>
        <FontAwesomeIcon icon={ExclamationTriangleIcon} className="mb-4 w-12 h-12 text-gb-red" />
        <h2 className="mb-2.5 font-display text-lg font-extrabold text-gb-red">Erro ao criar conta</h2>
        <p className="text-[13.5px] leading-[1.7] text-secondary">{acctErr}</p>
        <a href="mailto:atendimento@gbbraga.com" className="inline-block mt-3.5 text-[13px] text-gb-red transition-colors duration-200 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 rounded-sm">atendimento@gbbraga.com</a>
      </div>
    );
  }

  return (
    <div className={[CARD_CLASS, 'py-8 px-7 text-center'].join(' ')}>
      <div className="flex justify-center items-center mx-auto mb-4 w-[68px] h-[68px] rounded-full border-[3px] border-green-600/30 bg-green-600/10"><FontAwesomeIcon icon={CheckIcon} className="w-7 h-7 text-green-600" /></div>
      <h2 className="mb-2.5 font-display text-xl font-extrabold text-green-600 uppercase"><span className="inline-flex gap-2 justify-center items-center">Bem-vindo à família GB! <Ico icon={MartialArtsIcon} /></span></h2>
      <p className="mx-auto mb-[22px] max-w-[480px] text-[13.5px] leading-[1.7] text-secondary">
        {isStaff
          ? <><span className="inline-flex gap-1.5 items-center">Ficha e contrato concluídos, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>! O perfil está activo. OSS! <Ico icon={MartialArtsIcon} sm /></span></>
          : registerMode
          ? <><span className="inline-flex gap-1.5 items-center">Matrícula concluída, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>! A tua conta foi criada. Já podes entrar no portal do aluno. OSS! <Ico icon={MartialArtsIcon} sm /></span></>
          : <>Inscrição concluída, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>! O débito automático Stripe está ativo. OSS!</>
        }
      </p>
      <div className="p-4 px-5 mx-auto mb-5 max-w-[400px] text-left rounded-xl border border-green-600/20 bg-green-600/5">
        {[['Aluno',ficha.nomeAluno],['Email',ficha.email],['Plano',plano?.nome||'—'],['Mensalidade',plano?`€${plano.valor}/mês`:'—']].map(([k,v])=>(
          <div key={k} className="flex justify-between py-1.5 border-b border-green-600/10">
            <span className="text-[12.5px] text-green-600">{k}</span>
            <span className="text-[12.5px] font-semibold text-primary">{v}</span>
          </div>
        ))}
      </div>
      {registerMode && acctStatus === 'ok' && (
        <p className="mt-2 text-xs text-muted">
          Já podes fechar esta página e{' '}
          <a href="/" className="font-bold text-gb-red transition-colors duration-200 hover:underline outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2 rounded-sm">entrar com o teu email e password</a>.
        </p>
      )}
      {contratoErr && (
        <div className="p-3 px-4 mx-auto mt-4 max-w-[480px] text-left rounded-xl border border-gb-red/25 bg-gb-red/5">
          <div className="inline-flex gap-1.5 items-center mb-1 text-xs font-bold text-gb-red"><Ico icon={ExclamationTriangleIcon} sm />Erro ao guardar contrato</div>
          <div className="text-xs text-gb-red">{contratoErr}</div>
          <div className="mt-1.5 text-[11px] text-muted">O aluno foi criado mas o contrato não foi guardado. Contacte o administrador.</div>
        </div>
      )}
    </div>
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
  const [step, setStep]       = useState<Step>('ficha');
  const [ficha, setFicha]     = useState<FichaData | null>(null);
  const [contrato, setContrato] = useState<ContratoData | null>(null);
  const [planoId, setPlanoId] = useState('');
  const [, setMetodo]         = useState<'stripe'|'numerario'>('stripe');
  const plano = planos.find(p=>p.id===planoId);

  const isStaff = !registerMode && (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'professor' || user?.role === 'atendimento');

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
            ? <span className="inline-flex gap-2 items-center"><Ico icon={ClipboardDocumentIcon} /> Nova Matrícula de Aluno</span>
            : registerMode ? 'Matrícula' : 'Nova Matrícula'}
        </h1>
        {registerMode && onVoltar && step === 'ficha' && (
          <button onClick={onVoltar} className="py-1.5 px-3.5 min-h-11 sm:min-h-0 font-inherit text-[13px] bg-none rounded-lg border cursor-pointer border-border text-muted transition-colors duration-200 hover:bg-elevated hover:text-primary active:bg-elevated outline-none focus-visible:ring-2 focus-visible:ring-gb-red focus-visible:ring-offset-2">
            ← Voltar ao login
          </button>
        )}
      </div>
      <StepBar step={step} isStaff={isStaff}/>
      {step==='ficha'     && <FichaInscricao registerMode={registerMode} isStaff={isStaff} planos={planos} onNext={d=>{ setFicha(d); if(d.planoId) setPlanoId(d.planoId); setStep('contrato'); }}/>}
      {step==='contrato'  && ficha && <ContratoAssinatura ficha={ficha} onBack={()=>setStep('ficha')} onNext={c=>{ setContrato(c); setStep(isStaff ? 'completo' : 'pagamento'); }}/>}
      {step==='pagamento' && ficha && <EscolhaPagamento ficha={ficha} onBack={()=>setStep('contrato')} onNext={(pid,met)=>{ setPlanoId(pid); setMetodo(met); setStep(met==='numerario'?'pendente':'completo'); }}/>}
      {step==='pendente'  && ficha && <Pendente ficha={ficha} contrato={contrato} plano={plano} registerMode={registerMode} onVoltar={onVoltar}/>}
      {step==='completo'  && ficha && <Completo ficha={ficha} contrato={contrato} plano={plano} isStaff={isStaff} registerMode={registerMode} onConcludo={onConcludo}/>}
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
      <header className="flex sticky top-0 z-[100] justify-between items-center py-0 px-6 h-16 border-b shadow-[0_1px_4px_rgba(0,0,0,0.06)] border-border bg-white">
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
