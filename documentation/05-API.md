# 05 — API Documentation

**Gracie Barra Braga — API Reference**

---

## 1. Overview

The application uses two types of API:
1. **Supabase REST API** — Auto-generated from PostgreSQL schema, accessed via `@supabase/supabase-js`
2. **Supabase Edge Functions** — Custom Deno serverless functions
3. **Vercel Serverless Functions** — `/api/stripe-webhook`

All API calls require authentication via JWT Bearer token (automatically managed by Supabase client).

---

## 2. Supabase REST API

Base URL: `https://yrfdxocwhztokadzxtto.supabase.co/rest/v1`

Authentication: `Authorization: Bearer <jwt>` + `apikey: <anon-key>`

### 2.1 Profiles

#### Get own profile
```
GET /profiles?id=eq.{user_id}&select=id,nome,email,role,matricula_completa,telefone,avatar_url
```
**Authorization:** Own row or admin/superadmin/atendimento  
**Response:** Profile object

#### Update profile
```
PATCH /profiles?id=eq.{user_id}
Body: { nome, telefone }
```
**Authorization:** Own row or admin/superadmin

---

### 2.2 Alunos

#### List all students
```
GET /alunos?select=*&order=nome.asc
```
**Authorization:** admin, superadmin, atendimento, professor  
**Response:** Array of Aluno objects

#### Get student by email
```
GET /alunos?email=eq.{email}&select=*
```
**Authorization:** Own email or staff

#### Create student
```
POST /alunos
Body: { nome, email, telefone, faixa, grau, plano_id, ... }
```
**Authorization:** admin, superadmin, atendimento OR own email (self-enrollment)

#### Update student
```
PATCH /alunos?id=eq.{id}
Body: { faixa, grau, status, plano_id, ... }
```
**Authorization:** admin, superadmin, atendimento

---

### 2.3 Turmas

#### List all classes
```
GET /turmas?select=*&eq.ativa=true&order=horario.asc
```
**Authorization:** Any authenticated user (RLS: `auth.uid() IS NOT NULL`)

#### List by day
```
GET /turmas?select=*&dias_semana=cs.{"segunda"}
```
Note: Uses PostgreSQL array contains operator `cs`

---

### 2.4 Presencas

#### Record check-in
```
POST /presencas
Body: {
  aluno_id, aluno_nome, turma_id, turma_nome,
  data, hora, tipo: "checkin", metodo: "gps",
  gps_lat, gps_lng, gps_dist_m
}
```
**Authorization:** admin, superadmin, professor, atendimento, or own aluno (self-check-in, via the `presencas` INSERT policy added in `supabase/patches/17_fix_checkin.sql`)

#### Get student attendance
```
GET /presencas?aluno_id=eq.{id}&order=created_at.desc&limit=5
```
**Authorization:** Own aluno_id or staff

---

### 2.5 Pagamentos

#### List student payments
```
GET /pagamentos?aluno_id=eq.{id}&order=vencimento.desc
```
**Authorization:** Own aluno or admin/superadmin

#### Create payment
```
POST /pagamentos
Body: { aluno_id, aluno_nome, valor, vencimento, plano_id, status: "pendente" }
```
**Authorization:** admin, superadmin OR own aluno (self-enrollment)

#### Update payment status
```
PATCH /pagamentos?id=eq.{id}
Body: { status: "pago", data_pagamento, metodo }
```
**Authorization:** admin, superadmin

---

### 2.6 Graduacoes

#### List all graduations
```
GET /graduacoes?select=*&order=data.desc
```
**Authorization:** admin, superadmin, professor

#### Record graduation
```
POST /graduacoes
Body: { aluno_id, aluno_nome, faixa_anterior, grau_anterior, faixa_nova, grau_novo, data, professor_id, professor_nome }
```
**Authorization:** admin, superadmin, professor

---

### 2.7 Mensagens

#### List messages (history)
```
GET /mensagens?select=*&order=created_at.desc&limit=50
```
**Authorization:** admin, superadmin, atendimento

