# 09 — Deployment Guide

**Gracie Barra Braga — Production Deployment**

Custo mensal estimado: €0–15/mês até 500 alunos. Tempo estimado para ir ao ar (projeto novo): 1 dia técnico + 1 dia de configuração.

---

## 1. Architecture

| Component | Platform | Region |
|---|---|---|
| Frontend (SPA/PWA) | Vercel | Auto (CDN) |
| Database | Supabase | eu-west-1 (Ireland) |
| Edge Functions | Supabase Deno Runtime | eu-west-1 |
| File Storage | Supabase Storage | eu-west-1 |
| Payments Webhook | Vercel Serverless | Auto |
| Domain | app.gbbraga.com | — |

---

## 2. Vercel Deployment

### 2.1 Automatic Deployment (Current Setup)

Every push to the `main` branch triggers an automatic Vercel deployment.

**Repository:** `cjbusquet/gb-braga-app`  
**Framework:** Vite (detected automatically)  
**Build command:** `npm run build`  
**Output directory:** `dist`

### 2.2 Environment Variables in Vercel

Navigate to: Vercel Dashboard → Project → Settings → Environment Variables

**Required:**
```
VITE_SUPABASE_URL          = https://yrfdxocwhztokadzxtto.supabase.co
VITE_SUPABASE_ANON         = <anon-key>
VITE_STRIPE_PUBLIC_KEY     = pk_live_...
STRIPE_SECRET_KEY          = sk_live_...
STRIPE_WEBHOOK_SECRET      = whsec_...
SUPABASE_SERVICE_KEY       = <service-role-key>
```

Set variables for **Production** environment (not Preview/Development unless needed).

### 2.3 Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add `app.gbbraga.com`
3. Configure DNS at registrar:
   ```
   CNAME  app  cname.vercel-dns.com
   ```
4. Vercel auto-provisions SSL certificate (Let's Encrypt)

### 2.4 Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## 3. Supabase Configuration

### 3.1 Auth Settings

Supabase Dashboard → Authentication → Settings:

| Setting | Value |
|---|---|
| Site URL | `https://app.gbbraga.com` |
| Redirect URLs | `https://app.gbbraga.com/**` |
| Email confirmation | Disable (for immediate access) |
| Password minimum length | 8 (recommended) |
| JWT expiry | 3600 seconds (1 hour) |

### 3.2 Email Templates

Supabase Dashboard → Authentication → Email Templates:

**Invite User Template:**
```html
<h2>Convite para a equipa GB Braga</h2>
<p>Foi adicionado à plataforma Gracie Barra Braga.</p>
<p>Clique no link abaixo para definir a sua password:</p>
<a href="{{ .ConfirmationURL }}">Definir Password →</a>
```

**Password Reset Template:**
```html
<h2>Repor Password — GB Braga</h2>
<p>Clique no link abaixo para definir uma nova password:</p>
<a href="{{ .ConfirmationURL }}">Repor Password →</a>
<p>Se não solicitou isto, ignore este email.</p>
```

### 3.3 Database Schema

Apply the full schema on a fresh project:
```bash
# Via Supabase CLI
supabase db push

# Or manually via SQL Editor
# Copy contents of supabase/schema.sql and run in SQL Editor
```

Apply incremental patches in order:
```bash
supabase/patches/01_enrollment_rls.sql
supabase/patches/02_profile_self_create.sql
```

### 3.4 Storage Buckets

Create `avatars` bucket:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);

-- RLS for avatars
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3.5 Edge Functions Deployment

```bash
# Link to project
supabase link --project-ref yrfdxocwhztokadzxtto

# Deploy all functions
supabase functions deploy invite-staff
supabase functions deploy send-email
```

No `supabase secrets set` step is needed for email — `send-email` reads its
SMTP/Resend credentials from the `configuracoes` table (`secao='email'`) at
request time, not from function secrets/env vars. Configure them via
**Admin → Config → Email** in the app after deploying (see §5.2 below). This
means the same deployed function works without redeploying if credentials
change — just update the row in the DB.

