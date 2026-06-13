# 04 — Component Documentation

**Gracie Barra Braga — Component Reference**

---

## 1. Layout (`src/components/layout/Layout.tsx`)

**Purpose:** Application shell — sidebar (desktop), bottom navigation (mobile), top bar.

**Props:**
```typescript
interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: ReactNode;
}
```

**Features:**
- Desktop: Fixed sidebar with logo, navigation items, user avatar, logout button
- Mobile: Top bar (logo + avatar) + bottom navigation (4 tabs)
- Navigation items filtered by role AND module active state (`useModulos`)
- Avatar click → navigate to 'perfil'
- Logout button (red) at sidebar bottom

**Navigation configuration:**
```typescript
// Desktop/sidebar items (filtered by role)
NAV_ITEMS = [
  { icon, label, id, roles: UserRole[] }
  // 15+ items
]

// Mobile bottom nav (hardcoded by role)
BOTTOM_NAV = {
  admin: ['dashboard', 'alunos', 'financeiro', 'config'],
  aluno: ['portal', 'meu-checkin', 'minhas-aulas', 'evolucao'],
  professor: ['dashboard', 'checkin', 'graduacao', 'perfil'],
  atendimento: ['dashboard', 'alunos', 'checkin', 'comunicacao'],
  superadmin: ['dashboard', 'alunos', 'financeiro', 'config'],
}
```

**Dependencies:** `useAuth`, `useModulos`, `useMobile`

---

## 2. GBLogo (`src/components/GBLogo.tsx`)

**Purpose:** Gracie Barra brand logo (SVG inline component).

**Props:**
```typescript
interface GBLogoProps {
  size?: number;       // Default: 32
  showText?: boolean;  // Show "GRACIE BARRA" text alongside logo
  className?: string;
}
```

---

## 3. LoginPage (`src/pages/LoginPage.tsx`)

**Purpose:** Authentication screen with demo role switcher.

**State:**
- `email, password` — Login form
- `error` — Error message
- `loading` — Submit in progress

**Features:**
- Email + password login
- "Registar" link → triggers `onRegister` prop
- Demo mode: role switcher tabs (Superadmin / Admin / Atendimento / Professor / Aluno)
- GB brand styling (red + cream)

**Props:**
```typescript
interface LoginPageProps {
  onRegister: () => void;
}
```

---

## 4. PerfilPage (`src/pages/PerfilPage.tsx`)

**Purpose:** User profile management for all roles.

**Sections:**
1. **AvatarSection** — Upload/change photo (Supabase Storage, `avatars/{user_id}/avatar.{ext}`)
2. **DadosPessoaisSection** — Edit nome + telefone
3. **PasswordSection** — Change password (`supabase.auth.updateUser`)
4. **AlunoSection** — (aluno only) Belt, plan, enrollment date from `alunos` table

**Avatar upload:** File → Supabase Storage → URL saved to `profiles.avatar_url` with cache-bust `?t=${Date.now()}`

---

## 5. Dashboard (`src/pages/admin/Dashboard.tsx`)

**Purpose:** Admin KPI overview.

**Data:** Fetches from `v_kpis` view via Supabase.

**KPI Cards:**
- Total Alunos, Alunos Ativos, Receita Mensal, Receita Prevista, Inadimplentes, Novos Alunos

---

## 6. AlunosPage (`src/pages/admin/AlunosPage.tsx`)

**Purpose:** Full student management CRUD.

**Features:**
- Filterable list (status, faixa, plano, search)
- Student detail/edit modal
- Nova Matrícula modal
- Export to CSV

---

## 7. TurmasPage (`src/pages/admin/TurmasPage.tsx`)

**Purpose:** Class schedule management with calendar view.

**Components (internal):**
- `CalendarView` — Weekly grid (desktop) / day tabs (mobile)
- `TurmaBlock` — Colored class block (border + left bar in `turma.cor`)
- `Legend` — Auto-generated color legend
- `TurmaDetail` — Modal with capacity bar + enrolled students

