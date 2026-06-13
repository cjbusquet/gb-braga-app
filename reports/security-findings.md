# Security Findings Report

**GB Braga Platform — Security Assessment**  
Date: 2026-06-13

---

## Critical Findings

### CRIT-1: `turmas` Table Has No RLS
**OWASP:** A01:2021 - Broken Access Control  
**Impact:** Any authenticated user can INSERT/UPDATE/DELETE class schedules  

**Remediation:**
```sql
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos veem turmas" ON turmas FOR SELECT USING (TRUE);
CREATE POLICY "Staff gere turmas" ON turmas FOR ALL
  USING (auth_role() IN ('admin','superadmin','atendimento','professor'));
```

---

### CRIT-2: `configuracoes` Table Has No RLS
**OWASP:** A01:2021 - Broken Access Control  
**Impact:** Any authenticated user can modify SMTP passwords, GPS fence, module states  

**Remediation:**
```sql
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin gere config" ON configuracoes FOR ALL
  USING (auth_role() = 'superadmin');
CREATE POLICY "Admin lê config" ON configuracoes FOR SELECT
  USING (auth_role() IN ('admin','superadmin'));
```

---

### CRIT-3: Alunos Cannot Insert Own Presences
**OWASP:** A01:2021 - Broken Access Control (Feature Gap)  
**Impact:** GPS check-in feature silently fails for all student users  

**Remediation:**
```sql
CREATE POLICY "Aluno regista presença própria" ON presencas
  FOR INSERT
  WITH CHECK (aluno_id = my_aluno_id());
```

---

### CRIT-4: `belt_type` Enum Incomplete
**OWASP:** A08:2021 - Software and Data Integrity Failures  
**Impact:** Kids belt graduations fail at database level with constraint violation  

**Remediation:**
```sql
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'cinza-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'amarela-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'laranja-preta';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-branca';
ALTER TYPE belt_type ADD VALUE IF NOT EXISTS 'verde-preta';
```

---

## Medium Findings

### MED-1: Missing Content Security Policy Header
**OWASP:** A05:2021 - Security Misconfiguration  
Add to `vercel.json` headers array:
```json
{ "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.resend.com;" }
```

### MED-2: Missing HSTS Header
```json
{ "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
```

### MED-3: Email Validation Missing on Forms
Add regex validation to enrollment and staff creation forms.

### MED-4: GPS Coordinates Lack Range Validation
Add: `if (lat < -90 || lat > 90) throw new Error('Latitude inválida');`

### MED-5: SMTP Credentials in Plaintext JSONB
SMTP/Resend API key stored in `configuracoes.dados` — protected by RLS (superadmin only) but not encrypted at rest.

### MED-6: No GDPR Erasure Process
Document and implement a formal process for student data deletion on request (GDPR Article 17).

---

## Low Findings

### LOW-1: Password Minimum 6 Characters
Recommend increasing to 8 in Supabase Auth settings.

### LOW-2: access_logs Table Has No RLS
Audit logs should be restricted to admin/superadmin.

### LOW-3: Message Body No Length Limit
Add `maxLength={10000}` on message body textarea.

### LOW-4: GPS Check-in Client-Side Only
GPS coordinates could be spoofed via browser DevTools. Acceptable risk for current feature maturity.

### LOW-5: console.error/warn in Production Bundle
Replace with environment-gated logger utility.

---

## Accepted Risks

| Risk | Reason |
|---|---|
| JWT in localStorage | No user-generated HTML; React escaping prevents XSS |
| Demo mode no auth | Development only; production always has Supabase URL |
| Client-side GPS | Convenience feature, not a security gate |

---

## Remediation Timeline

| Finding | Severity | Hours | Assigned |
|---|---|---|---|
| CRIT-1: turmas RLS | Critical | 0.1 | DBA |
| CRIT-2: configuracoes RLS | Critical | 0.1 | DBA |
| CRIT-3: presencas INSERT policy | Critical | 0.1 | DBA |
| CRIT-4: belt_type enum | Critical | 0.2 | DBA |
| MED-1: CSP header | Medium | 0.5 | DevOps |
| MED-2: HSTS | Medium | 0.1 | DevOps |
| MED-3: Email validation | Medium | 1.0 | Dev |
| MED-4: GPS validation | Medium | 0.5 | Dev |
| LOW-2: access_logs RLS | Low | 0.2 | DBA |
| **Total** | | **~2.8h** | |
