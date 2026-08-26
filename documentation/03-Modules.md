# 03 — Module Documentation

**Gracie Barra Braga — Module Reference**

---

## 1. Auth Module (`src/lib/auth.tsx`)

**Purpose:** Manages authentication state across the entire application.

**Exports:**
- `AuthProvider` — Context provider wrapping the app
- `useAuth()` — Hook to access auth state and actions

**State:**
- `user: User | null` — Currently logged-in user
- `loading: boolean` — True while session is being resolved
- `pendingPasswordSetup: boolean` — True when staff clicks invite link

**Methods:**
- `login(email, password) → Promise<boolean>` — Signs in via Supabase or mock
- `register(email, password, nome) → Promise<{ok, confirmEmail, message}>` — Self-registration
- `logout() → void` — Signs out
- `refreshProfile() → Promise<void>` — Re-reads profile from DB
- `switchRole(role) → void` — Demo mode only: switch between mock users
- `completePasswordSetup(password) → Promise<{ok, message}>` — Staff invite completion

**Dependencies:** `supabaseClient.ts`, `mockData.ts` (demo mode)

**Failure modes:**
- Profile not found → attempts self-create (patch 02 required)
- Self-create fails → local fallback user object (app loads with limited data)
- Network error → loading remains false, user is null (shows login)

---

## 2. Module System (`src/lib/useModulos.tsx`)

**Purpose:** Manages which optional modules are active, with real-time propagation.

**Exports:**
- `ModulosProvider` — Context provider (wraps App inside AuthProvider)
- `useModulos()` — Returns `{ modulos, loading, isActive, toggle }`
- `MODULE_CATALOGUE: ModuleDef[]` — List of all toggleable modules
- `CORE_MODULE_IDS: Set<string>` — Modules that cannot be disabled

**Behavior:**
- Loads from `configuracoes.dados` (secao='modulos') on mount
- Subscribes to Supabase Realtime for live updates
- `isActive(id)`: returns `true` for core modules regardless of DB state; returns `true` for any module not explicitly set to `false`
- `toggle(id)`: optimistic update + DB upsert; reverts on error

**Storage:** `configuracoes` table, `secao = 'modulos'`, `dados = { checkin: false, ... }`

---

## 3. Data Layer (`src/lib/useData.ts`)

**Purpose:** Centralized data fetching hooks for all Supabase tables.

**Hooks exported:**
| Hook | Table | Returns |
|---|---|---|
| `useAlunos()` | alunos | `{ alunos, loading, refetch }` |
| `useTurmas()` | turmas | `{ turmas, loading, refetch }` |
| `usePagamentos()` | pagamentos | `{ pagamentos, loading, refetch }` |
| `usePresencas(limit?)` | presencas | `{ presencas, loading, refetch }` |
| `useGraduacoes()` | graduacoes | `{ graduacoes, loading, refetch }` |
| `useMensagens(limit?)` | mensagens | `{ mensagens, loading, refetch }` |
| `useTemplates()` | templates_mensagem | `{ templates, loading, refetch }` |
| `usePlanos()` | planos | `{ planos, loading }` |
| `useContratos()` | contratos | `{ contratos, loading }` |

**DB functions (write operations):**
- `db.criarAluno(data)` — Insert + related profile
- `db.atualizarAluno(id, data)` — Update aluno record
- `db.registarPresenca(data)` — Insert presença
- `db.criarPagamento(data)` — Insert pagamento
- `db.registarGraduacao(data)` — Insert graduacao + update aluno faixa
- `db.enviarMensagem(data)` — Insert mensagem record
- `db.criarTemplate(data)` — Insert template
- `db.apagarTemplate(id)` — Delete template

---

## 4. Brand Library (`src/lib/gbBrand.ts`)

**Purpose:** Single source of truth for Gracie Barra brand constants.

**Exports:**
- `GB_RED` — `#C8102E` (primary brand color)
- `GB_BLACK` — `#111111`
- `GB_CREAM` — `#F7F6F4` (background)
- `GB_BORDER` — `#E2E0DB`
- `beltConfig: Record<Belt, { bg: string; text: string; label: string }>` — All belt visual configs

