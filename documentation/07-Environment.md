# 07 — Environment Variables

**Gracie Barra Braga — Configuration Reference**

---

## 1. Overview

Environment variables are split into two categories:
- **`VITE_` prefix** — exposed to the browser bundle (public, non-secret)
- **No prefix** — server-side only (never sent to client)

The `.env.local` file is used for local development and is git-ignored.  
Production values are set in Vercel Dashboard → Project Settings → Environment Variables.

---

## 2. Required Variables

### 2.1 Supabase

| Variable | Prefix | Required | Secret | Description |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | VITE_ | YES | NO | Supabase project REST URL. Format: `https://<project-id>.supabase.co` |
| `VITE_SUPABASE_ANON` | VITE_ | YES | NO | Supabase anonymous/public JWT key. Safe to expose in frontend — RLS enforces access control |
| `SUPABASE_SERVICE_KEY` | — | YES (backend only) | YES | Supabase service role key. Bypasses RLS. **NEVER expose in frontend bundle** |

**Production values:**
- URL: `https://yrfdxocwhztokadzxtto.supabase.co`
- Project region: eu-west-1 (Ireland)

---

### 2.2 Stripe

| Variable | Prefix | Required | Secret | Description |
|---|---|---|---|---|
| `VITE_STRIPE_PUBLIC_KEY` | VITE_ | YES | NO | Stripe publishable key. Used in browser for Stripe.js payment elements |
| `STRIPE_SECRET_KEY` | — | YES | YES | Stripe secret key. Used only in `/api/stripe-webhook` serverless function |
| `STRIPE_WEBHOOK_SECRET` | — | YES | YES | Stripe webhook signing secret. Used to verify webhook authenticity |

**Format examples:**
- `VITE_STRIPE_PUBLIC_KEY=pk_live_...` (production) / `pk_test_...` (test)
- `STRIPE_SECRET_KEY=sk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 3. Optional Variables

### 3.1 WhatsApp Business

| Variable | Required | Description |
|---|---|---|
| `META_WHATSAPP_TOKEN` | NO | Meta Business API access token (Bearer). Required for WhatsApp messaging module |
| `META_PHONE_ID` | NO | Meta Business phone number ID. Required for WhatsApp messaging |

---

### 3.2 TOConline (Portuguese Fiscal)

| Variable | Required | Description |
|---|---|---|
| `TOCONLINE_CLIENT_ID` | NO | OAuth2 client ID for TOConline API |
| `TOCONLINE_CLIENT_SECRET` | NO | OAuth2 client secret for TOConline API |

TOConline is configured at runtime via the Integrações page (stored in `configuracoes` table), so these env vars are optional — the DB-stored config takes precedence.

---

## 4. Email Configuration (Runtime)

Email settings are **not** stored in environment variables but in the `configuracoes` table (secao='email') via the Config → Email section in the admin interface.

| Config Key | Description |
|---|---|
| Servidor SMTP | SMTP host (e.g. smtp.gmail.com) |
| Porta | SMTP port (typically 587 or 465) |
| Email remetente | From address |
| Password | SMTP password OR Resend API key (if starts with `re_`) |

**Recommendation:** Use Resend API key (`re_...`) — avoids SMTP/SPF/DKIM issues with Gmail.

---

## 5. Security Classification

| Level | Variables | Rule |
|---|---|---|
| Public | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON`, `VITE_STRIPE_PUBLIC_KEY` | Safe in browser. RLS and Stripe's server-side verification provide security |
| Backend Secret | `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Set ONLY in Vercel environment. Never in Vite config or frontend code |
| API Tokens | `META_WHATSAPP_TOKEN`, `TOCONLINE_CLIENT_*` | Backend only. Rotate if compromised |

---

## 6. Demo Mode

If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON` is missing/placeholder, the app automatically enters **Demo Mode**:
- Uses `mockData.ts` for user accounts
- No database connection
- No persistence between sessions
- All five roles accessible via the role switcher on the login page

This is checked via `isConfigured` in `supabaseClient.ts`.

---

## 7. Production Checklist

- [ ] `VITE_SUPABASE_URL` set to production project URL
- [ ] `VITE_SUPABASE_ANON` set to production anon key
- [ ] `SUPABASE_SERVICE_KEY` set (Vercel only, not in frontend)
- [ ] `VITE_STRIPE_PUBLIC_KEY` set to `pk_live_...`
- [ ] `STRIPE_SECRET_KEY` set to `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET` configured and webhook registered in Stripe Dashboard
- [ ] Email configured in Config → Email (Resend API key recommended)
- [ ] `.env.local` is in `.gitignore` (it is — verified)
- [ ] No secrets committed to git history
