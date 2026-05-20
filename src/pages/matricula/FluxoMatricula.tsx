/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import { usePlanos, db } from '../../lib/useData';
import { useAuth } from '../../lib/auth';
import { GBLogoFull } from '../../components/GBLogo';
import type { Plano } from '../../types';

type Step = 'ficha' | 'contrato' | 'pagamento' | 'pendente' | 'completo';

interface FichaData {
  nomeAluno: string; dataNasc: string; nif: string; morada: string;
  codPostal: string; telefone: string; email: string; faixa: string;
  necessidades: string; temEE: boolean;
  nomeEE: string; nifEE: string; telEE: string; emailEE: string;
  encPagamento: 'aluno' | 'ee' | 'outro';
  nomePag: string; nifPag: string; telPag: string; emailPag: string;
  /* account creation — only used in registerMode */
  senha: string; confirmarSenha: string;
}

interface ContratoData {
  aceitaImagem: boolean; aceitaRGPD: boolean; aceitaContrato: boolean;
  assinatura: string;
}

const FAIXAS = ['Branca','Cinza e Branca','Cinza','Cinza e Preta','Amarela e Branca','Amarela','Amarela e Preta','Laranja e Branca','Laranja','Laranja e Preta','Verde e Branca','Verde','Verde e Preta','Azul','Roxa','Marrom','Preta'];
const CATEGORIAS = [{id:'adulto',label:'Adulto',icon:'🥋'},{id:'kids',label:'Kids',icon:'⭐'},{id:'familia',label:'Família',icon:'👨‍👩‍👧'},{id:'fundador',label:'Sócio Fundador',icon:'🏆'}];

const INP: React.CSSProperties = { width:'100%', border:'1.5px solid #E2E0DB', borderRadius:8, padding:'10px 13px', fontSize:14, fontFamily:'inherit', outline:'none', background:'#fff', color:'#111', boxSizing:'border-box', transition:'border-color 0.15s' };
const BTN: React.CSSProperties = { background:'#C8102E', border:'none', borderRadius:10, padding:'13px 32px', color:'#fff', fontSize:15, fontWeight:800, fontFamily:"'Arial Black',sans-serif", cursor:'pointer', boxShadow:'0 4px 14px rgba(200,16,46,0.3)' };
const BTN2: React.CSSProperties = { background:'#F0EFEC', border:'1px solid #E2E0DB', borderRadius:10, padding:'13px 24px', color:'#5C5B66', fontSize:14, cursor:'pointer', fontFamily:'inherit' };
const CARD: React.CSSProperties = { background:'#fff', border:'1px solid #E2E0DB', borderRadius:16, padding:28, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:20 };
const LBL: React.CSSProperties = { display:'block', color:'#5C5B66', fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:5 };
const SEC: React.CSSProperties = { color:'#111', fontSize:15, fontWeight:700, marginBottom:14, paddingBottom:8, borderBottom:'2px solid #E2E0DB' };

function StepBar({ step, isStaff = false }: { step: Step; isStaff?: boolean }) {
  const steps = isStaff
    ? [{id:'ficha',label:'Ficha'},{id:'contrato',label:'Contrato'},{id:'completo',label:'Ativo'}]
    : [{id:'ficha',label:'Ficha'},{id:'contrato',label:'Contrato'},{id:'pagamento',label:'Pagamento'},{id:'completo',label:'Ativo'}];
  const idx = steps.findIndex(s => s.id === step || (step==='pendente' && s.id==='completo'));
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
      {steps.map((s,i) => (
        <div key={s.id} style={{ display:'flex', alignItems:'center', flex: i<steps.length-1?1:'none' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background: i<=idx?'#C8102E':'#E2E0DB', display:'flex', alignItems:'center', justifyContent:'center', color: i<=idx?'#fff':'#9896A4', fontSize:12, fontWeight:700 }}>
              {i<idx?'✓':i+1}
            </div>
            <span style={{ color: i===idx?'#111':i<idx?'#C8102E':'#9896A4', fontSize:10.5, fontWeight: i===idx?700:400, whiteSpace:'nowrap' }}>{s.label}</span>
          </div>
          {i<steps.length-1 && <div style={{ flex:1, height:2, background: i<idx?'#C8102E':'#E2E0DB', margin:'0 6px', marginBottom:16 }}/>}
        </div>
      ))}
    </div>
  );
}

