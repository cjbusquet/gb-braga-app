# Design System Refactor — Tracking

Auditoria gerada por varredura `rg` sobre `src/` (73 ficheiros `.ts`/`.tsx`). Este documento é o checklist vivo desta iniciativa — atualizado a cada lote.

## FASE 1 — Auditoria (concluída)

### Achado principal: a app já tem uma escala de espaçamento consistente

Contagem de utilitários Tailwind `p*/m*/gap*` na forma padrão (não-arbitrária) — top 25:

```
198 gap-1.5   138 px-3.5    124 py-2.5    85 gap-2     74 gap-2.5
 68 mb-4       65 mb-1       61 py-2       56 py-1.5    56 gap-3
 51 mb-5       51 mb-3.5     47 px-4       45 py-3      43 mb-3
 42 gap-1      38 px-3       38 mt-1       38 mb-2.5    32 py-3.5
 30 mb-1.5     29 mt-0.5     26 mb-2       25 py-0.5    25 gap-3.5
```

Isto já é uma escala de base-4px com meios-passos (2px) — é a escala **default do Tailwind**, não caótica. **Não vamos reinventar uma escala nova**: vamos formalizar esta como a oficial e caçar os desvios dela.

### Anomalia real: espaçamentos "mágicos" via `[Npx]` arbitrário

```
26× px-[18px]   24× mb-[18px]   16× px-[22px]   12× mb-[22px]   3× mt-[18px]
 2× py-[52px]    2× py-[22px]    2× py-[15px]    2× px-[7px]    2× p-[22px]
 2× p-[18px]     2× ml-[18px]    2× mb-[30px]    1× py-[72px]   1× py-[60px]
 1× py-[26px]    1× py-[18px]    1× py-[11px]    1× px-[5px]    1× px-[26px]
 1× pl-[34px]    1× pb-[18px]    1× p-[3px]      1× p-[26px]    1× mt-[22px]
 1× mb-[26px]    1× gap-[3px]   1× gap-[2px]
```

`18px` e `22px` aparecem **74 vezes** — demasiado consistente para ser acidente; é uma segunda escala informal (secções/cards com padding maior). Vamos **promovê-la a tokens de primeira classe** (`--spacing-4_5`, `--spacing-5_5`) em vez de a apagar. Os valores realmente únicos/órfãos (`11px`, `26px`, `30px`, `52px`, `60px`, `72px`, `34px`, `5px`, `7px`, `3px`, `2px` em `gap-`) são os verdadeiros desvios — candidatos a convergir para o valor da escala mais próximo.

### Botões

- **~190 `<button>` em bruto** espalhados por 30+ ficheiros (top: ConfigPage 17, AlunosPage 17, Layout 13, FluxoMatricula 12, MatriculaPublica 10).
- Componente base `src/components/common/Button.tsx` **já existe, já é 100% flat** (`bg-gb-red` sólido, `rounded-sm`, zero `box-shadow`) — variantes `primary`/`secondary`/`ghost`, tamanhos `sm`/`md`/`lg`.
- O problema nunca foi falta de padrão — é inconsistência de **uso**. Já resolvido nesta sessão para Check-in/Turmas; o resto da app ainda usa `<button className="...">` bespoke.

### Tabs

- **8+ implementações de tab-bar feitas à mão** (padrão `useState` + `.map()` + `border-b-2` ativo), duplicadas em: `LoginPage`, `ProfessorView`, `IntegracoesPage`, `CheckinPage`, `SpecialPages` (Relatórios), `ComunicacaoPage` (×4 variações!), `GraduacaoPage` (×3), `FinanceiroPage`.
- **Não existe componente `Tabs` partilhado.** Cada ficheiro reinventa a mesma lógica com classes ligeiramente diferentes.

### Selects

- **15 `<select>` em bruto**, sem componente partilhado (existe `Input.tsx` mas não `Select.tsx`).

### Shadows / Gradientes

