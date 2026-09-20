# Guia — Testar o fluxo de pagamentos completo

Como o dinheiro anda pela app, e como exercitar cada passo em modo de teste
(Stripe test mode, sem cobranças reais).

---

## 1. O fluxo, ponta a ponta

O pagamento principal é **subscrição Stripe** (débito automático mensal). O
numerário continua como opção na matrícula pública (→ aprovação do super admin).

```
0. SETUP (uma vez por ambiente)
   sync-planos-stripe  →  cria Product + Price mensal EUR para cada plano ativo
                          grava planos.stripe_price_id_{test,live}

1. ARRANCAR A SUBSCRIÇÃO
   Matrícula (Stripe) OU "Meu Financeiro → Ativar débito automático"
     │  criarCheckoutSession({ planoId })      src/pages/aluno/MeuFinanceiro.tsx
     ▼
   criar-checkout-session (mode:'subscription', line_items:[{price}])
     · autentica caller · aluno por email · garante Stripe Customer
     · devolve { url }
     ▼
   Checkout da Stripe → cartão → "Pay and subscribe" → /?pago=1
     · App.tsx: navega para meu-financeiro + invalida cache (pagamentos + alunos)

2. WEBHOOK  (api/stripe-webhook.ts — local: scripts/webhook-local.mjs)
   checkout.session.completed / customer.subscription.created
     → alunos: status='ativo', stripe_subscription_id, metodo_pagamento='stripe'
   invoice.paid           (1.ª cobrança + todas as renovações mensais)
     → INSERE pagamentos {status:'pago', stripe_invoice_id, valor, vencimento}
       (idempotente por stripe_invoice_id)
     → emitirFatura() → FR TOConline + AT + email    → notificarWhatsApp()
   invoice.payment_failed
     → INSERE pagamentos {status:'vencido'} + notifica aluno/admin
     → attempt_count ≥ 3 → alunos.status='suspenso'
   customer.subscription.updated  → sincroniza plano
   customer.subscription.deleted  → alunos.status='inativo' + contrato cancelado
   payment_intent.succeeded (SEM invoice) → pagamento único: marca a linha
       pendente/vencida mais antiga como paga (retry de mensalidade legada)
```

**Pontos-chave:**
- As linhas `pagamentos` da subscrição são criadas **pelo webhook** (`invoice.paid`),
  não pela app nem pela matrícula.
- O `stripe listen` reenvia eventos na versão de API da conta (2025+), onde
  `invoice.subscription` já não existe — o webhook lê
  `invoice.parent.subscription_details.subscription` como fallback. Em produção,
  fixa a versão da API no endpoint do dashboard.

---

## 2. Pré-requisitos

**Só precisas das envs — nenhum login de conta (Stripe / Supabase / Vercel /
TOConline).** Tudo corre local e o que falta geras tu:

| Ferramenta | Para quê | Instalar |
|---|---|---|
| Stripe CLI | reencaminhar webhooks, disparar eventos | ✅ já instalado em `~/.local/bin/stripe` (v1.50) |
| Supabase CLI | Postgres + Edge Functions locais | já em devDependencies (`npx supabase`) |
| Node ≥ 22 | correr o webhook sem Vercel (type-strip nativo) | já tens (v26) |

Como funciona sem contas:

- **Stripe** — a CLI aceita `STRIPE_API_KEY` no ambiente (ou `--api-key`) em vez
  de `stripe login`; não precisas do dashboard. Ver eventos: terminal do
  `stripe listen` + `stripe events list`.
- **Supabase** — o stack local usa chaves próprias (do `npx supabase status`), não
  as do projeto hosted. O `seed.mjs` **cria os logins de teste** que te faltam.
- **Webhook** — corre-se com `scripts/webhook-local.mjs` (adaptador Node ~15
  linhas), sem conta Vercel.
- **TOConline / WhatsApp** — deixas os tokens vazios; degradam sozinhos.

As chaves de teste em `.env.example` já são `sk_test_` / `pk_test_` reais —
podes usá-las. **Nunca commitar chaves `sk_live_`.**

---

> Consultas à BD local, ao longo do guia, via `psql`:
> ```bash
> alias dbq='psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c'
> ```

## 3. Setup local

> **Os 3 ficheiros `.env` já estão criados e preenchidos** com os valores locais
> (`.env`, `.env.local`, `supabase/functions/.env` — todos git-ignored). Falta
> **uma** coisa: pôr o `STRIPE_WEBHOOK_SECRET` real no `.env` da raiz — sai do
> `stripe listen` (passo 4).

### 3.1 Supabase + seed

```bash
npx supabase start
node supabase/seed.mjs          # cria alunos + pagamentos ('pendente' e 'pago')
```

