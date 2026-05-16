# Gracie Barra Braga — Sistema de Gestão

> **Tribo Laurada Lda. · NIF 518948471**  
> Rua Nova Santa Cruz 11, 4710-409 Braga · +351 927 773 854 · gbbraga.com

App web de gestão completa da academia: alunos, pagamentos automáticos (Stripe), faturação AT (TOConline), check-in GPS, graduações, comunicação WhatsApp e portal do aluno.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Base de dados | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel (CDN + Edge Functions) |
| Pagamentos | Stripe (subscrições recorrentes) |
| Faturação AT | TOConline API (Faturas-Recibo) |
| Notificações | Meta WhatsApp Business API |

---

## Instalação rápida

### 1. Pré-requisitos
- Node.js ≥ 18
- Git
- Conta Supabase (gratuita)
- Conta Vercel (gratuita)

### 2. Clonar e instalar
```bash
git clone https://github.com/SEU-USER/gbbraga-app.git
cd gbbraga-app
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
# Editar .env.local com as tuas chaves
```

### 4. Criar a base de dados
```bash
# Copiar o conteúdo de supabase/schema.sql
# Executar no Supabase SQL Editor
```

### 5. Desenvolvimento local
```bash
npm run dev        # http://localhost:5173
npm run typecheck  # verificar TypeScript
npm run build      # build de produção
```

### 6. Deploy para produção
```bash
git push origin main  # Vercel faz deploy automático
```

Para o guia completo passo a passo, consulta **guia_instalacao_gbbraga.docx**.

---

## Perfis de utilizador

| Role | Acesso |
|------|--------|
| `superadmin` | Total + aprovação numerário + gestão rede |
| `admin` | Gestão completa da academia |
| `atendimento` | Check-in, alunos, comunicação |
| `professor` | Turmas, alunos, graduação, check-in pessoal |
| `aluno` | Portal pessoal |

---

## Segurança

- Row Level Security (RLS) em todas as tabelas Supabase
- RBAC no frontend via `canAccess()` em App.tsx
- Stripe webhooks com verificação HMAC-SHA256
- Headers de segurança HTTP via vercel.json
- Dados pessoais armazenados na UE (Supabase Ireland)
- Logs de acesso em `access_logs` (append-only)

---

## Documentação

- `manual_utilizador_gbbraga.docx` — Manual por perfil de utilizador
- `documentacao_tecnica_gbbraga.docx` — Arquitectura, DB, integrações, segurança
- `guia_instalacao_gbbraga.docx` — Deployment passo a passo
- `supabase/schema.sql` — Schema completo com RLS e seeds
- `api/stripe-webhook.ts` — Handler dos webhooks Stripe

---

*OSS! 🥋*