- `shadow-xs` está no **`Card.tsx`** — o componente partilhado usado por toda a app. Isto sozinho propaga sombra a centenas de instâncias.
- `shadow-red` (9×), `shadow-lg` (4×, modais), `shadow-md` (3×), `shadow-sm` (2×) — a rever caso a caso.
- 7× `boxShadow` inline, 7× `gradient` — a maioria são heróis decorativos com a cor real da faixa do aluno (`PortalAluno`, `MinhaEvolucao`) ou fundo de marca (`LoginPage`, `MatriculaPublica`) — **fora do âmbito** de "botões/tabs/seletores/inputs" tal como pedido; não são controlos. Exceção: `ProfessorView.tsx:68` tem o mesmo hero-gradient que já removi de `ProfessoresPage.tsx` numa sessão anterior — mesma correção, aplicada agora.

### Border-radius

Já é uma hierarquia sã, não caótica: `rounded-sm` (137× — controlos), `rounded-full` (99× — pills/avatares), `rounded-lg` (93× — cards), `rounded-md` (34×), `rounded-xl` (22×), `rounded-2xl` (8×, modais). **Mantida como está**, apenas documentada.

---

## Padrão Oficial (FASE 1 → definição)

**Estilo:** Flat. Zero `box-shadow` em controlos (botões, inputs, selects, tabs, badges). Cor sólida, sem gradiente, exceto heróis decorativos com cor de faixa (fora do âmbito de "controlos").

**Escala de espaçamento** (`--spacing-*` no `@theme` do Tailwind v4, `src/index.css`):
| Token | px | Uso típico |
|---|---|---|
| 0.5 | 2px | gaps finos |
| 1 | 4px | |
| 1.5 | 6px | gap entre ícone+texto |
| 2 | 8px | |
| 2.5 | 10px | padding vertical de botão `sm` |
| 3 | 12px | |
| 3.5 | 14px | padding horizontal de botão `sm` |
| 4 | 16px | padding de card `sm` |
| 4.5 *(novo)* | 18px | padding de secção/header — já usado 66× |
| 5 | 20px | |
| 5.5 *(novo)* | 22px | padding de card `lg` — já usado 28× |
| 6 | 24px | |

**Radius:** `rounded-sm` (controlos), `rounded-lg` (cards), `rounded-md` (elementos médios), `rounded-full` (pills/avatares).

**Cores:** `bg-gb-red` sólido / `text-white` (primário), `bg-elevated` + `border-border` + `text-secondary` (secundário), sem tons intermédios ou gradiente.

---

## FASE 2 — Fonte de verdade

- [x] `src/index.css` — **sem alteração necessária.** Tailwind v4 gera qualquer múltiplo numérico de `--spacing` (default `0.25rem`) dinamicamente — `p-4.5` já é 18px e `gap-5.5` já é 22px nativamente, sem precisar declarar tokens novos. `18px`/`22px` tornam-se oficiais só por passarem a usar `4.5`/`5.5` em vez de `[18px]`/`[22px]`.
- [x] `Card.tsx` — `shadow-xs` removido (maior alavanca única: propaga a toda a app)
- [x] `Button.tsx` — já conforme, sem alterações
- [x] `Input.tsx` — já conforme, sem alterações
- [x] `Tabs.tsx` — criado (novo componente partilhado)
- [x] `Select.tsx` — criado (novo componente partilhado)

## FASE 3 — Refatoração em lotes

