# 15 — Manual do Administrador

**Gracie Barra Braga — Plataforma de Gestão**  
Versão 1.0 · Junho 2026

---

## Bem-vindo

Este manual destina-se aos utilizadores com perfil **Administrador** ou **Super-Administrador**. Como administrador, tem acesso completo a todas as funcionalidades de gestão da academia: alunos, financeiro, comunicação, equipa e configurações.

---

## 1. Acesso ao Sistema

### 1.1 Login

1. Abrir o browser e navegar para `https://app.gbbraga.com`
2. Inserir o seu **email** e **password**
3. Clicar em **Entrar**

Se esqueceu a password, contacte o Super-Administrador para envio de link de recuperação.

### 1.2 Primeiro Acesso (conta nova)

Se recebeu um email de convite:
1. Clicar no link do email (válido por 24h)
2. Definir a sua password (mínimo 6 caracteres)
3. Clicar em **Confirmar Password**
4. A plataforma abre automaticamente

---

## 2. Interface Principal

### 2.1 Navegação (Desktop)

A barra lateral esquerda contém todos os módulos disponíveis:

| Ícone | Módulo | Acesso |
|---|---|---|
| ▣ | Dashboard | Admin, Atendimento, Professor |
| 👥 | Alunos | Admin, Atendimento, Professor |
| ▤ | Turmas | Admin, Atendimento |
| ✓ | Check-in | Admin, Atendimento, Professor |
| € | Financeiro | Admin |
| ◈ | Graduação | Admin, Professor |
| ✉ | Comunicação | Admin, Atendimento |
| 💬 | Chat | Admin, Atendimento |
| ◻ | Contratos | Admin |
| ↗ | Relatórios | Admin |
| ⛓ | Integrações | Admin |
| ⚙ | Config | Admin |

### 2.2 Navegação (Telemóvel)

Barra inferior com os 4 módulos mais usados:
- **Dashboard** · **Alunos** · **Financeiro** · **Config**

Restantes módulos: tocar no avatar (canto superior direito) → sidebar

### 2.3 Perfil e Logout

- **Avatar** (canto superior): clique para editar o seu perfil, foto e password
- **Terminar sessão**: parte inferior da sidebar (botão vermelho)

---

## 3. Dashboard

O Dashboard apresenta os KPIs principais da academia em tempo real.

### 3.1 Métricas Principais

| KPI | Descrição |
|---|---|
| Total Alunos | Número total de alunos registados |
| Alunos Ativos | Alunos com status "ativo" |
| Receita Mensal | Pagamentos recebidos este mês |
| Receita Prevista | Mensalidades pendentes deste mês |
| Inadimplentes | Alunos com pagamentos em atraso |
| Novos Alunos | Matrículas nos últimos 30 dias |

### 3.2 Botão "Gerir"

No SuperAdmin Dashboard, o botão "Gerir →" dirige para o módulo de gestão da academia selecionada.

---

## 4. Gestão de Alunos

### 4.1 Ver Lista de Alunos

Menu → **Alunos**

A lista mostra todos os alunos com:
- Nome, email, telefone
- Faixa e grau
- Plano e status (ativo/inativo/suspenso)
- Frequência (% de presenças)

**Filtros disponíveis:**
- Status (Ativo / Inativo / Suspenso)
- Faixa
- Plano
- Pesquisa por nome ou email

### 4.2 Adicionar Novo Aluno (staff)

1. Clicar em **+ Novo Aluno**
2. Preencher os dados pessoais (nome, email, telefone, data nascimento, NIF)
3. Selecionar o plano
4. Escolher método de pagamento
5. Se menor de idade: preencher dados do responsável
6. Clicar em **Guardar**

### 4.3 Editar Aluno

1. Clicar no nome do aluno na lista
2. Editar os campos necessários
3. Clicar em **Guardar alterações**

### 4.4 Alterar Status

Na ficha do aluno, campo **Status**:
- **Ativo** — aluno pode aceder à academia e app
- **Inativo** — matrícula suspensa temporariamente
- **Suspenso** — expulso ou cancelamento definitivo

### 4.5 Matrícula Pública

Para partilhar o link de auto-matrícula:
- Menu → **Matrícula** → copiar o link público
- O aluno preenche os seus dados e assina o contrato online

---

## 5. Turmas e Horários

### 5.1 Ver Horário

Menu → **Turmas**

**Vista Calendário** (padrão):
- Desktop: grelha semanal SEG–SÁB, com horários nas linhas
- Telemóvel: tabs por dia, com lista vertical

**Vista Lista:** clicar em ☰ para mudar para lista de cards

### 5.2 Filtros de Turmas

- **Todas** — todas as turmas
- **GI** — apenas turmas Gi (kimono)
- **NO GI** — sem kimono
- **Kids** — turmas infantis

### 5.3 Detalhe de Turma

Clicar num bloco de turma para ver:
- Professor, sala, capacidade
- Lista de alunos inscritos
- Taxa de ocupação

### 5.4 Adicionar/Editar Turma

1. Clicar em **+ Nova Turma** ou em "Editar" na turma
2. Preencher: nome, professor, horário, dias da semana, sala, capacidade
3. Clicar em **Guardar**

---

## 6. Check-in de Presenças

### 6.1 Registar Presença (Manual/Staff)

Menu → **Check-in**

