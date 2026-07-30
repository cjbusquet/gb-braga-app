# Graph Report - .  (2026-07-30)

## Corpus Check
- 99 files · ~115,458 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 770 nodes · 1629 edges · 43 communities (38 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Shell & Data Hooks
- Billing & Notifications Backend
- Layout & Module Docs
- Kiosk & Mock Data
- ESLint Tooling Config
- Migration Plan & Architecture
- Logo & Enrollment Flow
- NPM Dependencies
- Config Page & GPS Haversine
- React Query Data Layer
- Environment Variables
- TypeScript App Config
- Vite/Node TS Config
- Supabase Client & TS Config
- Code Quality Rationale Notes
- Recommendations & CI/CD
- Security Audit (RLS Gaps)
- Authorization Architecture
- RLS Integration Fixes
- Security Findings & Headers
- Code Review Findings
- Integrations Log Page
- GPS Check-in (Aluno)
- Test Strategy Plan
- Test Coverage Gaps
- Belt Progression & Graduation
- Config Store & ADRs
- Database Indexing
- Belt Type / Checkin Bugs
- E2E Test Journeys
- Icon Sprite Set
- Vercel Deployment Config
- Belt Type Enum Fix
- Supabase DB Types
- GPS Fence Coverage Gap
- API Edge Function (CORS)
- Setup Script
- Env Validation Script
- GB Favicon
- GB Logo Asset

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 41 edges
2. `useAlunos()` - 41 edges
3. `useMobile()` - 31 edges
4. `03 - Module Documentation` - 28 edges
5. `Recommendations Report` - 23 edges
6. `GB` - 22 edges
7. `MeuCheckin()` - 22 edges
8. `06 - Database Documentation` - 22 edges
9. `01 - Architecture` - 21 edges
10. `alunos table (student records)` - 21 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --conceptually_related_to--> `Stripe Payment Flow`  [INFERRED]
  api/stripe-webhook.ts → documentation/02-System-Overview.md
- `ADR-003 History API for PWA Navigation (back button)` --conceptually_related_to--> `PAGE_ROLES`  [INFERRED]
  documentation/19-Developer-Manual.md → src/App.tsx
- `ComunicacaoPage()` --conceptually_related_to--> `Email Communication Workflow`  [INFERRED]
  src/pages/admin/ComunicacaoPage.tsx → documentation/02-System-Overview.md
- `Stripe env vars (VITE_STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)` --shares_data_with--> `handler()`  [EXTRACTED]
  documentation/07-Environment.md → api/stripe-webhook.ts
- `PERF-002 Large page components not code-split` --conceptually_related_to--> `PAGE_ROLES`  [INFERRED]
  documentation/11-Performance-Audit.md → src/App.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three-layer authorization enforcement (frontend routing, DB RLS, module system)** — src_app_canaccess, src_app_canaccessmodule, documentation_06_database_auth_role_fn, src_lib_usemodulos_usemodulos [EXTRACTED 0.90]
- **GPS self-check-in flow (aluno) spanning frontend, DB, config, and known blocking bug** — src_pages_aluno_meucheckin_meucheckin, documentation_06_database_presencas, documentation_06_database_configuracoes, documentation_14_launch_report_block_3, documentation_02_system_overview_workflow_gps_checkin [EXTRACTED 0.90]
- **Launch-blocking RLS/schema fixes tying security audit findings to code review findings and go/no-go verdict** — documentation_14_launch_report_block_1, documentation_14_launch_report_block_2, documentation_14_launch_report_block_3, documentation_14_launch_report_block_4, documentation_14_launch_report_verdict [EXTRACTED 0.95]
- **GPS Check-in Feature: E2E Journey, Coverage Gap, Security Fix, Duplicated Code, Unit Tests** — qa_e2e_tests_gps_checkin_journey, qa_coverage_report_gps_fence_calculation, reports_security_findings_crit_3_presencas_insert, src_pages_aluno_meucheckin_haversinem, qa_unit_tests_geo_haversine_tests [INFERRED 0.85]
- **Performance Optimization Plan Across Reports** — reports_performance_bundle_optimization, reports_performance_db_indexes, reports_recommendations_lazy_load_jspdf, reports_recommendations_db_indexes, reports_recommendations_memoize_computations [INFERRED 0.85]
- **RLS Security Remediation: Critical Findings and their Fixes** — reports_security_findings_crit_1_turmas_rls, reports_security_findings_crit_2_configuracoes_rls, reports_security_findings_crit_3_presencas_insert, reports_recommendations_fix_1_turmas_rls, reports_recommendations_fix_2_configuracoes_rls [INFERRED 0.85]

## Communities (43 total, 5 thin omitted)

### Community 0 - "App Shell & Data Hooks"
Cohesion: 0.05
Nodes (86): 04 - Component Documentation, PERF-003 No pagination on data hooks (Critical at scale), CR-007 useData.ts fetches all records without pagination (Medium), CR-011 any types used in multiple files (Medium), App(), queryClient, SetPasswordScreen(), Layout() (+78 more)

### Community 1 - "Billing & Notifications Backend"
Cohesion: 0.06
Nodes (59): communicateWithAT(), config, emitirFatura(), handler(), InvoiceResult, notificarWhatsApp(), stripe, supabase (+51 more)

### Community 2 - "Layout & Module Docs"
Cohesion: 0.06
Nodes (40): 03 - Module Documentation, BOTTOM_NAV, HeroIcon, LayoutProps, NAV_ITEMS, NavItem, mockUsers, AuthContext (+32 more)

### Community 3 - "Kiosk & Mock Data"
Cohesion: 0.06
Nodes (39): QR Code Check-in (Kiosk Mode), ACADEMIA, beltColors, defaultTocConfig, mockAlunos, mockContratos, mockGraduacoes, mockKPIs (+31 more)

### Community 4 - "ESLint Tooling Config"
Cohesion: 0.05
Nodes (39): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, author, description, devDependencies (+31 more)

### Community 5 - "Migration Plan & Architecture"
Cohesion: 0.09
Nodes (36): GB Braga Plano de Migracao para Producao, Authentication Flow (signInWithPassword + RLS profile fetch), Deno Runtime (Supabase Edge Functions), 01 - Architecture, jsPDF (PDF generation), PostgreSQL 15, React 19 (Frontend Framework), Request Lifecycle (Service Worker -> React -> Supabase) (+28 more)

### Community 6 - "Logo & Enrollment Flow"
Cohesion: 0.07
Nodes (25): GBLogo(), GBLogoFull(), GBLogoProps, usePlanos(), AccountStatus, BTN, BTN2, CARD (+17 more)

### Community 7 - "NPM Dependencies"
Cohesion: 0.08
Nodes (23): @heroicons/react, jspdf, dependencies, @heroicons/react, jspdf, react, react-dom, @supabase/supabase-js (+15 more)

### Community 8 - "Config Page & GPS Haversine"
Cohesion: 0.09
Nodes (21): haversineM Duplication (rationale: same formula in MeuCheckin.tsx and ConfigPage.tsx, should extract to src/lib/geo.ts), AcademiaSection(), defaultStripe, haversineM(), PLANOS_STRIPE, ROLE_BADGE, Section, SECTIONS (+13 more)

### Community 9 - "React Query Data Layer"
Cohesion: 0.14
Nodes (22): QUERY_KEYS, useAlunosQuery(), useInvalidateAlunos(), mapAluno(), mapVinculo(), useResponsaveis(), AlunosPage(), calcularIdade() (+14 more)

### Community 10 - "Environment Variables"
Cohesion: 0.09
Nodes (20): Meta WhatsApp Business API, Demo Mode (mockData.ts fallback when Supabase not configured), 07 - Environment Variables, Stripe env vars (VITE_STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET), Supabase env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON, SUPABASE_SERVICE_KEY), TOConline env vars (TOCONLINE_CLIENT_ID, TOCONLINE_CLIENT_SECRET), WhatsApp env vars (META_WHATSAPP_TOKEN, META_PHONE_ID), Coding Conventions (component structure, inline styles, data-fetch pattern) (+12 more)