- [x] **LOTE A — Sombras (a regra mais enfática do pedido): 100% da app.** Varredura completa e verificada — zero `shadow-xs/sm/md/lg/red`, zero `shadow-[...]` arbitrário, zero `boxShadow` inline de elevação em toda a `src/`. Tocou ~25 ficheiros: `Card.tsx`, `Modal.tsx`, `Toast.tsx`, `Toggle.tsx`, `Layout.tsx` (drawer/bottom-nav/top-bar), `NotificationBell.tsx`, `App.tsx`, `LoginPage.tsx`, `MatriculaPublica.tsx`, `FluxoMatricula.tsx`, `SpecialPages.tsx`, `ChatPage.tsx`, `ComunicacaoPage.tsx`, `ConfigPage.tsx`, `IntegracoesPage.tsx`, `ProfessoresPage.tsx`, `ProfessorView.tsx`, `GraduacaoPage.tsx`, `PendentesNumerario.tsx`, `Mensagens.tsx`, `MeuFinanceiro.tsx`, `Conteudo.tsx`, `TurmasPage.tsx`, `AlunosPage.tsx`, `PortalAluno.tsx`. Mantidos apenas rings de foco/seleção `0 0 0 Npx` sem blur (`PerfilPage.tsx`, seleção de plano em `MatriculaPublica.tsx`) — são outline, não sombra de elevação, e `focus-visible:ring-*` (acessibilidade de teclado, fora de âmbito). Hero-gradient de `ProfessorView.tsx` também removido (paridade com `ProfessoresPage.tsx`, já corrigido em sessão anterior).
- [x] **LOTE D — Espaçamentos mágicos: 100% dos outliers verdadeiros.** Todos os `[11px]/[26px]/[30px]/[34px]/[52px]/[60px]/[72px]/[5px]/[7px]/[3px]/[2px]` convergidos para a escala fracionária oficial do Tailwind v4 (`py-13`, `p-6.5`, `pl-8.5`, `gap-0.5`, etc.) — nenhum resta. `18px`/`22px` (padrão real já estabelecido, 74 ocorrências) mantidos como estão — já são `4.5`/`5.5` na escala, não precisam de conversão adicional generalizada (feita pontualmente onde o ficheiro já estava a ser tocado).
- [x] **LOTE B — Selects: 11/13 migrados (2 exceções documentadas).** `Select.tsx` corrigido a meio da fase — descobri que `Input.tsx` (referência inicial) só é usado em `LoginPage.tsx`; a convenção real da app interna são os `FIELD_CLASS` locais. Recriei `Select.tsx` para bater com essa convenção, e adicionei uma `variant` (`md` = campo de formulário labeled, `bg-elevated`; `sm` = filtro de toolbar sem label, `bg-card`) depois de descobrir uma terceira densidade real em `AlunosPage`/`CheckinPage`. Migrados: `GraduacaoPage.tsx` (2), `AlunosPage.tsx` (2, `variant="sm"`), `CheckinPage.tsx` (1, `variant="sm"`), `ComunicacaoPage.tsx` (2), `TurmasPage.tsx` (2), `NovaMatriculaModal.tsx` (3), `ConfigPage.tsx` (1, `variant="sm"`). **2 exceções deliberadas, não migradas:** `AlunosPage.tsx` (select `tipoRelacao`, usa `MINI_FIELD_CLASS` — uma 4ª densidade ainda mais compacta, usada 1× num sub-formulário apertado; forçar aumentaria o tamanho); `FluxoMatricula.tsx` (select `faixa`, usa o estilo público `bg-white`/`rounded-lg` do fluxo de matrícula, igual ao `Input.tsx`/`LoginPage.tsx` — não é a convenção interna).
- [x] **LOTE C — Tabs: todos os padrões consolidáveis migrados.** `Tabs.tsx` validado em `GraduacaoPage.tsx`, `FinanceiroPage.tsx`, `CheckinPage.tsx` (com ícone custom no tab "Live"), `SpecialPages.tsx` (Relatórios), `IntegracoesPage.tsx`, `ComunicacaoPage.tsx` (tinha o seu próprio componente `TabBar` local duplicado — removido e substituído pelo partilhado). **2 exceções deliberadas:** `ProfessorView.tsx` (tab-bar mais compacta, mobile-first, cor activa diferente — forçar no componente genérico pioraria); `LoginPage.tsx` (switcher "pill" de largura igual entre Login/Registo — estrutura visual incompatível com o padrão de sublinhado do `Tabs.tsx`, e é uso único sem duplicação para consolidar).

