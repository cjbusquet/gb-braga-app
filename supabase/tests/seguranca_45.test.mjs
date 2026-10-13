import pg from 'pg';
const db = process.argv[2];
const c = new pg.Client({ host: '/tmp/pgtest', port: 55432, user: 'postgres', database: db });
await c.connect();
let ok = 0, falhas = 0;
const check = (nome, cond, info = '') => { if (cond) { ok++; console.log('  ✓', nome); } else { falhas++; console.log('  ✗', nome, info); } };
const q = async (sql, p) => (await c.query(sql, p)).rows;
const tenta = async (sql, p) => { try { await c.query('SAVEPOINT s'); const r = await c.query(sql, p); await c.query('RELEASE s'); return { rows: r.rows, n: r.rowCount }; } catch (e) { await c.query('ROLLBACK TO s'); return { erro: e.message, code: e.code }; } };
async function como(quem) {
  await c.query('RESET ROLE');
  const sub = quem?.id ?? '', papel = quem === 'anon' ? 'anon' : quem === 'service' ? 'service_role' : quem ? 'authenticated' : '';
  await c.query(`SELECT set_config('request.jwt.claim.sub',$1,false), set_config('request.jwt.claims',$2,false), set_config('request.jwt.claim.role',$3,false), set_config('request.headers',$4,false)`,
    [typeof quem === 'object' && quem ? quem.id : '', typeof quem === 'object' && quem ? JSON.stringify({ sub: quem.id, email: quem.email, role: 'authenticated' }) : '', papel, JSON.stringify({ 'x-forwarded-for': '9.9.9.9' })]);
  if (papel) await c.query(`SET ROLE ${papel}`);
}
await c.query('BEGIN');
const user = async (email, meta = {}, app = {}) => (await q(`INSERT INTO auth.users(email, raw_user_meta_data, raw_app_meta_data) VALUES ($1,$2,$3) RETURNING id`, [email, meta, app]))[0].id;

console.log('— Papéis (profiles.role)');
const uAluno = await user('aluno@x.pt', { nome: 'Ana Maria Costa', role: 'superadmin' });
const aluno = { id: uAluno, email: 'aluno@x.pt' };
check('signUp com role=superadmin nos metadados → aluno', (await q(`SELECT role FROM profiles WHERE id=$1`, [uAluno]))[0].role === 'aluno');
const uProf = await user('prof@x.pt', { nome: 'Professor' }, { role: 'professor' });
check('app_metadata role (service role) é respeitado', (await q(`SELECT role FROM profiles WHERE id=$1`, [uProf]))[0].role === 'professor');
const prof = { id: uProf, email: 'prof@x.pt' };
const uAdmin = await user('admin@x.pt'); await q(`UPDATE profiles SET role='admin' WHERE id=$1`, [uAdmin]);
const admin = { id: uAdmin, email: 'admin@x.pt' };
const uSuper = await user('super@x.pt'); await q(`UPDATE profiles SET role='superadmin' WHERE id=$1`, [uSuper]);
const sup = { id: uSuper, email: 'super@x.pt' };
const uAtend = await user('atend@x.pt'); await q(`UPDATE profiles SET role='atendimento' WHERE id=$1`, [uAtend]);
const atend = { id: uAtend, email: 'atend@x.pt' };

await como(aluno);
await tenta(`UPDATE profiles SET role='superadmin', email='outro@x.pt', ativo=true, nome='Ana M. Costa' WHERE id=$1`, [uAluno]);
await como(null);
let r = (await q(`SELECT role, email, nome FROM profiles WHERE id=$1`, [uAluno]))[0];
check('aluno não muda o próprio role', r.role === 'aluno', r.role);
check('aluno não muda o próprio email', r.email === 'aluno@x.pt', r.email);
check('aluno continua a poder mudar o nome', r.nome === 'Ana M. Costa', r.nome);
await como(aluno);
await tenta(`UPDATE profiles SET matricula_completa=true WHERE id=$1`, [uAluno]);
await como(null);
check('aluno continua a poder marcar matrícula completa (fluxo existente)', (await q(`SELECT matricula_completa FROM profiles WHERE id=$1`, [uAluno]))[0].matricula_completa === true);

const uOrf = await user('orfao@x.pt'); await q(`DELETE FROM profiles WHERE id=$1`, [uOrf]);
await como({ id: uOrf, email: 'orfao@x.pt' });
let t = await tenta(`INSERT INTO profiles(id,nome,email,role) VALUES ($1,'O','orfao@x.pt','admin')`, [uOrf]);
await como(null);
check('auto-criação de perfil com role=admin → aluno', (await q(`SELECT role FROM profiles WHERE id=$1`, [uOrf]))[0]?.role === 'aluno', JSON.stringify(t));

