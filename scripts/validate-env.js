#!/usr/bin/env node
// GB Braga — Valida variáveis de ambiente antes do deploy
const required = {
  frontend: ['VITE_SUPABASE_URL','VITE_SUPABASE_ANON'],
  backend:  ['STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','SUPABASE_SERVICE_KEY'],
  optional: ['META_WHATSAPP_TOKEN','META_PHONE_ID','TOCONLINE_CLIENT_ID','VITE_STRIPE_PUBLIC_KEY'],
};

const env = process.env;
let ok = true;
console.log('\n🔍 GB Braga — Validação de variáveis de ambiente\n');

console.log('Frontend (Vercel environment):');
required.frontend.forEach(k => {
  const v = env[k]; const set = !!v && !v.includes('SEU-');
  console.log(`  ${set ? '✅' : '❌'} ${k}${set ? '' : ' — NÃO CONFIGURADA'}`);
  if (!set) ok = false;
});

console.log('\nBackend (servidor/webhook):');
required.backend.forEach(k => {
  const v = env[k]; const set = !!v && !v.endsWith('...');
  console.log(`  ${set ? '✅' : '⚠ '} ${k}${set ? '' : ' — verificar antes de produção'}`);
});

console.log('\nOpcionais:');
required.optional.forEach(k => {
  const v = env[k];
  console.log(`  ${v ? '✅' : '○ '} ${k}${v ? '' : ' (não configurada)'}`);
});

const supabaseUrl = env.VITE_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
  console.log('\n⚠  VITE_SUPABASE_URL não parece uma URL Supabase válida');
  ok = false;
}
const sk = env.STRIPE_SECRET_KEY || '';
if (sk && !sk.startsWith('sk_')) {
  console.log('\n❌ STRIPE_SECRET_KEY deve começar por sk_live_ ou sk_test_');
  ok = false;
}

console.log(`\n${ok ? '✅ Ambiente pronto para deploy!' : '❌ Corrige os erros antes de continuar.'}\n`);
process.exit(ok ? 0 : 1);