**Belt configs (21 entries):**
- Adult: branca, azul, roxa, marrom, preta, vermelha
- Kids: cinza-branca, cinza, cinza-preta, amarela-branca, amarela, amarela-preta, laranja-branca, laranja, laranja-preta, verde-branca, verde, verde-preta

Bicolor belts use CSS `linear-gradient(to right, color1 55%, color2 55%)`.

---

## 5. Supabase Client (`src/lib/supabaseClient.ts`)

**Purpose:** Singleton Supabase client with demo mode detection.

**Exports:**
- `supabase` — SupabaseClient instance
- `isConfigured: boolean` — True when env vars are present and not placeholders

**Demo mode detection:**
```typescript
const url = import.meta.env.VITE_SUPABASE_URL ?? '';
export const isConfigured = url.startsWith('https://') && url.includes('.supabase.co');
```

---

## 6. TOConline Integration (`src/services/api/toconline.ts`)

**Purpose:** Portuguese fiscal document generation via TOConline API.

**Functions:**
- `getAccessToken(config)` — OAuth2 token fetch
- `emitirFatura(config, pagamento, aluno)` — Create FR/FT document
- `getTocConfig()` — Load config from `configuracoes` table

**Integration flow:**
1. Payment confirmed (Stripe webhook or manual)
2. `emitirFatura()` called with payment + student data
3. TOConline returns document number (e.g., "FR 2025/1001")
4. Document saved to `toc_documentos` table

---

## 7. Report Export (`src/services/pdf/`)

**Purpose:** PDF/CSV generation using jsPDF, split by concern:
- `contrato.ts` — Contract PDF with signature
- `report.ts` — Payment/attendance report PDFs
- `csv.ts` — CSV exports (e.g. student list)
- `index.ts` — Re-exports

**Note:** jsPDF (~85KB) is always bundled; lazy-loading it on demand would reduce initial bundle size.

---

## 8. Mobile Detection (`src/lib/useMobile.ts`)

**Purpose:** Responsive breakpoint hook.

**Export:**
- `useMobile() → boolean` — Returns `true` when viewport width < 768px

Used in Layout.tsx to switch between sidebar (desktop) and bottom nav (mobile).

---

## 9. Enrollment Flow (`src/pages/matricula/FluxoMatricula.tsx`)

**Purpose:** Multi-step enrollment wizard for new students.

**Steps:**
1. Personal data (name, email, password, phone, date of birth)
2. Plan selection
3. Payment method (Stripe / Cash request)
4. Contract acceptance + digital signature
5. RGPD / image rights consent
6. Confirmation

**Props:**
- `registerMode?: boolean` — When true, creates auth account + profile
- `embedded?: boolean` — Staff-managed enrollment (no auth creation)
- `onConcludo: () => void` — Called on successful completion
- `onVoltar?: () => void` — Back button handler

**DB writes on completion:** profiles, alunos, contratos, pagamentos (or pedidos_numerario)

---

## 10. Additional Modules

- **`src/lib/alunoDomain.ts`** — Aluno domain helpers: belt-list constants (`FAIXAS_KIDS`, `FAIXAS_ADULTO`) and related derived-data helpers, shared by graduation and evolution pages.
- **`src/lib/icons.tsx`** — Thin wrappers around `@fortawesome/react-fontawesome` icons for consistent sizing/usage across pages.
- **`src/lib/queries.ts`** — TanStack Query key factories/helpers used alongside `useData.ts`.
- **`src/hooks/`** — Newer data hooks (`useProfile`, `useConfiguracoes`, `useAlunoInfo`, `usePedidosNumerario`) that follow the same pattern as `useData.ts` but live outside `lib/`; new data hooks should be added here rather than in `lib/`.
- **`src/services/api/edgeFunctions.ts`** — Typed wrappers for invoking the `invite-staff` and `send-email` Edge Functions from the frontend.
- **`src/services/geo.ts`** — Haversine distance calculation used by the GPS check-in flow (§9 in `02-System-Overview.md`).