**Verificação:** `tsc`, `eslint`, `npm run build` limpos após cada migração. Varredura visual completa com Playwright (login real + navegação por 9 páginas) — **0 erros de consola/página**. Confirmei visualmente por screenshot: `CheckinPage` (tabs + select), `AlunosPage` (2 selects de toolbar), `IntegracoesPage` (tabs com ícones), `ComunicacaoPage` (tabs — antigo `TabBar` local — + select "Destinatário").

### Progresso por rota

| Rota/Ficheiro | Sombras | Tabs | Selects | Espaçamento mágico | Estado |
|---|---|---|---|---|---|
| `GraduacaoPage.tsx` | ✅ | ✅ | ✅ (2/2) | ✅ | **completo** |
| `FinanceiroPage.tsx` | ✅ | ✅ | — | ✅ | **completo** |
| `CheckinPage.tsx` | ✅ | ✅ | ✅ (1/1) | ✅ | **completo** |
| `TurmasPage.tsx` | ✅ | — (n/a) | ✅ (2/2) | ✅ | **completo** |
| `AlunosPage.tsx` | ✅ | — (n/a) | ✅ (2/3, 1 exceção doc.) | ✅ | **completo** |
| `NovaMatriculaModal.tsx` | — | — (n/a) | ✅ (3/3) | — | **completo** |
| `ComunicacaoPage.tsx` | ✅ | ✅ (TabBar local removido) | ✅ (2/2) | — | **completo** |
| `IntegracoesPage.tsx` | ✅ | ✅ | — (n/a) | — | **completo** |
| `SpecialPages.tsx` | ✅ | ✅ (Relatórios) | — (n/a) | — | **completo** |
| `ConfigPage.tsx` | ✅ | — (n/a) | ✅ (1/1) | ✅ | **completo** |
| `ProfessorView.tsx` | ✅ | não migrar (variante distinta, ok assim) | — | ✅ | **completo** |
| `ProfessoresPage.tsx` | ✅ | — | — | — | **completo** |
| `LoginPage.tsx` | ✅ | não migrar (switcher pill, estrutura incompatível) | — | — | **completo** |
| `FluxoMatricula.tsx` | ✅ | — (n/a) | não migrar (estilo público, ok assim) | ✅ | **completo** |
| *(restantes ~20 páginas sem botões/tabs/selects duplicados a consolidar)* | ✅ sombras já 100% | n/a | n/a | ✅ já 100% | **completo** |

**Nota sobre botões (~190 raw `<button>`):** não migrados para `Button.tsx` nesta ronda — a maioria não são "botões customizados divergentes do padrão", são elementos de UI com lógica própria (toggles, pills de filtro, linhas de lista clicáveis) onde `<button>` é só o elemento semântico correcto, não um CTA a padronizar. Os CTAs genéricos (primário/secundário) que faziam sentido consolidar já usam `Button.tsx` na maioria das páginas correntes; os restantes ficam documentados aqui para uma ronda futura dedicada, caso quantifiquem-se como uma inconsistência real (ex: outro `shadow-red`/gradiente a escapar).

## FASE 4 — QA

- [x] `tsc --noEmit` limpo após cada lote (verificado repetidamente ao longo da sessão)
- [x] `eslint .` sem novos erros após cada lote (23 avisos pré-existentes confirmados sem relação, inalterados)
- [x] `npm run build` completo após cada lote
- [x] Sem `stylelint` configurado no projeto (confirmado — não aplicável)
- [x] Verificação visual real (Playwright, login + navegação) em 9 páginas pós-migração — **0 erros de consola/página**, sem regressão

## Ronda 2 — Botões primários/secundários genuinamente duplicados