await como(admin);
t = await tenta(`UPDATE profiles SET role='professor' WHERE id=$1`, [uAtend]);
await como(null);
check('admin muda papel de staff (atendimento→professor)', (await q(`SELECT role FROM profiles WHERE id=$1`, [uAtend]))[0].role === 'professor', JSON.stringify(t));
await q(`UPDATE profiles SET role='atendimento' WHERE id=$1`, [uAtend]);
await como(admin);
t = await tenta(`UPDATE profiles SET role='superadmin' WHERE id=$1`, [uAdmin]);
check('admin não se promove a superadmin', !!t.erro, JSON.stringify(t));
await como(sup);
t = await tenta(`UPDATE profiles SET role='admin' WHERE id=$1`, [uAtend]);
await como(null);
check('superadmin promove a admin', (await q(`SELECT role FROM profiles WHERE id=$1`, [uAtend]))[0].role === 'admin', JSON.stringify(t));
await q(`UPDATE profiles SET role='atendimento' WHERE id=$1`, [uAtend]);
await como('service');
t = await tenta(`UPDATE profiles SET role='encarregado' WHERE id=$1`, [uOrf]);
await como(null);
check('service role (edge function) define papel', (await q(`SELECT role FROM profiles WHERE id=$1`, [uOrf]))[0].role === 'encarregado', JSON.stringify(t));

console.log('— Auto-registo em alunos');
await como(aluno);
t = await tenta(`INSERT INTO alunos(nome,email,data_nascimento,status,metodo_pagamento,numerario_aprovado,stripe_subscription_id,stripe_customer_id) VALUES ('Ana Maria Costa','aluno@x.pt','1990-01-01','ativo','transferencia',true,'sub_falso','cus_falso') RETURNING id`);
await como(null);
r = (await q(`SELECT * FROM alunos WHERE email='aluno@x.pt'`))[0];
check('ficha criada', !!r, JSON.stringify(t));
check('não se marca subscrição/numerário/transferência', r && r.stripe_subscription_id === null && r.stripe_customer_id === null && r.numerario_aprovado === false && r.metodo_pagamento === 'stripe', JSON.stringify(r && { s: r.stripe_subscription_id, n: r.numerario_aprovado, m: r.metodo_pagamento }));
const alunoId = r.id;

console.log('— Check-in só com pagamento em dia');
const checkin = async (quem, id, nome) => { await como(quem); const x = await tenta(`INSERT INTO presencas(aluno_id, aluno_nome, tipo) VALUES ($1,$2,'checkin')`, [id, nome]); await como(null); return x; };
t = await checkin(aluno, alunoId, 'Ana');
check('Stripe sem subscrição → check-in recusado', !!t.erro, JSON.stringify(t));
await q(`UPDATE alunos SET stripe_subscription_id='sub_1' WHERE id=$1`, [alunoId]);
t = await checkin(aluno, alunoId, 'Ana');
check('Stripe com subscrição → check-in aceite', !t.erro, JSON.stringify(t));
t = await checkin(prof, alunoId, 'Ana');
check('professor marca presença manual (sem mudança)', !t.erro, JSON.stringify(t));

const uNum = await user('num@x.pt', { nome: 'Rui Num' }); const num = { id: uNum, email: 'num@x.pt' };
const idNum = (await q(`INSERT INTO alunos(nome,email,data_nascimento,metodo_pagamento,numerario_aprovado) VALUES ('Rui Num','num@x.pt','1990-01-01','numerario',false) RETURNING id`))[0].id;
t = await checkin(num, idNum, 'Rui');
check('numerário por aprovar → recusado', !!t.erro, JSON.stringify(t));
await q(`UPDATE alunos SET numerario_aprovado=true WHERE id=$1`, [idNum]);
t = await checkin(num, idNum, 'Rui');
check('numerário aprovado → aceite', !t.erro, JSON.stringify(t));

const uFam = await user('fam@x.pt', { nome: 'Filho Fam' }); const fam = { id: uFam, email: 'fam@x.pt' };
const gid = (await q(`INSERT INTO grupos_familiares(titular_nome,titular_email,titular_nif,status) VALUES ('Pai','pai@x.pt','123456789','inativo') RETURNING id`))[0].id;
const idFam = (await q(`INSERT INTO alunos(nome,email,data_nascimento,metodo_pagamento,grupo_familiar_id) VALUES ('Filho Fam','fam@x.pt','2015-01-01','stripe',$1) RETURNING id`, [gid]))[0].id;
t = await checkin(fam, idFam, 'Filho');
check('família com grupo inativo → recusado', !!t.erro, JSON.stringify(t));
await q(`UPDATE grupos_familiares SET status='ativo' WHERE id=$1`, [gid]);
t = await checkin(fam, idFam, 'Filho');
check('família com grupo ativo → aceite', !t.erro, JSON.stringify(t));