function FichaInscricao({ onNext, registerMode = false }: { onNext:(d:FichaData)=>void; registerMode?: boolean }) {
  const blank: FichaData = {
    nomeAluno:'', dataNasc:'', nif:'', morada:'', codPostal:'', telefone:'', email:'',
    faixa:'', necessidades:'', temEE:false, nomeEE:'', nifEE:'', telEE:'', emailEE:'',
    encPagamento:'aluno', nomePag:'', nifPag:'', telPag:'', emailPag:'',
    senha:'', confirmarSenha:'',
  };
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
    <div style={{ marginBottom:12 }}>
      <label style={LBL}>{label}{required ? ' *' : ''}</label>
      <input type={type} value={d[k] as string} onChange={set(k)} placeholder={ph}
        style={{ ...INP, borderColor: err[k]?'#C8102E':'#E2E0DB' }}
        onFocus={e=>(e.target.style.borderColor='#C8102E')}
        onBlur={e=>(e.target.style.borderColor=err[k]?'#C8102E':'#E2E0DB')}/>
      {err[k] && <div style={{ color:'#C8102E', fontSize:11, marginTop:3 }}>{err[k]}</div>}
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
    <div style={CARD}>
      <div style={{ background:'linear-gradient(135deg,#0D0508,#2A0510)', borderRadius:12, padding:'18px 22px', marginBottom:22, display:'flex', alignItems:'center', gap:14 }}>
        <GBLogoFull size={50}/>
        <div>
          <div style={{ color:'#fff', fontSize:16, fontWeight:800, fontFamily:"'Arial Black',sans-serif", textTransform:'uppercase' }}>Ficha de Inscrição</div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:2 }}>Gracie Barra Braga · Rua Nova Santa Cruz 11, Braga</div>
        </div>
      </div>
      <p style={{ color:'#5C5B66', fontSize:13, lineHeight:1.7, marginBottom:22, padding:'12px 16px', background:'rgba(200,16,46,0.04)', border:'1px solid rgba(200,16,46,0.12)', borderRadius:8 }}>
        Por favor preencha a ficha de matrícula para formalizar a sua adesão e ativar o seu seguro de aluno.{' '}
        <strong style={{ color:'#C8102E' }}>Atenção:</strong> As fichas têm que ser preenchidas uma por aluno.
      </p>

      <div style={SEC}>🥋 Identificação do Aluno</div>
      <p style={{ color:'#9896A4', fontSize:11, marginBottom:14 }}>Todos os campos marcados com * são obrigatórios</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {field('nomeAluno','Nome do Aluno')}
        {field('dataNasc','Data de Nascimento','date')}
        {field('nif','NIF','text','000000000')}
        {field('telefone','Telefone','tel','+351 9XX XXX XXX')}
      </div>
      {field('email','Email','email','email@exemplo.com')}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:14 }}>
        {field('morada','Morada')}
        {field('codPostal','Código Postal','text','4710-409')}
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={LBL}>Faixa (se aplicável)</label>
        <select value={d.faixa} onChange={set('faixa')} style={{ ...INP, cursor:'pointer' }}>
          <option value="">Escolha a sua faixa</option>
          {FAIXAS.map(fx=><option key={fx} value={fx}>{fx}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:22 }}>
        <label style={LBL}>Necessidades especiais (opcional)</label>
        <textarea value={d.necessidades} onChange={set('necessidades')} rows={2}
          placeholder="Alergias, condições médicas, limitações físicas..."
          style={{ ...INP, resize:'none' }}/>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:8, borderBottom:'2px solid #E2E0DB' }}>
        <span style={{ color:'#111', fontSize:15, fontWeight:700 }}>👤 Encarregado de Educação</span>
        {isMinor && (
          <span style={{ background:'#C8102E', color:'#fff', fontSize:10, fontWeight:800, letterSpacing:'0.6px', textTransform:'uppercase', borderRadius:6, padding:'3px 9px' }}>
            Obrigatório
          </span>
        )}
      </div>

      {isMinor ? (
        /* Minor: locked notice — cannot uncheck */
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'10px 14px', background:'rgba(200,16,46,0.06)', border:'1.5px solid rgba(200,16,46,0.25)', borderRadius:8 }}>
          <span style={{ fontSize:16 }}>⚠️</span>
          <span style={{ color:'#C8102E', fontSize:13, fontWeight:600 }}>
            O aluno tem menos de 18 anos — dados do Encarregado de Educação são obrigatórios.
          </span>
        </div>
      ) : (
        /* Adult: optional toggle */
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'10px 14px', background:'#F7F6F4', borderRadius:8, cursor:'pointer' }}
          onClick={()=>setD(p=>({...p, temEE:!p.temEE}))}>
          <input type="checkbox" checked={d.temEE} onChange={()=>{}} style={{ width:16, height:16, accentColor:'#C8102E', cursor:'pointer' }}/>
          <span style={{ color:'#333', fontSize:13 }}>Aplicável (menor de 18 anos ou dependente)</span>
        </div>
      )}

      {(d.temEE || isMinor) && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {field('nomeEE','Nome')}
          {field('nifEE','NIF','text','000000000')}
          {field('telEE','Telefone','tel')}
          {field('emailEE','Email','email')}
        </div>
      )}

      <div style={SEC}>💳 Encarregado do Pagamento da Mensalidade</div>
      {(['aluno','ee','outro'] as const).map(val => {
        const labels = { aluno:'O aluno', ee:'O encarregado de educação', outro:'Nenhum dos mencionados (outro)' };
        return (
          <label key={val} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', marginBottom:8, background: d.encPagamento===val?'rgba(200,16,46,0.05)':'#F7F6F4', border:`1.5px solid ${d.encPagamento===val?'#C8102E':'#E2E0DB'}`, borderRadius:8, cursor:'pointer' }}>
            <input type="radio" name="ep" checked={d.encPagamento===val} onChange={()=>setD(p=>({...p,encPagamento:val}))} style={{ accentColor:'#C8102E' }}/>
            <span style={{ color:'#333', fontSize:13 }}>{labels[val]}</span>
          </label>
        );
      })}
      {d.encPagamento==='outro' && (
        <div style={{ marginTop:12, padding:'14px 16px', background:'#F7F6F4', borderRadius:10 }}>
          <p style={{ color:'#9896A4', fontSize:11, marginBottom:12 }}>Preencha os dados do responsável pelo pagamento:</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {field('nomePag','Nome')}
            {field('nifPag','NIF','text','000000000')}
            {field('telPag','Telefone','tel')}
            {field('emailPag','Email','email')}
          </div>
        </div>
      )}

      {/* ── Password section (only in registerMode) ── */}
      {registerMode && (
        <>
          <div style={{ ...SEC, marginTop:8 }}>🔑 Criar Acesso à Plataforma</div>
          <p style={{ color:'#9896A4', fontSize:12, marginBottom:14, lineHeight:1.6 }}>
            Define a password que vais usar para entrar no portal do aluno.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {field('senha','Password','password','Mínimo 6 caracteres')}
            {field('confirmarSenha','Confirmar Password','password','Repete a password')}
          </div>
        </>
      )}

      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
        <button style={BTN} onClick={()=>{ if(validate()) onNext(d); }}>Seguinte → Contrato</button>
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
    <label style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', background:(c[key] as boolean)?'rgba(200,16,46,0.04)':'#F7F6F4', border:`1.5px solid ${(c[key] as boolean)?'#C8102E':'#E2E0DB'}`, borderRadius:10, cursor:'pointer', marginBottom:10 }}>
      <input type="checkbox" checked={c[key] as boolean} onChange={()=>setC(p=>({...p,[key]:!p[key as keyof ContratoData]}))}
        style={{ marginTop:2, accentColor:'#C8102E', width:16, height:16, flexShrink:0 }}/>
      <span style={{ color:'#333', fontSize:13, lineHeight:1.5 }}>{label}</span>
    </label>
  );

  return (
    <div style={CARD}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <GBLogoFull size={46}/>
        <div>
          <div style={{ color:'#111', fontSize:15, fontWeight:800, fontFamily:"'Arial Black',sans-serif", textTransform:'uppercase' }}>Contrato de Adesão</div>
          <div style={{ color:'#9896A4', fontSize:11.5 }}>Gracie Barra Braga · {hoje}</div>
        </div>
      </div>

      <div style={{ background:'#F7F6F4', border:'1px solid #E2E0DB', borderRadius:12, padding:'20px 22px', marginBottom:22, fontSize:13.5, color:'#333', lineHeight:1.8 }}>
        <p style={{ marginBottom:12 }}>
          O presente contrato é celebrado entre <strong>Tribo Laurada Lda.</strong> (NIF 518948471), proprietária da escola de Jiu-Jitsu <strong>Gracie Barra Braga</strong>, com sede na Rua Nova de Santa Cruz, 11 – 4710-409 Braga, e o(a) aluno(a){' '}
          <strong>{ficha.nomeAluno||'_______________'}</strong>, NIF <strong>{ficha.nif||'_________'}</strong>,{' '}
          residente em <strong>{ficha.morada||'_______________'}{ficha.codPostal?`, ${ficha.codPostal}`:''}</strong>.
        </p>
        <p style={{ fontWeight:700, marginBottom:8 }}>O aluno compromete-se a:</p>
        <ul style={{ marginLeft:18, marginBottom:12 }}>
          {['Efetuar o pagamento da mensalidade até ao dia 5 de cada mês;','Utilizar o uniforme oficial da Gracie Barra durante os treinos e eventos;','Cumprir o regulamento interno da escola;','Autorizar a utilização da sua imagem em fotografias e vídeos para fins institucionais;','Declarar estar fisicamente apto para a prática do Jiu-Jitsu.'].map((item,i)=>(
            <li key={i} style={{ marginBottom:6 }}>{item}</li>
          ))}
        </ul>
        <p style={{ color:'#5C5B66', fontSize:12.5, borderTop:'1px solid #E2E0DB', paddingTop:10 }}>
          O contrato entra em vigor na data da assinatura e mantém-se válido enquanto o aluno frequentar a escola.
        </p>
      </div>

      <div style={{ marginBottom:20 }}>
        {chk('aceitaImagem','Autorizo a utilização da minha imagem para fins institucionais e promocionais da Gracie Barra Braga.')}
        {chk('aceitaRGPD','Aceito o tratamento dos meus dados pessoais conforme o RGPD e a Política de Privacidade da escola.')}
        {chk('aceitaContrato','O contrato de adesão foi lido e estou de acordo.')}
      </div>

      <div style={SEC}>✍️ Assine aqui com o mouse ou dedo</div>
      <div style={{ border:'1.5px solid #E2E0DB', borderRadius:10, background:'#FAFAF9', overflow:'hidden', position:'relative' }}>
        <canvas ref={canvasRef} width={640} height={160} style={{ display:'block', width:'100%', cursor:'crosshair', touchAction:'none' }}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
        {!hasSig && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <span style={{ color:'#C0BFCA', fontSize:14 }}>Assine aqui...</span>
          </div>
        )}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6, marginBottom:20 }}>
        <button onClick={clear} style={{ background:'none', border:'1px solid #E2E0DB', borderRadius:6, padding:'5px 14px', color:'#9896A4', fontSize:12, cursor:'pointer' }}>
          Limpar
        </button>
      </div>

      {errors.length>0 && (
        <div style={{ background:'rgba(200,16,46,0.05)', border:'1px solid rgba(200,16,46,0.2)', borderRadius:8, padding:'12px 16px', marginBottom:16 }}>
          <div style={{ color:'#C8102E', fontSize:12, fontWeight:700, marginBottom:6 }}>Complete os seguintes campos:</div>
          {errors.map((e,i)=><div key={i} style={{ color:'#C8102E', fontSize:12 }}>• {e}</div>)}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button style={BTN2} onClick={onBack}>← Voltar</button>
        <button style={BTN} onClick={()=>{ if(validate()) onNext(c); }}>Seguinte → Pagamento</button>
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
    <div style={CARD}>
      <div style={SEC}>📋 Escolha o Plano</div>
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        {CATEGORIAS.map(c=>(
          <button key={c.id} onClick={()=>{ setCat(c.id); setPlanoId(''); }}
            style={{ display:'flex', alignItems:'center', gap:6, background: cat===c.id?'rgba(200,16,46,0.08)':'#F7F6F4', border:`1.5px solid ${cat===c.id?'#C8102E':'#E2E0DB'}`, borderRadius:8, padding:'7px 14px', cursor:'pointer', color: cat===c.id?'#C8102E':'#5C5B66', fontWeight: cat===c.id?700:400, fontSize:13, fontFamily:'inherit' }}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:22 }}>
        {planos.map(p=>(
          <button key={p.id} onClick={()=>setPlanoId(p.id)}
            style={{ background: planoId===p.id?'rgba(200,16,46,0.04)':'#fff', border:`2px solid ${planoId===p.id?'#C8102E':'#E2E0DB'}`, borderRadius:12, padding:'13px 18px', textAlign:'left', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.15s' }}>
            <div>
              <div style={{ color:'#111', fontSize:14, fontWeight:700, marginBottom:2 }}>{p.nome}</div>
              <div style={{ color:'#9896A4', fontSize:12 }}>{p.descricao} · IVA 23% incluído</div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0, marginLeft:16 }}>
              <div style={{ color: planoId===p.id?'#C8102E':'#111', fontSize:22, fontWeight:900, fontFamily:"'Arial Black',sans-serif" }}>€{p.valor}</div>
              <div style={{ color:'#9896A4', fontSize:11 }}>/mês</div>
            </div>
          </button>
        ))}
      </div>

      <div style={SEC}>💳 Forma de Pagamento</div>
      <label style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', background: metodo==='stripe'?'rgba(200,16,46,0.04)':'#F7F6F4', border:`2px solid ${metodo==='stripe'?'#C8102E':'#E2E0DB'}`, borderRadius:12, cursor:'pointer', marginBottom:10 }}>
        <input type="radio" name="met" checked={metodo==='stripe'} onChange={()=>setMetodo('stripe')} style={{ marginTop:3, accentColor:'#C8102E' }}/>
        <div>
          <div style={{ color:'#111', fontSize:14, fontWeight:700, marginBottom:3 }}>💳 Débito Automático — Stripe</div>
          <div style={{ color:'#9896A4', fontSize:12.5, lineHeight:1.5 }}>Cartão de débito ou crédito. Cobrança automática no dia 5 de cada mês. Cancelamento a qualquer momento. 100% seguro.</div>
        </div>
      </label>
      <label style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', background: metodo==='numerario'?'rgba(217,119,6,0.05)':'#F7F6F4', border:`2px solid ${metodo==='numerario'?'#D97706':'#E2E0DB'}`, borderRadius:12, cursor:'pointer', marginBottom:20 }}>
        <input type="radio" name="met" checked={metodo==='numerario'} onChange={()=>setMetodo('numerario')} style={{ marginTop:3, accentColor:'#D97706' }}/>
        <div>
          <div style={{ color:'#111', fontSize:14, fontWeight:700, marginBottom:3 }}>💵 Numerário (dinheiro)</div>
          <div style={{ color:'#9896A4', fontSize:12.5, lineHeight:1.5 }}>
            Pagamento em dinheiro na receção até ao dia 5 de cada mês.
            <span style={{ color:'#D97706', fontWeight:700 }}> Requer aprovação do Super Administrador.</span>
          </div>
        </div>
      </label>

      {sel && (
        <div style={{ background:'#F7F6F4', border:'1px solid #E2E0DB', borderRadius:10, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ color:'#9896A4', fontSize:10.5, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }}>Resumo</div>
          {[['Aluno',ficha.nomeAluno],['Plano',sel.nome],['Mensalidade',`€${sel.valor}/mês`],['Pagamento',metodo==='stripe'?'Stripe — débito automático':'Numerário — pendente aprovação']].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #EDECE9' }}>
              <span style={{ color:'#9896A4', fontSize:12.5 }}>{k}</span>
              <span style={{ color:'#111', fontSize:12.5, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <button style={BTN2} onClick={onBack}>← Voltar</button>
        <button style={{ ...BTN, opacity:planoId?1:0.4, cursor:planoId?'pointer':'not-allowed', background: metodo==='numerario'?'#D97706':'#C8102E', boxShadow: metodo==='numerario'?'0 4px 14px rgba(217,119,6,0.3)':'0 4px 14px rgba(200,16,46,0.3)' }}
          onClick={()=>{ if(planoId) onNext(planoId,metodo); }}>
          {metodo==='stripe'?'💳 Concluir com Stripe':'📋 Submeter — aguardar aprovação'}
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
        } catch (e) { console.warn('criarContrato (pendente) error:', e); }
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
      if (authUserId && isConfigured) {
        const { error: profErr } = await supabase.from('profiles')
          .update({
            nome:               ficha.nomeAluno,
            telefone:           ficha.telefone,
            matricula_completa: false,
          })
          .eq('id', authUserId);
        if (profErr) console.error('Profile update error (pendente):', profErr.message, profErr.code);
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
    <div style={{ ...CARD, textAlign:'center', padding:'32px 28px' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⏳</div>
      <h2 style={{ color:'#D97706', fontSize:20, fontWeight:800, fontFamily:"'Arial Black',sans-serif", textTransform:'uppercase', marginBottom:10 }}>Inscrição Pendente de Aprovação</h2>
      <p style={{ color:'#5C5B66', fontSize:13.5, lineHeight:1.7, maxWidth:480, margin:'0 auto 22px' }}>
        A tua inscrição foi registada com <strong>pagamento em numerário</strong>. Um administrador irá rever e aprovar o pedido. Receberás um contacto em <strong>{ficha.email}</strong> quando a conta estiver ativa.
      </p>

      {/* Account status feedback (registerMode only) */}
      {registerMode && acctStatus === 'creating' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:18, color:'#9896A4', fontSize:13 }}>
          <div style={{ width:18, height:18, border:'2px solid #E2E0DB', borderTop:'2px solid #D97706', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
          A criar a tua conta...
          <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
        </div>
      )}
      {registerMode && acctStatus === 'confirm_email' && (
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:10, padding:'12px 16px', maxWidth:440, margin:'0 auto 18px', fontSize:13, color:'#92400E', lineHeight:1.6 }}>
          📬 <strong>Verifica o teu email</strong> — enviámos um link de confirmação para <strong>{ficha.email}</strong> para ativares a conta.
        </div>
      )}
      {registerMode && acctStatus === 'error' && (
        <div style={{ background:'rgba(200,16,46,0.05)', border:'1px solid rgba(200,16,46,0.2)', borderRadius:10, padding:'12px 16px', maxWidth:440, margin:'0 auto 18px', fontSize:13, color:'#C8102E' }}>
          ⚠️ {acctErr}
        </div>
      )}

      <div style={{ background:'#FFFBEB', border:'1px solid #FCD34D', borderRadius:12, padding:'16px 20px', maxWidth:400, margin:'0 auto 20px', textAlign:'left' }}>
        <div style={{ color:'#92400E', fontSize:11, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:8 }}>Detalhes da inscrição</div>
        {[['Aluno',ficha.nomeAluno],['Plano',plano?.nome||'—'],['Mensalidade',plano?`€${plano.valor}/mês`:'—'],['Pagamento','Numerário — aguarda aprovação'],['Email',ficha.email]].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #FEF3C7' }}>
            <span style={{ color:'#78350F', fontSize:12.5 }}>{k}</span>
            <span style={{ color:'#451A03', fontSize:12.5, fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ color:'#9896A4', fontSize:12.5, marginBottom:22 }}>
        <a href="https://wa.me/351927773854" style={{ color:'#25D366', fontWeight:700 }}>💬 +351 927 773 854</a>
        {' · '}
        <a href="mailto:atendimento@gbbraga.com" style={{ color:'#C8102E' }}>atendimento@gbbraga.com</a>
      </div>

      {/* Back to login button — always shown in registerMode */}
      {registerMode && onVoltar && (
        <button onClick={onVoltar}
          style={{ background:'#F0EFEC', border:'1px solid #E2E0DB', borderRadius:10, padding:'12px 28px', color:'#5C5B66', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
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
        } catch (e) { console.warn('criarContrato error:', e); }
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
      if (authUserId && isConfigured) {
        const { error: profErr } = await supabase.from('profiles')
          .update({
            nome:               ficha.nomeAluno,
            telefone:           ficha.telefone,
            matricula_completa: true,
          })
          .eq('id', authUserId);
        if (profErr) console.error('Profile update error:', profErr.message, profErr.code);
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
      <div style={{ ...CARD, textAlign:'center', padding:'40px 28px' }}>
        <div style={{ width:48, height:48, border:'4px solid #F0EFEC', borderTop:'4px solid #C8102E', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 20px' }}/>
        <p style={{ color:'#5C5B66', fontSize:14 }}>A criar a tua conta...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (acctStatus === 'confirm_email') {
    return (
      <div style={{ ...CARD, textAlign:'center', padding:'32px 28px' }}>
        <div style={{ fontSize:52, marginBottom:16 }}>📬</div>
        <h2 style={{ color:'#111', fontSize:20, fontWeight:800, fontFamily:"'Arial Black',sans-serif", textTransform:'uppercase', marginBottom:10 }}>Confirma o teu email</h2>
        <p style={{ color:'#5C5B66', fontSize:13.5, lineHeight:1.7, maxWidth:460, margin:'0 auto 16px' }}>
          Enviámos um email de confirmação para <strong>{ficha.email}</strong>.<br/>
          Clica no link para activar a conta e depois volta aqui para entrar.
        </p>
        <div style={{ color:'#9896A4', fontSize:12.5, marginTop:12 }}>
          <a href="https://wa.me/351927773854" style={{ color:'#25D366', fontWeight:700 }}>💬 Suporte WhatsApp</a>
        </div>
      </div>
    );
  }

  if (acctStatus === 'error') {
    return (
      <div style={{ ...CARD, textAlign:'center', padding:'32px 28px' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <h2 style={{ color:'#C8102E', fontSize:18, fontWeight:800, fontFamily:"'Arial Black',sans-serif", marginBottom:10 }}>Erro ao criar conta</h2>
        <p style={{ color:'#5C5B66', fontSize:13.5, lineHeight:1.7 }}>{acctErr}</p>
        <a href="mailto:atendimento@gbbraga.com" style={{ color:'#C8102E', fontSize:13, marginTop:14, display:'block' }}>atendimento@gbbraga.com</a>
      </div>
    );
  }

  return (
    <div style={{ ...CARD, textAlign:'center', padding:'32px 28px' }}>
      <div style={{ width:68, height:68, borderRadius:'50%', background:'rgba(22,163,74,0.1)', border:'3px solid rgba(22,163,74,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 16px' }}>✓</div>
      <h2 style={{ color:'#16A34A', fontSize:20, fontWeight:800, fontFamily:"'Arial Black',sans-serif", textTransform:'uppercase', marginBottom:10 }}>Bem-vindo à família GB! 🥋</h2>
      <p style={{ color:'#5C5B66', fontSize:13.5, lineHeight:1.7, maxWidth:480, margin:'0 auto 22px' }}>
        {isStaff
          ? <>Ficha e contrato concluídos, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>! O perfil está activo. OSS! 🥋</>
          : registerMode
          ? <>Matrícula concluída, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>! A tua conta foi criada. Já podes entrar no portal do aluno. OSS! 🥋</>
          : <>Inscrição concluída, <strong>{ficha.nomeAluno.split(' ')[0]}</strong>! O débito automático Stripe está ativo. OSS!</>
        }
      </p>
      <div style={{ background:'rgba(22,163,74,0.05)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:12, padding:'16px 20px', maxWidth:400, margin:'0 auto 20px', textAlign:'left' }}>
        {[['Aluno',ficha.nomeAluno],['Email',ficha.email],['Plano',plano?.nome||'—'],['Mensalidade',plano?`€${plano.valor}/mês`:'—']].map(([k,v])=>(
          <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(22,163,74,0.1)' }}>
            <span style={{ color:'#16A34A', fontSize:12.5 }}>{k}</span>
            <span style={{ color:'#111', fontSize:12.5, fontWeight:600 }}>{v}</span>
          </div>
        ))}
      </div>
      {registerMode && acctStatus === 'ok' && (
        <p style={{ color:'#9896A4', fontSize:12, marginTop:8 }}>
          Já podes fechar esta página e{' '}
          <a href="/" style={{ color:'#C8102E', fontWeight:700 }}>entrar com o teu email e password</a>.
        </p>
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

  const isStaff = !registerMode && (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'professor');

  useEffect(() => { if (!embedded) window.scrollTo(0,0); }, [step, embedded]);

  const content = (
    <>
      {!embedded && (
        <div style={{ color:'#C8102E', fontSize:10.5, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:4 }}>
          Gracie Barra Braga
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h1 style={{ color:'#111', fontSize: embedded ? 18 : 22, fontWeight:900, fontFamily:"'Arial Black',sans-serif", textTransform:'uppercase', margin:0 }}>
          {embedded ? '📋 Nova Matrícula de Aluno' : registerMode ? 'Matrícula' : 'Nova Matrícula'}
        </h1>
        {registerMode && onVoltar && step === 'ficha' && (
          <button onClick={onVoltar} style={{ background:'none', border:'1px solid #E2E0DB', borderRadius:8, padding:'7px 14px', color:'#9896A4', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
            ← Voltar ao login
          </button>
        )}
      </div>
      <StepBar step={step} isStaff={isStaff}/>
      {step==='ficha'     && <FichaInscricao registerMode={registerMode} onNext={d=>{ setFicha(d); setStep('contrato'); }}/>}
      {step==='contrato'  && ficha && <ContratoAssinatura ficha={ficha} onBack={()=>setStep('ficha')} onNext={c=>{ setContrato(c); setStep(isStaff ? 'completo' : 'pagamento'); }}/>}
      {step==='pagamento' && ficha && <EscolhaPagamento ficha={ficha} onBack={()=>setStep('contrato')} onNext={(pid,met)=>{ setPlanoId(pid); setMetodo(met); setStep(met==='numerario'?'pendente':'completo'); }}/>}
      {step==='pendente'  && ficha && <Pendente ficha={ficha} contrato={contrato} plano={plano} registerMode={registerMode} onVoltar={onVoltar}/>}
      {step==='completo'  && ficha && <Completo ficha={ficha} contrato={contrato} plano={plano} isStaff={isStaff} registerMode={registerMode} onConcludo={onConcludo}/>}
    </>
  );

  if (embedded) {
    return (
      <div style={{ maxWidth:720, margin:'0 auto', padding:'4px 0 32px', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F7F6F4', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <header style={{ background:'#fff', borderBottom:'1px solid #E2E0DB', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <GBLogoFull size={50}/>
        <div style={{ color:'#5C5B66', fontSize:12, textAlign:'right' }}>
          Rua Nova Santa Cruz 11, Braga<br/>+351 927 773 854
        </div>
      </header>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'32px 20px' }}>
        {content}
      </div>
    </div>
  );
}