---

## 4. Stripe Configuration

### 4.1 Webhook Registration

Stripe Dashboard → Developers → Webhooks → Add Endpoint:
- URL: `https://app.gbbraga.com/api/stripe-webhook`
- Events to listen:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4.2 Plans in Stripe

Create products and prices matching the `planos` table:
- Product: "Jiu-Jitsu Adulto Plus" → Price: €62/month recurring
- Update `stripe_price_id_live` in the `planos` table for each plan

---

## 5. Resend Email (Recommended)

### 5.1 Setup

1. Create account at https://resend.com
2. Add domain `gbbraga.com` → Domains → Add Domain
3. Add DNS records at registrar:
   ```
   TXT    resend._domainkey    <provided DKIM record>
   TXT    @                    v=spf1 include:resend.com ~all
   ```
4. Wait for verification (5-60 minutes)
5. Create API key → copy `re_...` key

### 5.2 Configure in App

Admin → Config → Email:
- **Password field:** paste the `re_xxxx` API key
- **Email remetente:** `noreply@gbbraga.com`
- The `send-email` Edge Function auto-detects Resend keys by `re_` prefix

---

## 6. Deployment Checklist

### Pre-deployment

- [ ] Run `npm run typecheck` — 0 errors
- [ ] Run `npm run build` — successful
- [ ] All environment variables set in Vercel
- [ ] Supabase schema fully applied (including all patches in `supabase/patches/`, in order)
- [ ] Avatars bucket created with correct policies
- [ ] Edge Functions deployed: `invite-staff`, `send-email`
- [ ] Stripe webhook registered
- [ ] Resend domain verified + API key configured in Config
- [ ] Custom domain configured and SSL active
- [ ] Supabase Auth redirect URL set to production URL

### Post-deployment Validation

- [ ] Login with each role (superadmin, admin, professor, aluno)
- [ ] GPS check-in works from academy location
- [ ] Email sending works (test from Comunicação page)
- [ ] Avatar upload and display works
- [ ] Module toggle propagates in real-time
- [ ] PWA installs on mobile (Add to Home Screen)
- [ ] Back button navigates within app on mobile
- [ ] Stripe payment flow works (use test mode first)

---

## 7. Monitoring

### 7.1 Vercel

- Vercel Dashboard → Analytics (Core Web Vitals)
- Vercel Dashboard → Functions → Logs (webhook errors)
- Set up Slack notifications for failed deployments

### 7.2 Supabase

- Supabase Dashboard → Database → Advisors (performance alerts)
- Supabase Dashboard → Logs → API Logs
- Monitor Edge Function logs after each send-email call

### 7.3 Uptime Monitoring

Recommended: Configure an uptime monitor (UptimeRobot, Better Uptime) for:
- `https://app.gbbraga.com` — ping every 5 minutes
- Alert via email/SMS on downtime

---

## 8. Rollback Procedure

### Frontend Rollback

Vercel maintains all previous deployments:
1. Vercel Dashboard → Deployments
2. Find last stable deployment
3. Click "..." → "Promote to Production"

**Rollback completes in ~30 seconds.**

### Database Rollback

Supabase Pro provides PITR (Point-in-Time Recovery):
1. Supabase Dashboard → Database → Backups
2. Select restore point
3. Or: use `supabase db pull` to capture current state before risky migrations

**Always run migrations in a Supabase branch before applying to production.**

---

## 9. Scaling Considerations

The current architecture handles up to approximately:
- **5,000 MAU** (Monthly Active Users) on Supabase Pro
- **100k Realtime messages/month** on Supabase Pro
- **Vercel:** unlimited bandwidth on Pro plan

For growth beyond this:
1. Enable Supabase read replicas for heavy reporting queries
2. Add database connection pooling (PgBouncer — included in Supabase)
3. Materialize `v_kpis` view with pg_cron refresh
4. Consider caching layer (Redis/Upstash) for frequently-read configuracoes