### Community 11 - "TypeScript App Config"
Cohesion: 0.09
Nodes (22): vite/client, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+14 more)

### Community 12 - "Vite/Node TS Config"
Cohesion: 0.10
Nodes (20): node, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection (+12 more)

### Community 13 - "Supabase Client & TS Config"
Cohesion: 0.11
Nodes (18): src/lib/supabase.ts, compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 14 - "Code Quality Rationale Notes"
Cohesion: 0.12
Nodes (17): index.html (App Entry Point), beltConfig Partial Duplication (rationale: always import from gbBrand.ts), Code Quality Report, ESLint Configuration Recommendation, Inline Style Objects Maintainability Issue (rationale: hundreds of repeated inline styles; recommend CSS modules), Optimistic Update Pattern in useModulos (rationale: correct UX pattern, revert on error), PWA Cache Strategies (NetworkFirst, CacheFirst, StaleWhileRevalidate), safePage Redirect Pattern (rationale: role check on render, not just navigation, prevents URL manipulation) (+9 more)

### Community 15 - "Recommendations & CI/CD"
Cohesion: 0.16
Nodes (15): Module System Coverage Gap (rationale: isActive bug could expose/hide modules incorrectly), Unit Tests: useModulos.tsx, Bundle Size / Load Time Optimizations (lazy-load jsPDF, code-split pages, memoize schedule), CI/CD Pipeline (GitHub Actions: type check, lint, build, E2E), Database Branching for Migrations (Supabase branch feature), Recommendations Report, Add Error Boundary Component, Image Optimization for Avatars (resize to 400px, JPEG 85%) (+7 more)