1. Pesquisar o aluno por nome ou email
2. Clicar em **✓ Check-in**
3. A presença é registada com hora, data e método "manual"

### 6.2 Modo Quiosque (Kiosk)

Para colocar um tablet na receção em modo quiosque:
- Menu → **Check-in** → botão **Modo Quiosque**
- O aluno pode fazer o check-in autónomo no tablet

---

## 7. Financeiro

### 7.1 Ver Pagamentos

Menu → **Financeiro**

Lista todos os pagamentos com:
- Aluno, plano, valor, vencimento, status
- Filtros: status (pago/pendente/vencido), mês, aluno

### 7.2 Status de Pagamentos

| Status | Significado |
|---|---|
| 🟢 Pago | Pagamento confirmado |
| 🟡 Pendente | Aguarda pagamento |
| 🔴 Vencido | Prazo expirado |
| ⚫ Cancelado | Cancelado |

### 7.3 Registar Pagamento Manual

1. Clicar em **+ Novo Pagamento**
2. Selecionar o aluno
3. Inserir valor e data de pagamento
4. Método: Numerário ou Transferência
5. Clicar em **Guardar**

### 7.4 Aprovar Numerário

Menu → **Numerário** (Super-Admin apenas)

Lista os pedidos de pagamento em dinheiro de alunos:
1. Ver os detalhes do pedido
2. Clicar em **Aprovar** ou **Rejeitar**
3. O aluno é notificado por email

---

## 8. Graduações

### 8.1 Registar Graduação

Menu → **Graduação**

1. Selecionar o aluno
2. Escolher a nova faixa e grau
3. Adicionar observação (opcional)
4. Clicar em **Confirmar Graduação**

A graduação fica registada no histórico do aluno e a faixa é atualizada automaticamente.

### 8.2 Histórico de Graduações

Na lista de graduações, pode filtrar por:
- Aluno, data, professor, faixa

---

## 9. Comunicação

### 9.1 Enviar Email

Menu → **Comunicação** → tab **Enviar**

1. **Para:** selecionar destinatário(s)
   - Individual: pesquisar aluno
   - Grupo: "Todos os alunos ativos", "Alunos com pagamento vencido", etc.
2. **Assunto:** escrever o assunto
3. **Mensagem:** escrever o corpo do email
   - Ou clicar em **Usar Template** para carregar um template pré-definido
4. Clicar em **Enviar**

O email é enviado via Resend (ou SMTP configurado) e o registo fica no histórico.

### 9.2 Histórico de Mensagens

Tab **Histórico**: lista todas as mensagens enviadas com data, assunto e destinatário.

### 9.3 Gerir Templates

Tab **Templates**:

**Criar template:**
1. Clicar em **+ Novo Template**
2. Preencher nome, assunto, corpo
3. Clicar em **Guardar**

**Usar template:** clicar em **Usar →** no template desejado (preenche o formulário de envio)

**Apagar template:** clicar no ícone 🗑 (pede confirmação)

---

## 10. Contratos

### 10.1 Ver Contratos

Menu → **Contratos**

Lista todos os contratos com status:
- **Ativo** — contrato em vigor
- **Cancelado** — cancelado antes do fim
- **Expirado** — prazo concluído

### 10.2 Exportar Contrato (PDF)

Na ficha do contrato, clicar em **Exportar PDF**.

---

## 11. Configurações

### 11.1 Acesso

Menu → **Config** (Admin e Super-Admin)

Tabs disponíveis:
- **Academia** — dados gerais + GPS
- **Email** — configuração de email
- **Equipa** — gestão de staff
- **Planos** — planos de mensalidade

### 11.2 Configurar GPS Fence (Check-in)

Tab **Academia** → secção GPS:

1. Ir fisicamente para o centro da academia
2. Clicar em **📍 Capturar localização atual**
3. Ajustar o raio (metros) — recomendado: 100m
4. Clicar em **Guardar GPS**

Para testar:
1. Clicar em **Testar distância atual**
2. Vê a distância em metros e se está dentro do raio

### 11.3 Gerir Equipa

Tab **Equipa**:

**Adicionar membro:**
1. Clicar em **+ Convidar Staff**
2. Inserir email e função
3. Clicar em **Enviar convite** — o membro recebe email para definir password

**Editar membro:**
- Faixa, status ativo/inativo

**Repor password:**
- Clicar em **Enviar reset de password** na ficha do membro

---

## 12. Módulos (Super-Admin apenas)

### 12.1 Ativar/Desativar Módulos

Menu → **Módulos** (apenas Super-Admin)

Para cada módulo opcional, existe um toggle:
- **Ligado** (azul) — módulo visível para todos os utilizadores com permissão
- **Desligado** (cinzento) — módulo oculto para todos

**Módulos core** (não podem ser desativados):
- Dashboard, Alunos, Portal, Config, Perfil

As alterações propagam instantaneamente a todas as sessões abertas.

---

## 13. Perfil Pessoal

### 13.1 Editar Perfil

Clicar no avatar (canto superior) → **Perfil**

- **Foto:** clicar na câmara para carregar nova foto
- **Nome e Telefone:** editar e clicar em **Guardar**
- **Password:** inserir nova password e confirmar

---

## 14. Perguntas Frequentes

Ver `documentation/20-FAQ.md` → secção "Para Administradores".