Motivada por um screenshot real: o botão "Registar" em Graduação mostrava um halo vermelho (`shadow-red`) e `rounded-[7px]` em vez de um radius da escala. **Causa raiz confirmada:** o código-fonte já não tinha esse `shadow-red` (removido na Ronda 1) — era cache do service worker da PWA (`vite-plugin-pwa`, modo `generateSW`) a servir um bundle antigo. Recomendo hard-refresh / limpar dados do site se voltar a ver isto depois de eu alterar código.

Aproveitei para fazer a "migração em massa do que for pertinente" pedida:

- **`rounded-[10px]` → `rounded-md`** em 12 ficheiros (34 ocorrências) — substituição 1:1 exata (`--radius-md` já é 10px), zero mudança visual, pura correção de token.
- **`rounded-[7px]` → `rounded-sm`/`rounded-md`** nos 3 restantes (2 botões em `GraduacaoPage.tsx`, 1 tile de ícone em `SpecialPages.tsx`).
- **13 botões estáticos primário/secundário migrados para `Button.tsx`**, depois de filtrar programaticamente ~36 candidatos brutos e excluir toggles/pills com estado condicional (que não são o mesmo componente, são multi-estado por natureza): `App.tsx` (×3), `AlunosPage.tsx`, `CheckinPage.tsx` (×3), `ComunicacaoPage.tsx`, `ConfigPage.tsx`, `GraduacaoPage.tsx` ("Registar" — o botão do screenshot), `IntegracoesPage.tsx`, `PendentesNumerario.tsx`, `SpecialPages.tsx` (×2), `MeuCheckin.tsx`, `PortalAluno.tsx`, `ProfessorView.tsx`.
- **Não migrados, deliberadamente:** botões com estado green/amber de sucesso-de-teste (`IntegracoesPage.tsx` "Testar" Stripe/TOConline — 3 estados, não é primary/secondary), `GraduacaoPage.tsx` "Notificar todos" (cor de marca WhatsApp legítima, só corrigido o radius), `SpecialPages.tsx` "Gerir →"/tooltips de gráfico (tamanho muito menor que qualquer variante do `Button.tsx`).

**Verificação:** `tsc`, `eslint`, `npm run build` limpos. Varredura visual Playwright com **contexto novo, service worker bloqueado** (`serviceWorkers: 'block'`) para garantir que não estava a ver cache — 0 erros em 7 páginas. Confirmei por screenshot que "Registar" em Graduação já não tem sombra e agora usa o mesmo tratamento visual (maiúsculas, `rounded-sm`) que "Kiosk"/"Nova Turma"/etc.

## Ronda 3 — Status pills e "rainbow" de cores arbitrárias

Motivada por 3 screenshots reais apontando o mesmo problema de fundo: cada página tinha inventado a sua própria linguagem visual para "estado" (badges âmbar/verde ad-hoc, ícones de alerta, tiles coloridos sem critério) em vez de usar o `Badge.tsx` já existente (`neutral/brand/success/warning/danger`). Isto contradiz diretamente a própria correção da Ronda 2 sobre "Notificar todos" — nessa altura mantive o verde do WhatsApp como "cor de marca legítima"; o utilizador corrigiu explicitamente que não queria isso, por isso a exceção foi revertida.

- **Graduação → banner "N alunos elegíveis":** removida a caixa âmbar + `BoltIcon`; agora é um card neutro (`border-border bg-card`) com `<Badge color="brand">`. O botão "Notificar todos" deixou de ser um `<button>` verde WhatsApp em bruto e passou a `<Button variant="secondary">`, consistente com o resto da página.
- **Relatórios → tira de KPIs:** os indicadores "OK"/"Atenção" (texto solto + ícone check/triângulo) foram substituídos por `<Badge color="success"|"warning">`, alinhado à direita de cada card.
- **Integrações:**
  - `StatusDot` (bolinha colorida + texto com hex cravado) → `<Badge>` (usado nas 4 pills do topo, no cabeçalho Stripe/TOConline e na lista de webhooks).
  - Os 4 cards do "Fluxo de Pagamento" (verde/vermelho/roxo/verde-WhatsApp por ícone) → tile único `bg-gb-red-glow` + ícone `text-gb-red`, igual ao usado na fila de passos acima.
  - Emoji de bandeira 🇵🇹 no tile do TOConline (viola a regra do projeto de usar FontAwesome exclusivamente) → ícone `ReceiptPercentIcon` a vermelho.