#### Create message record
```
POST /mensagens
Body: { para_id, para_nome, canal, assunto, corpo, status, remetente, enviado_em }
```
**Authorization:** admin, superadmin, atendimento

---

### 2.8 Configuracoes

#### Get configuration section
```
GET /configuracoes?secao=eq.academia&select=dados
```
**Authorization:** Any authenticated user can SELECT; only admin/superadmin can INSERT/UPDATE (RLS)

#### Upsert configuration
```
POST /configuracoes (onConflict: secao)
Body: { secao, dados: {...}, updated_at, updated_by }
```
**Authorization:** admin, superadmin (RLS)

---

## 3. Edge Functions

Base URL: `https://yrfdxocwhztokadzxtto.supabase.co/functions/v1`

Authentication: `Authorization: Bearer <jwt>` + `apikey: <anon-key>`

### 3.1 `invite-staff`

**Purpose:** Creates a Supabase Auth user for a new staff member and sends invitation email.

```
POST /invite-staff
Authorization: Bearer {admin-jwt}
Content-Type: application/json

Body:
{
  "email": "staff@gbbraga.com",
  "nome": "João Silva",
  "role": "professor"
}
```

**Response (200):**
```json
{ "success": true, "userId": "uuid" }
```

**Response (400/500):**
```json
{ "error": "Email already registered" }
```

**Flow:**
1. Verifies caller is admin/superadmin
2. Creates user via `supabase.auth.admin.inviteUserByEmail()`
3. User metadata set with `{ nome, role }`
4. Trigger `on_auth_user_created` creates profile
5. User receives invitation email

---

### 3.2 `send-email`

**Purpose:** Sends transactional email via SMTP or Resend API.

```
POST /send-email
Authorization: Bearer {admin-jwt}
Content-Type: application/json

Body:
{
  "to": "aluno@email.com",
  "toName": "João Aluno",
  "subject": "Bem-vindo à GB Braga",
  "html": "<p>Olá João...</p>",
  "text": "Olá João..."
}
```

**Response (200):**
```json
{ "success": true, "messageId": "..." }
```

**SMTP path:** Reads SMTP config from `configuracoes` (secao='email')  
**Resend path:** Triggered when `smtpPass.startsWith('re_')` — uses Resend REST API  

---

## 4. Vercel Serverless — Stripe Webhook

### `POST /api/stripe-webhook`

**Purpose:** Processes Stripe payment events to update payment records.

**Authentication:** Stripe signature verification via `STRIPE_WEBHOOK_SECRET`

**Headers required:**
- `stripe-signature: t=...,v1=...`

**Events handled:**
| Event | Action |
|---|---|
| `payment_intent.succeeded` | Update pagamento status → 'pago', set data_pagamento |
| `payment_intent.payment_failed` | Update status → 'vencido' |
| `invoice.paid` | Create/update payment record |
| `invoice.payment_failed` | Update status → 'vencido' |
| `customer.subscription.deleted` | Update aluno status → 'inativo' |

**Response (200):** `{ received: true }`  
**Response (400):** Signature mismatch — reject  

---

## 5. Supabase Database Functions (RPC)

### `auth_role()`

Returns the current user's role from profiles.

```typescript
const { data } = await supabase.rpc('auth_role');
// Returns: 'admin' | 'superadmin' | ... | null
```

### `my_aluno_id()`

Returns the current user's aluno ID.

```typescript
const { data } = await supabase.rpc('my_aluno_id');
// Returns: UUID | null
```

### `calcular_frequencia(aluno_id, meses?)`

Calculates attendance percentage for a student.

```typescript
const { data } = await supabase.rpc('calcular_frequencia', {
  p_aluno_id: '...',
  p_meses: 3  // optional, default 3
});
// Returns: 0-100
```

---

## 6. Error Responses

All Supabase API errors follow the format:
```json
{
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy"
}
```

Common error codes:
| Code | Meaning |
|---|---|
| 42501 | RLS violation — user lacks permission |
| 23505 | Unique constraint violation (duplicate email) |
| 23503 | Foreign key violation |
| PGRST116 | Row not found (maybeSingle returned null) |