### Community 16 - "Security Audit (RLS Gaps)"
Cohesion: 0.16
Nodes (14): 10 - Security Audit, SEC-001 JWT stored in localStorage (LOW), SEC-003 Password min length 6 chars (LOW), SEC-004 turmas table has no RLS (HIGH), SEC-005 configuracoes table has no RLS (HIGH), SEC-006 access_logs table has no RLS (MEDIUM), SEC-008 No Content-Security-Policy header (LOW), SEC-009 No Strict-Transport-Security/HSTS header (LOW) (+6 more)

### Community 17 - "Authorization Architecture"
Cohesion: 0.23
Nodes (12): Three-level Authorization Architecture, Module System Data Flow (Realtime propagation), 02 - System Overview, Dynamic Module System (enable/disable, Realtime propagation), Subscription Plans Catalog (planos), Admin role, Atendimento role, Superadmin role (+4 more)

### Community 18 - "RLS Integration Fixes"
Cohesion: 0.24
Nodes (12): Integration: Authentication Integration, Integration Tests, Integration: Module System Integration, Integration: RLS Policy Integration, Recommendation Fix 2: configuracoes RLS, Recommendation Fix 3: presencas INSERT policy for alunos, CRIT-2: configuracoes Table Has No RLS (OWASP A01:2021, exposes SMTP passwords/GPS fence), CRIT-3: Alunos Cannot Insert Own Presences (feature gap, GPS check-in silently fails) (+4 more)

### Community 19 - "Security Findings & Headers"
Cohesion: 0.20
Nodes (12): Recommendation Fix 1: turmas RLS, Add Security Headers (CSP, HSTS) to vercel.json, Accepted Risks (JWT in localStorage, demo mode no auth, client-side GPS), CRIT-1: turmas Table Has No RLS (OWASP A01:2021 Broken Access Control), Security Findings Report, LOW-2: access_logs Table Has No RLS, MED-1: Missing Content Security Policy Header, MED-2: Missing HSTS Header (+4 more)

