// Sem runner de testes no projeto — corre à mão:  node src/lib/financeiro.test.mjs
import assert from 'node:assert/strict';
import { classificarFinanceiro, rotuloPagamento, fmtData } from './financeiro.ts';

const hoje = new Date('2026-09-04');
const pg = (o) => ({ id: o.v, alunoId: 'a', alunoNome: 'x', valor: 62, plano: 'P', ...o, vencimento: o.v });

// tudo pago → em dia, sem alvo
let s = classificarFinanceiro([pg({ v: '2026-06-05', status: 'pago' })], hoje);
assert.equal(s.estado, 'em_dia');
assert.equal(s.aRegularizar, undefined);
assert.equal(s.totalEmAberto, 0);

// só um pendente futuro → em dia, mas com proximaCobranca + dias > 0
s = classificarFinanceiro([pg({ v: '2026-10-05', status: 'pendente' })], hoje);
assert.equal(s.estado, 'em_dia');
assert.equal(s.proximaCobranca?.vencimento, '2026-10-05');
assert.equal(s.dias, 31);

// pendente com vencimento passado → em atraso, dias negativo
s = classificarFinanceiro([pg({ v: '2026-08-05', status: 'pendente' })], hoje);
assert.equal(s.estado, 'em_atraso');
assert.equal(s.aRegularizar?.vencimento, '2026-08-05');
assert.equal(s.dias, -30);

// pendente a vencer hoje → a_vencer, dias 0
s = classificarFinanceiro([pg({ v: '2026-09-04', status: 'pendente' })], hoje);
assert.equal(s.estado, 'a_vencer');
assert.equal(s.dias, 0);

// vários em aberto → total somado, regulariza o mais antigo
s = classificarFinanceiro([
  pg({ v: '2026-08-05', status: 'vencido' }),
  pg({ v: '2026-07-05', status: 'vencido' }),
  pg({ v: '2026-06-05', status: 'pago' }),
], hoje);
assert.equal(s.emAberto.length, 2);
assert.equal(s.totalEmAberto, 124);
assert.equal(s.aRegularizar?.vencimento, '2026-07-05');

// rótulos
assert.deepEqual(rotuloPagamento(pg({ v: '2026-06-05', status: 'pago' }), hoje), { label: 'Pago', cor: 'success' });
assert.deepEqual(rotuloPagamento(pg({ v: '2026-08-05', status: 'pendente' }), hoje), { label: 'Em atraso', cor: 'danger' });
assert.deepEqual(rotuloPagamento(pg({ v: '2026-10-05', status: 'pendente' }), hoje), { label: 'Pendente', cor: 'warning' });

assert.equal(fmtData('2026-08-05'), '5 ago 2026');

console.log('financeiro.ts — todos os casos passam ✓');
