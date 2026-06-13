# 02 — System Overview

**Gracie Barra Braga — Management Platform**

---

## 1. Business Context

GB Braga is a Brazilian Jiu-Jitsu academy (part of the Gracie Barra global network) located in Braga, Portugal, operated by Tribo Laurada Lda. (NIF 518948471). The platform manages all academy operations:

- Student enrollment and lifecycle management
- Attendance tracking (GPS-validated self-check-in)
- Belt graduation history
- Financial management (Stripe subscriptions + cash payments)
- Portuguese fiscal compliance (TOConline invoicing)
- Internal staff communication
- Multi-role access (superadmin, admin, atendimento, professor, aluno)

---

## 2. User Roles

| Role | Portuguese | Capabilities |
|---|---|---|
| `superadmin` | Super-Administrador | Full access including module management, numerário, all staff features |
| `admin` | Administrador | All staff features except module management and numerário |
| `atendimento` | Atendimento | Alunos, check-in, comunicação, chat |
| `professor` | Professor | Check-in, graduação, professor dashboard |
| `aluno` | Aluno | Portal, self check-in, classes, evolution, financeiro, content, messages |

---

## 3. Module System

The platform has a dynamic module system. The Superadmin can enable/disable optional modules at runtime. Changes propagate instantly to all active sessions via Supabase Realtime.

### Core Modules (always active)
- Dashboard
- Alunos
- Portal (aluno)
- Config
- Perfil

### Optional Staff Modules
| Module ID | Label | Category |
|---|---|---|
| checkin | Check-in | Staff |
| turmas | Turmas | Staff |
| financeiro | Financeiro | Staff |
| graduacao | Graduação | Staff |
| comunicacao | Comunicação | Staff |
| chat | Chat | Staff |
| contratos | Contratos | Staff |
| relatorios | Relatórios | Staff |
| integracoes | Integrações | Staff |
| matricula | Matrícula Online | Staff |
| numerario | Numerário | Staff |

### Optional Aluno Modules
| Module ID | Label | Category |
|---|---|---|
| meu-checkin | Check-in | Aluno |
| minhas-aulas | Minhas Aulas | Aluno |
| evolucao | Evolução | Aluno |
| meu-financeiro | Financeiro | Aluno |
| conteudo | Conteúdo | Aluno |
| mensagens | Mensagens | Aluno |

---

## 4. Data Model Summary

```
profiles ──────────── auth.users (1:1)
    │
    ├── alunos ──────── planos
    │       │
    │       ├── pagamentos ── toc_documentos
    │       ├── presencas
    │       ├── contratos
    │       ├── graduacoes
    │       └── pedidos_numerario
    │
    ├── turmas ──────── inscricoes_turma ── alunos
    │
    ├── mensagens
    ├── configuracoes
    └── access_logs
```

---

## 5. Key Workflows

### 5.1 Student Self-Enrollment
1. Student opens public enrollment URL
2. Provides personal data, selects plan, signs contract
3. Pays via Stripe (or submits cash payment request)
4. Account created in Supabase Auth + profiles + alunos tables
5. `matricula_completa = true` set on profile

### 5.2 Staff-Managed Enrollment
1. Admin opens NovaMatriculaModal
2. Fills student data, selects plan
3. Optionally sends invite email (invite-staff Edge Function)
4. Student sets their own password via recovery link

### 5.3 GPS Check-in (Aluno)
1. Aluno opens MeuCheckin page
2. Browser requests geolocation permission
3. Haversine distance calculated against academy GPS coordinates
4. If within configured radius → check-in recorded with GPS metadata
5. Last 5 check-ins displayed

### 5.4 Belt Graduation
1. Professor/Admin opens GraduacaoPage
2. Selects aluno, new faixa/grau
3. Graduation saved to `graduacoes` table
4. Aluno's `faixa` and `grau` in `alunos` table updated
5. WhatsApp notification flag set (manual trigger)

### 5.5 Email Communication
1. Admin opens ComunicacaoPage
2. Selects template (or composes)
3. Chooses recipients (individual or group)
4. Sends via `send-email` Edge Function
5. Edge Function uses Resend API (if `re_` key) or SMTP
6. Message saved to `mensagens` table with status

### 5.6 Payment Flow (Stripe)
1. Aluno's Stripe subscription triggers webhook
2. Vercel serverless function `/api/stripe-webhook` receives event
3. Updates `pagamentos` table status
4. TOConline invoice generated if configured

---

## 6. Belt Progression System

### Adult Belts
`branca → azul → roxa → marrom → preta → vermelha`

Each belt has degrees (grau 0–4), represented visually as stripes.

### GB Kids Belt Progression
```
cinza-branca → cinza → cinza-preta
amarela-branca → amarela → amarela-preta
laranja-branca → laranja → laranja-preta
verde-branca → verde → verde-preta
↓
azul (adult track begins)
```

---

## 7. Plans (Planos)

| ID | Name | Price (€) | Category |
|---|---|---|---|
| pl-adulto-plus | Jiu-Jitsu Adulto Plus | 62 | adulto |
| pl-adulto-fundador | Jiu-Jitsu Adulto Fundador | 53 | fundador |
| pl-estudante | Jiu-Jitsu Estudante (Univ.) | 53 | adulto |
| pl-kids-plus | Jiu-Jitsu Kids Plus | 53 | kids |
| pl-kids-fundador | Jiu-Jitsu Kids Fundador | 45 | fundador |
| pl-familia-2 | Família 2 membros | 115 | familia |
| pl-familia-3 | Família 3 membros | 165 | familia |
| pl-familia-3-kids | Família 3 (Kids incluído) | 150 | familia |
| pl-familia-4 | Família 4 membros | 200 | familia |
| pl-familia-2-fund | Família 2 Fundador | 109 | fundador |
| pl-familia-3-fund | Família 3 Fundador | 157 | fundador |
| pl-familia-4-fund | Família 4 Fundador | 190 | fundador |

All prices include 23% IVA (Portuguese VAT).

---

## 8. Integrations

| Integration | Purpose | Status |
|---|---|---|
| Supabase Auth | Authentication, password reset, invites | Active |
| Supabase Storage | Avatar photos | Active |
| Supabase Realtime | Module state propagation | Active |
| Stripe | Payment processing, subscriptions | Configured |
| Resend API | Email delivery | Configured (SMTP fallback available) |
| TOConline | Portuguese fiscal invoicing | Configured |
| Meta WhatsApp Business | Bulk messaging | Available (token required) |

---

## 9. Environments

| Environment | URL | Notes |
|---|---|---|
| Production | https://app.gbbraga.com | Vercel + Supabase EU West |
| Demo Mode | localhost (no Supabase) | Uses mockData.ts |
| Development | localhost:5173 | Vite dev server |