await como(aluno);
const pgs = await tenta(`SELECT * FROM pagamentos`);
await como(null);
check('aluno sem pagamento continua a ler o próprio financeiro (sem erro)', !pgs.erro, JSON.stringify(pgs));

console.log('— grupos_familiares');
await como(prof); let g = await tenta(`SELECT titular_nif FROM grupos_familiares`); await como(null);
check('professor não vê NIF do titular', !g.erro && g.n === 0, JSON.stringify(g));
await como(atend); g = await tenta(`SELECT titular_nif FROM grupos_familiares`); await como(null);
check('atendimento vê', g.n === 1, JSON.stringify(g));

console.log('— Ranking');
await como(num); let rk = await tenta(`SELECT * FROM ranking_treinos()`); await como(null);
const nomes = (rk.rows || []).map(x => x.nome);
check('aluno vê colegas abreviados', nomes.includes('Ana C.') && nomes.includes('Filho F.'), JSON.stringify(rk));
check('aluno vê o próprio nome completo', nomes.includes('Rui Num'), JSON.stringify(nomes));
await como(prof); rk = await tenta(`SELECT * FROM ranking_treinos()`); await como(null);
check('professor vê nomes completos', (rk.rows || []).some(x => x.nome === 'Ana Maria Costa'), JSON.stringify(rk));
await como('anon'); rk = await tenta(`SELECT * FROM ranking_treinos()`); await como(null);
check('anónimo não chama o ranking', !!rk.erro, JSON.stringify(rk));

console.log('— Faturas duplicadas');
await q(`INSERT INTO pagamentos(aluno_id,aluno_nome,valor,vencimento,status,stripe_invoice_id) VALUES ($1,'Ana',62,'2026-10-01','pago','in_1')`, [alunoId]);
t = await tenta(`INSERT INTO pagamentos(aluno_id,aluno_nome,valor,vencimento,status,stripe_invoice_id) VALUES ($1,'Ana',62,'2026-10-01','pago','in_1')`, [alunoId]);
check('2.ª linha com a mesma invoice → 23505', t.code === '23505', JSON.stringify(t));
t = await tenta(`INSERT INTO pagamentos(aluno_id,aluno_nome,valor,vencimento,status) VALUES ($1,'Ana',62,'2026-10-01','pendente'),($1,'Ana',62,'2026-11-01','pendente')`, [alunoId]);
check('pagamentos sem invoice continuam livres', !t.erro, JSON.stringify(t));

console.log('— Limites públicos');
await como('anon');
let erroLimite = null;
for (let i = 0; i < 21; i++) { const x = await tenta(`SELECT email_existe('aluno@x.pt') AS e`); if (x.erro) { erroLimite = x; break; } if (i === 0) check('email_existe funciona para anónimo', x.rows[0].e === true, JSON.stringify(x)); }
check('21.º pedido do mesmo IP é recusado', !!erroLimite && erroLimite.code === '54000', JSON.stringify(erroLimite));
t = await tenta(`SELECT registar_tentativa('x',5,60)`);
check('anónimo não chama registar_tentativa', !!t.erro, JSON.stringify(t));
await como('service');
t = await tenta(`SELECT email_existe('aluno@x.pt') AS e`);
check('service role sem limite', !t.erro, JSON.stringify(t));
let lim = []; for (let i = 0; i < 6; i++) lim.push((await tenta(`SELECT registar_tentativa('matricula-familia:1.1.1.1',5,60) AS ok`)).rows?.[0]?.ok);
check('registar_tentativa: 5 ok, 6.º bloqueado', JSON.stringify(lim) === '[true,true,true,true,true,false]', JSON.stringify(lim));
await como(null);

console.log('— Aula particular');
const ap = (await q(`INSERT INTO aulas_particulares(professor_id,professor_nome,data,hora_inicio,status) VALUES ($1,'P','2026-10-10','10:00','agendada') RETURNING id`, [uProf]))[0].id;
await q(`INSERT INTO aulas_particulares_alunos(aula_particular_id,aluno_id,aluno_nome) VALUES ($1,$2,'Ana')`, [ap, alunoId]);
await q(`UPDATE aulas_particulares SET status='concluida' WHERE id=$1`, [ap]);
await q(`UPDATE aulas_particulares SET status='agendada' WHERE id=$1`, [ap]);
await q(`UPDATE aulas_particulares SET status='concluida' WHERE id=$1`, [ap]);
const np = (await q(`SELECT count(*)::int n FROM presencas WHERE aluno_id=$1 AND metodo='particular'`, [alunoId]))[0].n;
check('concluída→agendada→concluída gera 1 presença', np === 1, 'n=' + np);

await c.query('ROLLBACK');
console.log(`\n${ok} passaram, ${falhas} falharam`);
process.exitCode = falhas ? 1 : 0;
await c.end();