### Community 20 - "Code Review Findings"
Cohesion: 0.22
Nodes (11): SEC-011 GPS lat/lng no range validation (MEDIUM), CR-001 Duplicate src/src/ directory (Critical), CR-003 Two Supabase client files (High), CR-008 mockData.ts imported in production auth bundle (Medium), CR-009 resetPasswordForEmail without rate limiting (Medium), CR-010 GPS coordinates stored as string, parsed inline (Medium), CR-012 console logs left in production code (Low), CR-015 vercel.json missing Cache-Control for static assets (Low) (+3 more)

### Community 21 - "Integrations Log Page"
Cohesion: 0.18
Nodes (8): IntegracoesPage(), LogLevel, MOCK_LOGS, STRIPE_ENDPOINTS, TOC_FLOW_STEPS, WebhookEndpoint, WebhookLog, WebhookStatus

### Community 22 - "GPS Check-in (Aluno)"
Cohesion: 0.29
Nodes (9): PWA Architecture (Service Worker caching strategies), Aluno role, GPS Check-in Workflow (Aluno), 18 - Manual do Atleta (Aluno), DIAS_PT, hoje(), hojeNomeDia(), horaAtual() (+1 more)

### Community 23 - "Test Strategy Plan"
Cohesion: 0.22
Nodes (10): Component Tests plan (LoginPage, BeltBadge), 13 - Test Strategy, E2E Tests plan (Playwright: enrollment, checkin, GPS checkin, navigation), Recommended Test Stack (Vitest, Testing Library, Playwright, Deno test), Unit Tests: Authorization (App.tsx extracted util), Unit Tests: Data Validation (email, GPS range, password length, grau range), Unit Tests, Unit Tests: GPS / Haversine (geo.ts to be extracted) (+2 more)

### Community 24 - "Test Coverage Gaps"
Cohesion: 0.24
Nodes (10): Belt Configuration Coverage Gap (kids belt variants untested), CI Coverage Gate (Codecov, 50% minimum), Coverage Report, Path to 50% Coverage (v1.1 Goal, 3-week plan), Unit Tests: auth.tsx, any Type Safety Issue (rationale: generate Supabase types to catch schema changes at compile time), Supabase Types npm Script Workflow, Generate TypeScript Types from Supabase Schema (+2 more)

### Community 25 - "Belt Progression & Graduation"
Cohesion: 0.28
Nodes (9): Adult Belt Progression (branca->azul->roxa->marrom->preta->vermelha), GB Kids Belt Progression, Professor role, Belt Graduation Workflow, Unit Tests plan (gbBrand, haversine, useModulos, canAccess), 16 - Manual do Professor, E2E Journey: Belt Graduation, Unit Tests: gbBrand.ts (+1 more)

### Community 26 - "Config Store & ADRs"
Cohesion: 0.22
Nodes (9): configuracoes table (key-value config store), SEC-014 SMTP/Resend password stored in plaintext in configuracoes (MEDIUM), CR-006 Inline styles instead of CSS classes (Medium), Integration Tests plan (auth flow, module toggle), ADR-001 Inline Styles Over CSS Framework, ADR-003 History API for PWA Navigation (back button), ADR-005 Module States stored in configuracoes Table, 19 - Developer Manual (+1 more)

### Community 27 - "Database Indexing"
Cohesion: 0.22
Nodes (9): Integration: Edge Function Integration, Missing Database Indexes (presencas, pagamentos, graduacoes, mensagens), Performance Report, Scaling Thresholds (0-200 ok, 500-1000 degraded, 1000+ broken), Add Missing Database Indexes, Configure Resend Email (3000 emails/month free tier), mensagens table (supabase/schema.sql), pagamentos table (supabase/schema.sql) (+1 more)

### Community 28 - "Belt Type / Checkin Bugs"
Cohesion: 0.32
Nodes (8): belt_type enum out of sync with TS Belt type (kids variants missing), CR-002 belt_type enum out of sync with TS Belt type (Critical), CR-004 presencas INSERT RLS blocks aluno self-checkin (High), CR-016 FluxoMatricula double-renders during enrollment (Low), BLOCK-3 Students cannot self-check-in (RLS gap on presencas), BLOCK-4 belt_type enum incomplete (kids belts fail), Known Issues / Gotchas (GPS checkin fails, kids belts fail, Rules of Hooks, enrollment race condition), 20 - FAQ