- **Configurações:**
  - Tiles de ícone de secção com cores inventadas sem marca real por trás (TOConline navy `#0E2D52`, Academia preto `#1A1A1A`, GPS Fence verde `#064E3B`, Email navy `#1E3A5F`, Compliance roxo `#2D1B69`) → unificados em `bg-gb-red-glow` + `text-gb-red`. Mantidas as cores reais de marca (Stripe roxo `#635BFF`, WhatsApp verde `#075E54`) — são identificadores de produtos de terceiros, não decoração.
  - "Estado dos Serviços TOConline" (OK/Pendente), "Templates aprovados" (aprovado/pendente), pill "Ativo/Inativo" de cada membro da equipa, badge "PT" na sidebar → todos convertidos para `<Badge>`.
  - Badges de identidade (papel do utilizador — superadmin/admin/professor/atendimento, cores das faixas) mantidos como estão: são um sistema categórico legítimo, não um indicador de estado bom/mau.

**Verificação:** `tsc`, `eslint`, `npm run build` limpos. Varredura Playwright (contexto novo, `serviceWorkers: 'block'`) por Graduação, Relatórios, as 4 tabs de Integrações e as 7 secções de Configurações — 0 erros de consola, confirmado por screenshot que os badges e tiles renderizam de forma consistente em todas.

## Ronda 4 — Anel de foco visível a mais (`focus-visible:ring-*`)

Motivada por screenshot: um retângulo vermelho arredondado a envolver o item "TOConline" na sidebar de Configurações, mesmo sem interação aparente. Não é bug de um componente específico — é o padrão `outline-none focus-visible:ring-2 focus-visible:ring-gb-red` (box-shadow via Tailwind `ring`), repetido em **527 pontos** do código como classes utilitárias soltas em cada botão. O motivo de aparecer "sozinho" é heurística de `:focus-visible` do browser do utilizador (tipicamente Safari/WebKit trata cliques de rato em `<button>` como foco "visível" e mantém o anel, ao contrário do Chromium — por isso não reproduzia no Playwright).

Em vez de editar os 527 pontos um a um, a correção foi um único reset global em `src/index.css`, fora de `@layer base` (para ficar acima da layer de utilities do Tailwind na cascata e sobrepor-se a qualquer `focus-visible:ring-*`/`focus:ring-*` sem precisar de `!important` em cada classe):

```css
:focus, :focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
```

**Verificação:** `tsc`, `npm run build` limpos. Confirmado por Playwright que, mesmo forçando foco por teclado (`.focus()`) no botão "TOConline" da sidebar — o cenário que reproduz o anel — o `box-shadow` computado é `none`.

**Nota de acessibilidade (não pedida, mas relevante):** isto remove por completo o indicador visual de foco por teclado em toda a app, não só o efeito indesejado no rato/Safari. Se no futuro for preciso navegação por teclado (Tab) com indicação visível, a correção terá de ser mais cirúrgica (ex: manter o anel só em `:focus-visible` e usar `:focus:not(:focus-visible)` para o caso do clique). Por agora segui a instrução literal — "deve sumir completamente em todas as partes da app".

## Ronda 5 — A borda "curva" na sidebar de Configurações não vem do código atual

O utilizador voltou a mostrar a borda vermelha arredondada à volta do item ativo "TOConline" na sidebar, mesmo depois da Ronda 4. Investiguei a fundo antes de tocar em código, porque a Ronda 4 já tinha sido verificada (o `box-shadow` computado no elemento focado é `none`, confirmado por Playwright) — não fazia sentido reaparecer por foco.

