# 20 — FAQ

**Gracie Barra Braga — Perguntas Frequentes**

---

## Para Atletas

**P: Esqueci a minha password. Como faço para entrar?**  
R: Na página de login (app.gbbraga.com), clica em "Esqueci a password". Recebes um email com link de recuperação. Verifica a pasta de spam. O link é válido por 1 hora.

**P: Posso usar a app em vários dispositivos (telemóvel + computador)?**  
R: Sim. O teu perfil está na cloud. Faz login com o mesmo email e password em qualquer dispositivo.

**P: O check-in GPS não funciona. O que faço?**  
R: Verifica se a localização está ativa nas definições do browser:
- **iPhone/Safari:** Definições → Safari → Localização → Permitir
- **Android/Chrome:** Definições → Apps → Chrome → Permissões → Localização
Se o problema persistir, pede ao staff para fazer check-in manual.

**P: A minha faixa está errada na app.**  
R: A faixa é atualizada pelo professor após cada graduação. Contacta a receção se houver um erro — será corrigido rapidamente.

**P: Posso ver os meus pagamentos na app?**  
R: Sim, se o módulo Financeiro estiver ativo: Menu → Financeiro. Mostra todas as mensalidades com estado (pago/pendente/vencido).

**P: Como instalo a app no meu telemóvel?**  
R:  
- **iPhone (Safari):** Abrir app.gbbraga.com → tocar ↑ → "Adicionar ao Início"  
- **Android (Chrome):** Abrir app.gbbraga.com → menu ⋮ → "Adicionar ao início"

**P: A app não funciona offline?**  
R: A app carrega os dados quando tens internet e guarda-os temporariamente. Em modo offline, podes ver dados já carregados mas não podes fazer check-in (requer verificação GPS).

**P: O meu check-in não aparece no histórico.**  
R: Se o check-in foi manual (feito pelo staff), pode demorar alguns minutos. Se fizeste GPS check-in e não aparece, contacta a receção.

**P: Posso fazer check-in antes de sair de casa?**  
R: Não — o GPS valida que estás fisicamente na academia. O check-in só funciona dentro do raio configurado (tipicamente 100m da academia).

---

## Para Administradores

**P: Como adiciono um novo membro da equipa?**  
R: Config → Equipa → "+ Convidar Staff" → inserir email e função → Enviar convite. O membro recebe um email para definir a sua password.

**P: Um membro da equipa esqueceu a password.**  
R: Config → Equipa → selecionar membro → "Enviar reset de password". O membro recebe email de recuperação.

**P: Os emails não estão a ser enviados.**  
R: Verifica Config → Email. A password deve ser uma chave Resend (começa com `re_`). Se estiveres a usar SMTP do Gmail, este bloqueia envios sem SPF/DKIM configurados. Recomendamos usar Resend (resend.com — gratuito até 3.000 emails/mês).

**P: Como configuro o GPS fence para o check-in?**  
R: Config → Academia → secção GPS → ir fisicamente para o centro da academia → "Capturar localização atual" → definir raio (100m recomendado) → Guardar.

**P: Posso desativar um módulo temporariamente?**  
R: Sim (apenas Super-Admin). Menu → Módulos → toggle do módulo para "Desligado". As alterações propagam instantaneamente a todos os utilizadores ativos.

**P: Como apago um aluno do sistema?**  
R: Por regulamento RGPD, não se devem apagar dados imediatamente. Muda o status para "Inativo" na ficha do aluno. Para apagamento completo (direito ao esquecimento), contacta o responsável técnico para eliminar o registo e os dados associados.

**P: O Stripe não está a processar pagamentos.**  
R: Verifica se o webhook está registado no Stripe Dashboard (Developer → Webhooks → https://app.gbbraga.com/api/stripe-webhook) e se as variáveis de ambiente estão corretas no Vercel (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET).

**P: Como faço backup da base de dados?**  
R: A Supabase faz backup diário automático. Para export manual: Supabase Dashboard → Database → Backups. Para schema: `supabase db dump` via CLI.

---

## Para Professores

**P: Não vejo um aluno na lista do check-in.**  
R: O aluno pode não estar inscrito na turma. Pede ao staff para verificar as inscrições, ou pesquisa o aluno pelo nome.

**P: Fiz uma graduação com o grau errado. Posso corrigir?**  
R: Contacta o administrador — apenas admin/superadmin pode editar graduações existentes.

**P: Posso ver o histórico de presenças de um aluno específico?**  
R: Sim — no Check-in, seleciona a turma e vês as presenças. Para histórico detalhado, pede ao admin para consultar em Alunos → ficha do aluno.

---

## Para Atendimento

**P: Um aluno quer alterar o plano.**  
R: Na ficha do aluno, campo Plano → selecionar novo plano → guardar. Informar o administrador para ajustar a faturação.

**P: Como cancelo uma matrícula?**  
R: Na ficha do aluno, alterar o Status para "Inativo". Informar o administrador para cancelar a subscrição Stripe se aplicável.

---

## Para Técnicos / Desenvolvedores

**P: Como adiciono uma nova página ao sistema?**  
R: Ver `documentation/08-Developer-Guide.md` → secção "Adicionar uma nova página".

**P: Como faço deploy de uma nova versão?**  
R: Push para `main` no GitHub → Vercel deteta automaticamente e faz deploy. Leva 2-3 minutos.

**P: Como aplico uma migration SQL?**  
R: Supabase Dashboard → SQL Editor → colar o SQL → Run. Ou via CLI: `supabase db push`.

**P: A Edge Function send-email está a falhar. Como depuro?**  
R: Supabase Dashboard → Edge Functions → send-email → Logs. Verifica as configurações em Config → Email (secção SMTP da academia).

**P: Como adiciono um novo módulo ao sistema de módulos?**  
R: Em `src/lib/useModulos.tsx`, adicionar ao `MODULE_CATALOGUE`. Em `src/App.tsx`, adicionar ao `PAGE_ROLES` e ao switch de `renderPage`. Em `src/components/layout/Layout.tsx`, adicionar ao `NAV_ITEMS`.

**P: Onde estão as credenciais de produção?**  
R: No Vercel Dashboard → Project Settings → Environment Variables. Nunca em código ou ficheiros git.

**P: Como gero os tipos TypeScript da base de dados?**  
R: `npx supabase gen types typescript --project-id yrfdxocwhztokadzxtto > src/types/supabase.ts`

---

## Resolução de Problemas Comuns

| Sintoma | Causa Provável | Solução |
|---|---|---|
| Ecrã branco depois do login | Perfil não criado | Verificar trigger `on_auth_user_created` no Supabase |
| "Erro ao carregar dados" | RLS bloqueando | Verificar políticas RLS na tabela relevante |
| Check-in GPS falha silenciosamente | Policy INSERT em presencas para aluno em falta | Confirmar que `supabase/patches/17_fix_checkin.sql` foi aplicado |
| Emails chegam com remetente errado | SMTP mal configurado | Usar chave Resend em vez de SMTP |
| Módulo não aparece no sidebar | Módulo desativado | Super-Admin → Módulos → verificar toggle |
| App não instala como PWA | HTTPS necessário | Verificar que o domínio tem SSL ativo |
| Faixas kids não guardam | `belt_type` enum incompleto | Confirmar que `supabase/patches/16_fix_graduacao.sql` foi aplicado |
| Avatars não carregam | Bucket não criado | Criar bucket 'avatars' no Supabase Storage |