O seed cria, por aluno, um pagamento `pago` (2026-06) e um `pendente` (2026-08).
O `pendente` é o que vais pagar.

### 3.2 Variáveis da Edge Function

O edge runtime local **injeta sozinho** `SUPABASE_URL`, `SUPABASE_ANON_KEY` e
`SUPABASE_SERVICE_ROLE_KEY` (vais ver *"Env name cannot start with SUPABASE_,
skipping"* — é normal, não é erro). Só precisas de dar o resto.

Cria `supabase/functions/.env` (git-ignored):

```env
STRIPE_SECRET_KEY=sk_test_...
SITE_URL=http://localhost:5174
```

Serve **todas** as funções (checkout, portal, sync):

```bash
npx supabase functions serve --env-file supabase/functions/.env
```

### 3.3 Frontend

`.env.local`:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON=<anon key>
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

```bash
npm run dev     # http://localhost:5174
```

### 3.4 Webhook (sem Vercel)

`scripts/webhook-local.mjs` é um adaptador que corre o handler
`api/stripe-webhook.ts` num servidor Node simples (Node ≥ 22 faz type-strip do
`.ts` sozinho).

`.env` na raiz:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...        # ← do `stripe listen`, passo 4
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=<service_role key do `npx supabase status`>
# opcionais — deixa vazio para saltar TOConline/WhatsApp:
# TOCONLINE_ACCESS_TOKEN=
# META_WHATSAPP_TOKEN=
```

```bash
node --env-file=.env scripts/webhook-local.mjs
# → webhook local → http://localhost:3001/api/stripe-webhook
```

> Nota: sem `TOCONLINE_ACCESS_TOKEN` o `emitirFatura()` grava uma linha
> `estado: 'erro'` em `toc_documentos` e segue — o pagamento continua a ser
> marcado `pago`. É o comportamento esperado em local.
>
> `TOCONLINE_ACCESS_TOKEN` é um bearer que se obtém por OAuth
> client-credentials a partir do `TOCONLINE_CLIENT_ID/SECRET`. Se quiseres testar
> a emissão real da FR precisas de fazer esse passo à parte; para validar o fluxo
> de pagamento não é necessário.

---

## 4. Ligar a Stripe CLI (sem login)

O `STRIPE_WEBHOOK_SECRET` no `.env` da raiz **já está preenchido** (obtido com
`stripe listen --print-secret`). Só falta deixar o listener a correr:

```bash
export STRIPE_API_KEY=sk_test_...
stripe listen --forward-to localhost:3001/api/stripe-webhook
```

(Sem `stripe login` — a `STRIPE_API_KEY` no ambiente chega. O `whsec_` que ele
imprime é o mesmo que já está no `.env`, persiste entre execuções.)

Deixa este terminal aberto: mostra cada evento e o status code da resposta.

---

## 4b. Sincronizar planos com a Stripe (uma vez)

Cada plano precisa de um Price recorrente na Stripe. Com um token de **admin**
(login `admin@ginasio.test` / `DevTest1234!` → `access_token`):

```bash
ANON=<VITE_SUPABASE_ANON do .env.local>
TOKEN=$(curl -s "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"admin@ginasio.test","password":"DevTest1234!"}' | jq -r .access_token)

curl -s http://127.0.0.1:54321/functions/v1/sync-planos-stripe \
  -H "Authorization: Bearer $TOKEN" -H "apikey: $ANON" -d '{}' | jq
```

Confirma: `dbq "select nome, stripe_price_id_test from planos where ativo"` — todos preenchidos.
Idempotente: correr de novo só devolve `skipped`.

---

## 5. Teste E2E — subscrição (caminho feliz)

1. Login `aluno1@ginasio.test` / `DevTest1234!` (ou DEV "Aluno").
2. **Meu Financeiro** → cartão âmbar **"Ativa o débito automático"** → botão
   **Ativar débito automático**.
3. Redireciona para o Checkout da Stripe (*"Subscribe to Mensalidade — …"*,
   €X/mês). Escolhe **Card**, cartão:
   ```
   4242 4242 4242 4242   ·   12 / 34   ·   CVC 123   ·   CP 4710-409
   ```
   **Pay and subscribe**.
4. Volta a `/?pago=1` → toast, cai em Meu Financeiro.
5. **`stripe listen`:** `checkout.session.completed → 200`, `customer.subscription.created → 200`,
   `invoice.paid → 200`.
6. **`webhook-local.mjs`:** `Missing TOCONLINE_ACCESS_TOKEN` (esperado sem token) ou `FR emitida: …`.
7. BD:
   ```bash
   dbq "select status, stripe_subscription_id from alunos where email='aluno1@ginasio.test'"
   dbq "select plano_nome, valor, status, vencimento, stripe_invoice_id from pagamentos where aluno_nome='Rui Ferreira' order by created_at desc limit 3"
   ```
8. Meu Financeiro passa a mostrar **"Débito automático ativo · €X/mês"** + **Gerir**.

### Checklist

- [ ] `planos.stripe_price_id_test` preenchidos (§4b)
- [ ] Checkout de subscrição abre (`mode:'subscription'`, "Pay and subscribe")
- [ ] `alunos`: `status='ativo'` + `stripe_subscription_id` preenchido
- [ ] `pagamentos`: 1 linha nova `pago` com `stripe_invoice_id`
- [ ] Reenviar o `invoice.paid` (`stripe events resend <evt>`) → **não** duplica a linha
- [ ] `toc_documentos`: 1 linha (`erro` sem token, senão `enviada`)

---

## 6. Teste — renovação e falha

**Renovação** (test clock ou reenvio):
```bash
stripe events resend <evt_id do invoice.paid>   # idempotente — não duplica
# ou, para uma cobrança nova: Stripe dashboard → subscrição → "Advance test clock"
```

**Falha de pagamento** — cria a subscrição com cartão que recusa na renovação
(`pm_card_chargeCustomerFail`) via dashboard, ou:
```bash
stripe trigger invoice.payment_failed --override invoice:customer=<cus_id do aluno>
```
Esperado: linha `pagamentos` `vencido` + WhatsApp ao aluno + `mensagens` ao admin;
`Meu Financeiro` mostra **"Mensalidade em atraso"** + **Atualizar cartão** (→ portal).
Após 3 tentativas falhadas → `alunos.status='suspenso'`.

**Portal:** botão **Gerir** / **Atualizar cartão** → `criar-portal-session` →
portal Stripe (mudar cartão, cancelar). Cancelar → `customer.subscription.deleted`
→ aluno `inativo` + contrato `cancelado`.
(Requer o Customer Portal ativado no dashboard Stripe test — Settings → Billing →
Customer portal → Save.)

---

## 6b. Matrícula nova, ponta a ponta

1. Logout → aba **Inscrever-me** → **Começar Matrícula**.
2. Ficha (email novo, NIF 9 dígitos, CP `4710-409`, password), data adulta.
3. Contrato: 3 checkboxes + assinatura.
4. Pagamento → **Adulto** → um plano → **Stripe** → **Concluir com Stripe**.
5. A conta é criada (`status='ativo'` — um aluno `inativo` seria deslogado na
   hora por `auth.tsx`, matando a sessão antes do checkout) + o Stripe Customer,
   e és **redirecionado direto para o Checkout de subscrição**. Paga com `4242…`
   → `/?pago=1`.
6. Webhook: `checkout.session.completed` liga a subscrição; `invoice.paid` cria a
   1.ª linha `pagamentos`. Se abandonares o checkout ficas `ativo` sem subscrição
   (o admin vê e contacta).
7. Numerário: escolhe "Numerário" no passo 4 → ecrã "aguardando aprovação" →
   super admin aprova em **Pendentes Numerário** (inalterado).

---

## 7. Casos de borda (validação da Edge Function)

Token de um aluno logado (DevTools → Application → Local Storage →
`sb-...-auth-token` → `access_token`):

```bash
FN=http://127.0.0.1:54321/functions/v1/criar-checkout-session
TOKEN=<access_token do aluno>
H=(-H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json')

# plano sem price sincronizado → 400 "não está sincronizado com a Stripe"
curl -s $FN "${H[@]}" -d '{"planoId":"<plano sem stripe_price_id>"}'

# pagamento de outro aluno → 404 "Pagamento não encontrado"
curl -s $FN "${H[@]}" -d '{"pagamentoId":"<id de outro aluno>"}'

# pagamento já pago → 400 "Este pagamento já não está pendente"
curl -s $FN "${H[@]}" -d '{"pagamentoId":"<id de um pagamento pago>"}'

# sem token → 401 "Não autenticado"
curl -s $FN -H 'Content-Type: application/json' -d '{"planoId":"x"}'

# sem body → 400 "planoId ou pagamentoId é obrigatório"
curl -s $FN "${H[@]}" -d '{}'

# sync-planos-stripe com token de aluno → 403 "Acesso restrito a administradores"
curl -s http://127.0.0.1:54321/functions/v1/sync-planos-stripe "${H[@]}" -d '{}'
```

---

## 8. Testar o webhook isoladamente (sem passar pelo Checkout)

Útil para iterar no `api/stripe-webhook.ts` sem pagar sempre.

O webhook casa o aluno por `stripe_customer_id`. Para um evento sintético
funcionar:

1. Cria um customer de teste e cola o id no aluno:
   ```bash
   stripe customers create --email aluno1@ginasio.test --name "Aluno 1"
   # → cus_XXX
   dbq "update alunos set stripe_customer_id='cus_XXX' where email='aluno1@ginasio.test';"
   ```
2. Dispara um `payment_intent.succeeded` já com esse customer no payload:
   ```bash
   stripe trigger payment_intent.succeeded \
     --override payment_intent:customer=cus_XXX
   ```
   O `stripe listen` reencaminha → o webhook acha o aluno por
   `stripe_customer_id` e marca o `pendente` mais antigo como `pago`.
3. Confirma na BD como no passo 5.8.

Para reeviar um evento já recebido (repro rápido):

```bash
stripe events resend evt_XXXX
```

---

## 9. Subscrições (opcional)

O webhook trata `customer.subscription.updated` / `.deleted`, mas **nada na app
cria subscrições** — o `criar-checkout-session` é `mode: 'payment'` (one-off).
Para testar esses ramos:

```bash
stripe trigger customer.subscription.deleted
```

e verifica que o aluno correspondente (por `stripe_customer_id`) fica `inativo`
e o contrato ativo fica `cancelado`. O evento do `stripe trigger` traz um
customer aleatório — para casar um aluno, faz `--override
customer:id` não é suportado aqui, por isso: cria a subscrição via CLI
(`stripe subscriptions create --customer cus_XXX --items ...`) e cancela-a
(`stripe subscriptions cancel sub_XXX`), que gera o evento real para esse
customer. Ramo secundário — podes saltar.

---

## 10. Produção — onde vão as envs

*(requer acesso às contas Supabase / Vercel / Stripe — fora do teste local acima)*

Os ficheiros `.env*` locais **não sobem para lado nenhum** (git-ignored). Em
produção as mesmas variáveis vivem em **três sítios diferentes**, com valores
`live` / do projeto hosted:

| Onde corre | Variáveis | Definir em | Valores |
|---|---|---|---|
| **Frontend** (`VITE_*`) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON`, `VITE_STRIPE_PUBLIC_KEY` | Vercel → Project → Settings → Environment Variables | URL/anon do projeto Supabase hosted · `pk_live_…` (ou `pk_test_` em staging). São embebidas no bundle no build. |
| **Webhook** (`api/stripe-webhook.ts`) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TOCONLINE_ACCESS_TOKEN`, `META_*` | Vercel (mesmo sítio, server-side) | `sk_live_…` · `whsec_` do **endpoint** criado no dashboard Stripe (≠ o do `stripe listen`) · URL + service_role key do Supabase hosted. |
| **Edge Functions** (`criar-checkout-session`, `criar-portal-session`, `sync-planos-stripe`) | `STRIPE_SECRET_KEY`, `SITE_URL` | Supabase (`supabase secrets set`) — **não** Vercel | `sk_live_…` · URL público do site. `SUPABASE_*` são injetados pela plataforma. |

Passos:

1. **Edge Functions** (projeto Supabase remoto):
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase secrets set STRIPE_SECRET_KEY=sk_live_... SITE_URL=https://app.gbbraga.com
   npx supabase functions deploy criar-checkout-session criar-portal-session sync-planos-stripe
   ```
2. **Vercel:** mete as variáveis das duas primeiras linhas da tabela no projeto.
3. **Endpoint de webhook na Stripe:** Dashboard → Developers → Webhooks → Add
   endpoint → `https://<app>.vercel.app/api/stripe-webhook`, **fixa a versão da
   API** do endpoint, eventos: `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`,
   `payment_intent.succeeded`, `payment_intent.payment_failed`. Copia o `whsec_`
   desse endpoint para a Vercel.
4. **Stripe → Customer portal:** Settings → Billing → Customer portal → ativar
   (mudança de cartão + cancelamento) → Save.
5. **Sincronizar planos em prod:** correr `sync-planos-stripe` uma vez com um
   token de admin (cria os `stripe_price_id_live`).
6. Testa em staging com `sk_test_`/`pk_test_` e `4242…` antes de trocar para live.

---

## Referência rápida — cartões de teste Stripe

| Cartão | Resultado |
|---|---|
| `4242 4242 4242 4242` | sucesso |
| `4000 0000 0000 9995` | recusado (fundos insuficientes) |
| `4000 0000 0000 0002` | recusado (genérico) |
| `4000 0025 0000 3155` | exige 3D Secure (autenticação) |

Validade = qualquer data futura · CVC = 3 dígitos quaisquer · CP = qualquer.