**O que verifiquei, e porque descartei ser um bug de código atual:**
- Re-renderizei a sidebar em Playwright (contexto novo, service worker bloqueado, `deviceScaleFactor: 2` para nitidez) — o item ativo mostra só o tratamento esperado: fundo rosa claro + barra vermelha de 2px à esquerda, cantos retos (é a 2ª linha de uma lista partilhada, sem `border-radius` individual, sem gap para o item seguinte).
- Comparei com o histórico git: o layout de sidebar "desktop" (com descrição + badge "PT") só existe numa forma — `borderLeft: 2px` — tanto na branch `ep/ui` (onde tenho trabalhado) como em `main` (`e549767`, o ponto onde `ep/ui` foi criada). Não há nenhum commit dos últimos ~15 relevantes para este ficheiro que produza uma caixa vermelha arredondada com espaço a separar do item seguinte, à volta de um item com descrição + badge "PT" — esse padrão simplesmente não existe no código-fonte, atual ou passado.
- A única estrutura no código que tem esse visual exato (borda `1.5px` à volta, cantos arredondados, cor vermelha só quando ativo) é o `mobileTabs` — mas esse não mostra descrição nem badge "PT", só ícone + label. O screenshot do utilizador tem os dois, o que confirma tratar-se do layout desktop.

**Conclusão:** isto não é um bug no código atual — é quase de certeza o Service Worker da PWA (`generateSW`) a servir um bundle antigo, possivelmente de há vários commits atrás, no dispositivo do utilizador. Já tínhamos diagnosticado a mesma causa-raiz na Ronda 2; a diferença desta vez é que expliquei "faz hard-refresh" e isso não foi suficiente — o que faz sentido, porque `skipWaiting` + `clientsClaim` entregam o controlo ao novo Service Worker, mas não obrigam a página já aberta a recarregar-se; ela continua a correr o JavaScript antigo em memória indefinidamente até haver um reload real.

**Correção estrutural (não só um pedido de "experimenta outra vez"):** troquei o registo automático e "silencioso" do Service Worker por um registo manual em `src/main.tsx` via `virtual:pwa-register`, que força um reload único assim que um novo Service Worker assume o controlo (`controllerchange`), e verifica periodicamente por updates (a cada hora) para apanhar separadores deixados abertos muito tempo. `vite.config.ts` passou a `injectRegister: false` para não haver registo duplicado. Isto significa que, a partir do próximo deploy, uma aba aberta deixa de poder ficar presa numa versão antiga — atualiza-se sozinha.

**O que o utilizador precisa de fazer agora, uma única vez:** como o próprio reload automático só existe a partir de agora, é preciso limpar a cache manualmente desta vez — nas Definições do browser (não um simples refresh): no telemóvel, isto costuma ser "Limpar dados do site" nas definições do Safari/Chrome, ou desinstalar e reinstalar a PWA a partir do ecrã principal.

**Verificação:** `tsc`, `eslint`, `npm run build` limpos — o build passou a gerar `workbox-window` no bundle (prova de que o registo manual está a ser usado) e deixou de gerar o antigo `registerSW.js` automático.

## Estado final

Fases 1, 2 e 4 completas. Fase 3: Lotes A e D 100%; Lotes B e C 100% dos padrões genuinamente consolidáveis; Ronda 2 fechou a lacuna de botões primários/secundários realmente duplicados; Ronda 3 unificou os indicadores de estado e tiles de ícone dispersos por Graduação, Relatórios, Integrações e Configurações num único sistema (`Badge.tsx` + tile `bg-gb-red-glow`/`text-gb-red`); Ronda 4 removeu globalmente o anel de foco (`box-shadow`/`outline`); Ronda 5 substituiu o registo automático do Service Worker por um registo manual que força reload numa atualização, para que "a app está desatualizada no dispositivo" deixe de ser uma causa recorrente de reports de bugs fantasma.
