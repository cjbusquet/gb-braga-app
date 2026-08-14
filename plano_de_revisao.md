# Plano de Revisão — Auditoria QA Full-Stack

Gerado autonomamente. Ver relatório final na conversa para detalhes de cada correção.

## Fase 1 — Mapeamento

Router: SPA custom (não é React Router) — `src/App.tsx` mantém `currentPage: string` em state, gate de acesso via `PAGE_ROLES` (role → páginas permitidas) e `canAccessModule` (módulos on/off), navegação via `handleNavigate(page)` + `history.pushState` (suporte a botão "voltar" do telemóvel), render via `switch` em `renderPage()`.

Estado global: `AuthProvider` (sessão/role), `ModulosProvider` (módulos activos), `QueryClientProvider` (TanStack Query), `ToastProvider`. Duas camadas de data-fetching coexistem: hooks legacy em `src/lib/useData.ts` (`{data, loading, refetch}`, fallback para `mockData.ts` em modo demo) e hooks TanStack Query reais em `src/hooks/*.ts` (`useKPIs`, `useConfiguracoes`, `usePedidosNumerario`, `useNotificacoes`, `useChat`, `useAlunoInfo`).

## Fase 2/3 — Checklist por view

| View | Rota | Ficheiro | Estado |
|---|---|---|---|
| Dashboard (admin) | `dashboard` | `pages/admin/Dashboard.tsx` | ✅ auditado |
| Super Admin Dashboard | `dashboard` (superadmin) | `pages/admin/SpecialPages.tsx` | ✅ auditado |
| Professor Dashboard | `dashboard` (professor) | `pages/professor/ProfessorView.tsx` | ✅ auditado |
| Alunos | `alunos` | `pages/admin/AlunosPage.tsx` | ✅ auditado — **2 bugs corrigidos** |
| Turmas | `turmas` | `pages/admin/TurmasPage.tsx` | ✅ auditado |
| Check-in | `checkin` | `pages/admin/CheckinPage.tsx` + `KioskMode.tsx` | ✅ auditado — **2 bugs corrigidos** |
| Financeiro | `financeiro` | `pages/admin/FinanceiroPage.tsx` | ✅ auditado |
| Graduação | `graduacao` | `pages/admin/GraduacaoPage.tsx` | ✅ auditado |
| Comunicação | `comunicacao` | `pages/admin/ComunicacaoPage.tsx` | ✅ auditado |
| Chat | `chat` | `pages/admin/ChatPage.tsx` | ✅ auditado — **1 bug corrigido** |
| Contratos | `contratos` | `pages/admin/ContratosPage.tsx` | ✅ auditado |
| Relatórios | `relatorios` | `pages/admin/SpecialPages.tsx` | ✅ auditado |
| Integrações | `integracoes` | `pages/admin/IntegracoesPage.tsx` | ✅ auditado — **3 bugs corrigidos** |
| Config | `config` | `pages/admin/ConfigPage.tsx` | ✅ auditado |
| Pendentes Numerário | `numerario` | `pages/admin/PendentesNumerario.tsx` | ✅ auditado |
| Professores | `professores` | `pages/admin/ProfessoresPage.tsx` | ✅ auditado |
| Matrícula (embedded) | `matricula` | `pages/matricula/FluxoMatricula.tsx` | ✅ auditado |
| Módulos | `modulos` | `pages/admin/ModulosPage.tsx` | ✅ auditado |
| Portal Aluno | `portal` | `pages/aluno/PortalAluno.tsx` | ✅ auditado — **1 bug corrigido** |
| Meu Check-in | `meu-checkin` | `pages/aluno/MeuCheckin.tsx` | ✅ auditado |
| Minhas Aulas | `minhas-aulas` | `pages/aluno/MinhasAulas.tsx` | ✅ auditado |
| Minha Evolução | `evolucao` | `pages/aluno/MinhaEvolucao.tsx` | ✅ auditado |
| Meu Financeiro | `meu-financeiro` | `pages/aluno/MeuFinanceiro.tsx` | ✅ auditado — **1 bug corrigido** |
| Conteúdo | `conteudo` | `pages/aluno/Conteudo.tsx` | ✅ auditado |
| Mensagens | `mensagens` | `pages/aluno/Mensagens.tsx` | ✅ auditado |
| Perfil | `perfil` | `pages/PerfilPage.tsx` | ✅ auditado |
| Login / Matrícula pública | — | `pages/LoginPage.tsx`, `pages/public/MatriculaPublica.tsx` | ✅ auditado |
| Layout (sidebar/bottom-nav/notificações) | — | `components/layout/Layout.tsx`, `NotificationBell.tsx` | ✅ auditado |

## Verificações transversais (toda a app)

- [x] `tsc --noEmit` limpo (0 erros)
- [x] `eslint .` — 23 problemas pré-existentes, nenhum introduzido, nenhum é bug funcional (ver relatório)
- [x] Toda a tabela de rotas (`PAGE_ROLES`) cruzada com todo `onNavigate(...)`/`handleNav(...)` chamado na app — sem links mortos
- [x] Todo `db.xxx()` chamado nos componentes cruzado com os métodos definidos em `useData.ts` — todos existem
- [x] Toda a origem de `link` inserido em notificações (triggers SQL) cruzada com `PAGE_ROLES` — válidos
- [x] Todo `<button>` da app (regex sobre 29 ficheiros `.tsx`) sem `onClick` nem `type="submit"` — 6 candidatos, 6 investigados
- [x] Todo `<select>` da app verificado quanto a `value=`/`onChange` em falta
- [x] Todos os 3 `<form onSubmit>` verificados quanto a `e.preventDefault()`
- [x] Padrão `const [, setX] = useState(...)` (valor de leitura descartado) varrido em toda a app

## Fora de âmbito (decisão de produto, não bug de regressão)

- `db.suspenderAluno` em `useData.ts` está morto (nada o chama — `AlunosPage` usa `atualizarAluno` para o mesmo efeito, de forma mais completa). Não é uma funcionalidade quebrada, é código morto redundante.
- Filtro "turma" no check-in Manual não filtra a lista de alunos (não existe relação aluno↔turma exposta ao frontend, apesar de existir `inscricoes_turma` na BD) — corrigido para tagar o check-in com a turma escolhida em vez de fingir filtrar; filtrar a lista exigiria um novo hook + join, fora do âmbito de uma correção de bug.
