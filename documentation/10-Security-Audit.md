# 10 — Security Audit

**Gracie Barra Braga — Security Assessment**  
Date: 2026-06-13

---

## Executive Summary

| Category | Score | Status |
|---|---|---|
| Authentication | 8/10 | Good |
| Authorization (RLS) | 9/10 | Very Good |
| Transport Security | 9/10 | Very Good |
| Input Validation | 5/10 | Needs Improvement |
| Secrets Management | 7/10 | Good |
| Dependency Security | 7/10 | Good |
| Client-Side Security | 8/10 | Good |
| **Overall** | **7.6/10** | **Good — Launch Ready with Fixes** |

---

## 1. Authentication

### 1.1 Supabase Auth (JWT)

**Status: GOOD**

- JWT tokens issued by Supabase Auth (HS256)
- Session managed by `supabase-js` client with automatic refresh
- Tokens stored in `localStorage` by default (Supabase default)
- `onAuthStateChange` correctly handles session lifecycle

**Finding SEC-001 — LOW RISK**  
JWT stored in `localStorage` is accessible to JavaScript (XSS risk). However, since the app has no user-generated HTML injection paths and React's built-in JSX escaping prevents reflected XSS, this risk is mitigated in practice. No action required unless XSS vectors are added.

**Finding SEC-002 — LOW RISK**  
Demo mode (`!isConfigured`) uses mock users without any credential verification. This is intentional for development. Ensure the production build always has `VITE_SUPABASE_URL` set.

### 1.2 Password Reset / Staff Invite

**Status: GOOD**

- Staff invite uses Supabase's password recovery flow (secure email link)
- `PASSWORD_RECOVERY` event correctly intercepted to show `SetPasswordScreen`
- `completePasswordSetup` uses `supabase.auth.updateUser()` — correct approach
- Password minimum length: 6 characters (acceptable; consider increasing to 8)

**Finding SEC-003 — LOW RISK**  
Minimum password length is 6 characters. Recommend increasing to 8 minimum in Supabase Auth settings (Dashboard → Auth → Password settings).

---

## 2. Authorization

### 2.1 Row Level Security (RLS)

**Status: VERY GOOD**

All user-facing tables have RLS enabled. The `auth_role()` SECURITY DEFINER function correctly reads the caller's role without triggering recursive RLS policy evaluation.

| Table | RLS | Policies |
|---|---|---|
| profiles | ✅ | SELECT: own/admin; UPDATE: own/admin; INSERT: admin |
| alunos | ✅ | SELECT: own email/staff; ALL: admin; INSERT: self-enrollment |
| pagamentos | ✅ | SELECT: own aluno/admin; ALL: admin |
| presencas | ✅ | SELECT: own/staff; INSERT: staff |
| contratos | ✅ | SELECT: own/admin; ALL: admin; INSERT: self-enrollment |
| mensagens | ✅ | ALL: admin/superadmin/atendimento |
| toc_documentos | ✅ | SELECT: admin; SELECT: own aluno |
| pedidos_numerario | ✅ | ALL: superadmin; SELECT: admin/atendimento |
| turmas | ❌ | **No RLS found in schema** |
| planos | ❌ | **No RLS — intentional (public read)** |
| configuracoes | ❌ | **No RLS found in schema** |
| templates_mensagem | ❓ | Created via migration — verify RLS enabled |
| access_logs | ❓ | No RLS in schema — should be admin-only |

**Finding SEC-004 — HIGH RISK**  
`turmas` table has no RLS. Authenticated users can read all turmas (acceptable) but also potentially INSERT/UPDATE/DELETE. Add RLS:
```sql
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff gere turmas" ON turmas FOR ALL
  USING (auth_role() IN ('admin','superadmin','atendimento','professor'));
CREATE POLICY "Todos veem turmas" ON turmas FOR SELECT USING (TRUE);
```

**Finding SEC-005 — HIGH RISK**  
`configuracoes` table has no RLS. Any authenticated user could modify module settings or SMTP credentials. Add RLS:
```sql
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin gere config" ON configuracoes FOR ALL
  USING (auth_role() = 'superadmin');
CREATE POLICY "Admin lê config" ON configuracoes FOR SELECT
  USING (auth_role() IN ('admin','superadmin'));
```