**State:**
- `view: 'calendar' | 'list'` — View toggle
- `filter: 'all' | 'gi' | 'nogi' | 'kids'` — Type filter
- `selectedTurma` — Currently open detail

**Calendar layout:**
```
              SEG    TER    QUA    QUI    SEX    SÁB
07:00      |  GB1  |      |  GB1  |      |  GB1  |      |
09:30      |  Open |      |       |      |       |  Open |
...
```

---

## 8. CheckinPage (`src/pages/admin/CheckinPage.tsx`)

**Purpose:** Staff-operated attendance registration.

**Features:**
- Student search (name/email)
- One-click check-in button
- Today's attendance list
- Kiosk mode access button

---

## 9. MeuCheckin (`src/pages/aluno/MeuCheckin.tsx`)

**Purpose:** Student self-check-in via GPS.

**GPS flow:**
1. Load academy GPS config from `configuracoes` (secao='academia')
2. Request browser geolocation (`navigator.geolocation.getCurrentPosition`)
3. Calculate haversine distance from academy coordinates
4. Display status (inside/outside/loading/error)
5. If inside fence: show "Fazer Check-in" button
6. On click: insert to `presencas` with GPS metadata

**Turma selection:** Filters `turmas` by current day of week for the student to select which class they're attending.

---

## 10. ComunicacaoPage (`src/pages/admin/ComunicacaoPage.tsx`)

**Purpose:** Email/WhatsApp communication management.

**Tabs:**
- **Enviar** — Compose and send messages; template selector
- **Histórico** — Past messages from `mensagens` table
- **Templates** — CRUD for message templates

**Send flow:**
1. Select recipients (individual aluno or group filter)
2. Choose template or compose
3. Call `send-email` Edge Function
4. On success: save to `mensagens` table + show confirmation

---

## 11. ConfigPage (`src/pages/admin/ConfigPage.tsx`)

**Purpose:** Academy configuration management.

**Tabs:**
- **Academia** — Name, address, contact, GPS fence
- **Email** — SMTP / Resend configuration
- **Equipa** — Staff CRUD + invite + password reset
- **Planos** — Subscription plan management

**GPS section:**
- "Capturar localização atual" button → `navigator.geolocation`
- "Testar distância atual" → calculate haversine from stored coordinates
- Radius input (meters)
- Stores in `configuracoes.dados` (secao='academia')

---

## 12. ModulosPage (`src/pages/admin/ModulosPage.tsx`)

**Purpose:** Module enable/disable interface (Superadmin only).

**Components:**
- `Toggle` — Switch UI (blue when active, gray when inactive)
- `ModuleRow` — Module name + description + toggle
- Grouped by Staff / Aluno categories

**Core modules:** Shown as disabled toggle (cannot be toggled off).

---

## 13. PortalAluno (`src/pages/aluno/PortalAluno.tsx`)

**Purpose:** Student home screen / portal.

**Sections:**
- Welcome with current belt display
- Recent attendance summary
- Upcoming payment status
- Quick navigation cards

**Props:**
```typescript
interface PortalAlunoProps {
  onNavigate: (page: string) => void;
}
```

---

## 14. FluxoMatricula (`src/pages/matricula/FluxoMatricula.tsx`)

**Purpose:** Multi-step enrollment wizard.

**Props:**
```typescript
interface FluxoMatriculaProps {
  registerMode?: boolean;  // Creates Supabase Auth account
  embedded?: boolean;      // Staff-managed, no auth creation
  onConcludo: () => Promise<void>;
  onVoltar?: () => void;
}
```

**Step components:**
- `StepPessoal` — Personal data form
- `StepPlano` — Plan selection cards
- `StepPagamento` — Payment method
- `StepContrato` — Contract PDF + signature canvas
- `StepConclusao` — Success screen

---

## 15. SpecialPages (`src/pages/admin/SpecialPages.tsx`)

**Purpose:** Superadmin multi-academy dashboard and reporting.

**Exports:**
- `SuperAdminDashboard({ onNavigate })` — Academy overview with "Gerir →" buttons
- `RelatoriosPage` — Business reports (revenue, retention, attendance)

**Academy list:** Currently only GB Braga (other academies removed).