### Community 29 - "E2E Test Journeys"
Cohesion: 0.25
Nodes (8): E2E Journey: Admin - Add Student, End-to-End Tests, E2E Journey: Email Communication, E2E Journey: GPS Check-in (Student), E2E Journey: Module Toggle (Superadmin, Realtime propagation), E2E Journey: PWA Back Button (Mobile), E2E Journey: Staff Invite, E2E Journey: Student Enrollment (Public)

### Community 30 - "Icon Sprite Set"
Cohesion: 0.52
Nodes (7): Bluesky icon (butterfly logo, symbol#bluesky-icon), Discord icon (game-controller-style logo, symbol#discord-icon), Documentation icon (folder/pages outline, symbol#documentation-icon), GitHub icon (Octocat mark, symbol#github-icon), Icon Sprite Set (public/icons.svg), Social/community icon (person with star badge, symbol#social-icon), X (Twitter) icon (X logo mark, symbol#x-icon)

### Community 31 - "Vercel Deployment Config"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, installCommand, outputDirectory, rewrites

### Community 32 - "Belt Type Enum Fix"
Cohesion: 0.40
Nodes (6): Integration: Data Integrity, Recommendation Fix 4: belt_type enum expansion (kids variants), Implement Pagination for useAlunos/usePagamentos/usePresencas, CRIT-4: belt_type Enum Incomplete (kids belt graduations fail with constraint violation), alunos table (supabase/schema.sql), belt_type enum (supabase/schema.sql)

### Community 33 - "Supabase DB Types"
Cohesion: 0.50
Nodes (3): db, DbAluno, supabase

### Community 34 - "GPS Fence Coverage Gap"
Cohesion: 1.00
Nodes (3): GPS Fence Calculation Coverage Gap (rationale: bug in haversine could allow check-ins from anywhere), Configure GPS Fence (capture location, set 100m radius), MED-4: GPS Coordinates Lack Range Validation

## Ambiguous Edges - Review These
- `ComunicacaoPage()` → `send-email Edge Function`  [AMBIGUOUS]
  documentation/05-API.md · relation: calls
- `GB Braga README - Sistema de Gestao` → `09 - Deployment Guide`  [AMBIGUOUS]
  README.md · relation: references
- `invite-staff Edge Function` → `handle_new_user() trigger - auto-create profile on auth.users insert`  [AMBIGUOUS]
  documentation/05-API.md · relation: calls
- `index.html (App Entry Point)` → `src/main.tsx (referenced entry module)`  [AMBIGUOUS]
  index.html · relation: references
- `Integration: RLS Policy Integration` → `CRIT-3: Alunos Cannot Insert Own Presences (feature gap, GPS check-in silently fails)`  [AMBIGUOUS]
  qa/integration-tests.md · relation: references

## Knowledge Gaps
- **246 isolated node(s):** `config`, `stripe`, `supabase`, `InvoiceResult`, `name` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `ComunicacaoPage()` and `send-email Edge Function`?**
  _Edge tagged AMBIGUOUS (relation: calls) - confidence is low._
- **What is the exact relationship between `GB Braga README - Sistema de Gestao` and `09 - Deployment Guide`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `invite-staff Edge Function` and `handle_new_user() trigger - auto-create profile on auth.users insert`?**
  _Edge tagged AMBIGUOUS (relation: calls) - confidence is low._
- **What is the exact relationship between `index.html (App Entry Point)` and `src/main.tsx (referenced entry module)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Integration: RLS Policy Integration` and `CRIT-3: Alunos Cannot Insert Own Presences (feature gap, GPS check-in silently fails)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `jspdf` connect `NPM Dependencies` to `App Shell & Data Hooks`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `dependencies` connect `NPM Dependencies` to `ESLint Tooling Config`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._