**Finding SEC-006 — MEDIUM RISK**  
`access_logs` table has no RLS. Access logs should be readable only by admin/superadmin:
```sql
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin vê logs" ON access_logs FOR SELECT
  USING (auth_role() IN ('admin','superadmin'));
CREATE POLICY "Sistema insere logs" ON access_logs FOR INSERT
  WITH CHECK (TRUE);
```

### 2.2 Frontend Route Authorization

**Status: GOOD**

`PAGE_ROLES` map correctly restricts which roles see which pages. `canAccess()` is called both on navigation (`handleNavigate`) and on render (`safePage`). The `safePage` redirect prevents URL manipulation from bypassing authorization.

**Finding SEC-007 — LOW RISK**  
`canAccessModule()` currently passes any unknown page as active (`isActive(page)` returns `true` for unknown IDs via `modulos[id] !== false`). This is correct for pages without corresponding modules but could be tightened to explicitly only check known module IDs.

---

## 3. Transport Security

### 3.1 HTTPS

**Status: VERY GOOD**

Vercel enforces HTTPS on all routes. `vercel.json` includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

**Finding SEC-008 — LOW RISK**  
`Content-Security-Policy` header is not configured. Add to `vercel.json`:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://api.resend.com https://api.stripe.com;"
}
```

**Finding SEC-009 — LOW RISK**  
`Strict-Transport-Security` (HSTS) header is not configured. Add:
```json
{ "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
```

---

## 4. Input Validation

### 4.1 Client-Side Validation

**Status: NEEDS IMPROVEMENT**

**Finding SEC-010 — MEDIUM RISK**  
Email inputs in enrollment and staff creation lack format validation beyond browser default. Add explicit regex validation before submission:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) setError('Email inválido');
```

**Finding SEC-011 — MEDIUM RISK**  
The GPS fence configuration accepts arbitrary numeric input for latitude/longitude with no range validation. Add:
```typescript
if (lat < -90 || lat > 90) throw new Error('Latitude inválida');
if (lng < -180 || lng > 180) throw new Error('Longitude inválida');
```

**Finding SEC-012 — LOW RISK**  
`corpo` (message body) in ComunicacaoPage has no length limit. Large payloads could slow the Edge Function. Add `maxLength={10000}` on textarea.

### 4.2 Server-Side Validation

Supabase column constraints provide basic validation:
- `role`: ENUM constraint
- `grau`: CHECK (0–4)
- `categoria`: CHECK constraint on planos

No application-level sanitization is needed because Supabase uses parameterized queries (preventing SQL injection).

---

## 5. Secrets Management

### 5.1 Environment Variables

**Status: GOOD**

- `VITE_` prefix correctly separates public from private variables
- `.env.local` is git-ignored
- Service key documented as "NEVER expose in frontend"

**Finding SEC-013 — HIGH RISK**  
The `.env.local` file exists in the repository directory and **must not** be committed. Verify with `git status` that it's tracked as untracked. Add `.env.local` to `.gitignore` (already present in template).

**Finding SEC-014 — MEDIUM RISK**  
SMTP password / Resend API key is stored in the `configuracoes` table in plaintext (JSONB `dados` field). While protected by RLS (superadmin only), consider encrypting sensitive config values using `pgcrypto`.

### 5.2 Supabase Storage

**Status: GOOD**

Avatar bucket uses Supabase Storage with RLS. Users can only access their own avatar path (`avatars/{user_id}/`).

---

## 6. Dependency Vulnerabilities

### 6.1 Current Dependencies

Run audit with: `npm audit`

| Package | Version | Known Issues |
|---|---|---|
| `@supabase/supabase-js` | 2.45.4 | None known |
| `react` | 19.2.5 | None known |
| `jspdf` | 4.2.1 | Monitor for XSS in PDF content |
| `vite` | 8.0.10 | None known |
| `vite-plugin-pwa` | 1.3.0 | None known |

**Finding SEC-015 — LOW RISK**  
`jsPDF` renders user-supplied data into PDFs. Ensure contract content is sanitized before PDF generation. Currently, contract data comes from form inputs — verify no HTML injection is possible.

### 6.2 Recommendations

```bash
# Run regularly (monthly or before each deployment)
npm audit
npm audit fix

# Check for outdated packages
npm outdated
```

---

## 7. Client-Side Security

### 7.1 XSS Prevention

**Status: GOOD**

React's JSX rendering automatically escapes all string values. No use of `dangerouslySetInnerHTML` found in codebase.

### 7.2 CSRF Protection

**Status: GOOD**

Supabase uses JWT Bearer tokens in Authorization headers (not cookies), making CSRF attacks ineffective. The Stripe webhook uses `STRIPE_WEBHOOK_SECRET` signature verification.

### 7.3 Clickjacking

**Status: GOOD**

`X-Frame-Options: DENY` prevents embedding in iframes.

---

## 8. GPS / Geolocation Security

**Finding SEC-016 — LOW RISK**  
The GPS check-in distance is validated client-side in `MeuCheckin.tsx`. A sophisticated user could spoof GPS coordinates via browser dev tools or mock APIs. For higher security:
- Consider server-side validation (Edge Function that checks GPS coordinates)
- Add anomaly detection (check-ins from impossible locations)

Currently, the GPS check-in is a convenience feature, not a strict security gate — this risk level is acceptable.

---

## 9. Data Privacy (GDPR)

**Status: COMPLIANT**

- `aceita_rgpd` consent field stored in contracts
- `aceita_imagem` (image rights) consent stored
- Personal data stored in EU region (Supabase eu-west-1 / Ireland)
- NIF (tax ID) stored but protected by RLS

**Finding SEC-017 — MEDIUM RISK**  
No data retention policy implemented. GDPR Article 17 (right to erasure) requires a mechanism to delete student data on request. Currently, deleting a `profiles` row CASCADE deletes `alunos` and related data — but a formal process should be documented and tested.

---

## 10. Summary of Findings

| ID | Severity | Title | Status |
|---|---|---|---|
| SEC-001 | LOW | JWT in localStorage | Accept |
| SEC-002 | LOW | Demo mode no auth | Accept |
| SEC-003 | LOW | Password min 6 chars | Fix |
| SEC-004 | HIGH | turmas table no RLS | **Fix immediately** |
| SEC-005 | HIGH | configuracoes table no RLS | **Fix immediately** |
| SEC-006 | MEDIUM | access_logs no RLS | Fix before launch |
| SEC-007 | LOW | canAccessModule loose check | Accept |
| SEC-008 | LOW | No CSP header | Fix before launch |
| SEC-009 | LOW | No HSTS header | Fix before launch |
| SEC-010 | MEDIUM | Email format validation | Fix before launch |
| SEC-011 | MEDIUM | GPS input no range check | Fix before launch |
| SEC-012 | LOW | Message body no length limit | Fix |
| SEC-013 | HIGH | .env.local not in git | Verify |
| SEC-014 | MEDIUM | SMTP password in plaintext DB | Accept (RLS protected) |
| SEC-015 | LOW | jsPDF XSS risk | Monitor |
| SEC-016 | LOW | Client-side GPS spoofing | Accept |
| SEC-017 | MEDIUM | No GDPR erasure process | Document |

---

## 11. Priority Fixes

### Immediate (before launch)

1. **Add RLS to `turmas` table** (SEC-004)
2. **Add RLS to `configuracoes` table** (SEC-005)
3. **Verify `.env.local` not in git** (SEC-013)

### Pre-launch

4. Add RLS to `access_logs` (SEC-006)
5. Add CSP header to `vercel.json` (SEC-008)
6. Add HSTS header (SEC-009)
7. Add email format validation (SEC-010)
8. Add GPS coordinate range validation (SEC-011)

### Post-launch

9. Increase password minimum to 8 chars (SEC-003)
10. Document GDPR erasure process (SEC-017)
