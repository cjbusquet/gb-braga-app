# 18 — Manual do Atleta (Aluno)

**Gracie Barra Braga — Área do Atleta**  
Versão 1.0 · Junho 2026

---

## Bem-vindo à GB Braga!

A plataforma **app.gbbraga.com** é a tua área pessoal na academia. Aqui podes:
- Fazer check-in nas aulas
- Ver o teu histórico de presenças
- Acompanhar a tua evolução de faixa
- Gerir os teus pagamentos
- Receber mensagens da academia

---

## 1. Primeiro Acesso

### 1.1 Se recebeste um convite por email

1. Verifica o email — deves ter recebido um email com o assunto "Convite para a equipa GB Braga"
2. Clica no link **Definir Password**
3. Escolhe uma password (mínimo 6 caracteres)
4. Clica em **Confirmar Password**
5. A aplicação abre automaticamente

### 1.2 Se te estás a registar pela primeira vez

1. Vai a `https://app.gbbraga.com`
2. Clica em **Registar**
3. Preenche os teus dados pessoais
4. Seleciona o teu plano
5. Assina o contrato digitalmente
6. Paga via cartão (Stripe) ou solicita pagamento em dinheiro

---

## 2. Instalar a App no Telemóvel (PWA)

A app funciona diretamente no browser mas podes instalá-la no teu telemóvel para acesso rápido:

**iPhone (Safari):**
1. Abre `app.gbbraga.com` no Safari
2. Toca no botão de partilha ↑
3. Seleciona "Adicionar ao Início"

**Android (Chrome):**
1. Abre `app.gbbraga.com` no Chrome
2. Toca nos 3 pontos (menu)
3. Seleciona "Adicionar ao início"

A app funciona mesmo sem internet para ver os teus dados guardados!

---

## 3. Portal Principal

Depois de fazer login, vês o teu **Portal** pessoal com:
- O teu nome e faixa atual
- Resumo das últimas presenças
- Próxima graduação estimada
- Mensagens da academia

**Navegação (telemóvel):** barra inferior com 4 botões:
- 🏠 Portal · ✓ Check-in · 📋 Aulas · 🥋 Evolução

---

## 4. Check-in na Aula (GPS)

### 4.1 Como fazer check-in

1. Quando chegares à academia, abre a app
2. Toca em **Check-in** (barra inferior)
3. A app pede permissão para usar a tua localização — diz **Permitir**
4. Se estiveres dentro da academia (no raio configurado):
   - Vês ✅ com a distância (ex: "A 12m da academia")
   - Toca em **Fazer Check-in**
   - Vês a confirmação e a aula aparece no histórico

### 4.2 O que significa cada estado

| Estado | Significado | O que fazer |
|---|---|---|
| ✅ "Dentro da academia (Xm)" | Estás dentro do raio GPS | Faz o check-in! |
| 📍 "Fora da academia (Xm)" | Estás longe demais | Aproxima-te da academia |
| ⚠️ "A obter localização..." | A aguardar GPS | Espera alguns segundos |
| ❌ "Localização não disponível" | GPS bloqueado | Ativa a localização nas definições |

### 4.3 Problemas com GPS

**O GPS não funciona:**
- iPhone: Definições → Privacidade → Serviços de Localização → Safari → "Enquanto uso a app"
- Android: Definições → Apps → Chrome → Permissões → Localização → "Permitir sempre"

**Estás na academia mas diz "Fora":**
- O GPS pode demorar alguns segundos a atualizar — aguarda e tenta novamente
- Vai para o centro da sala principal (melhor sinal GPS)
- Contacta a receção para fazer check-in manual

### 4.4 Histórico de Check-ins

Na página de Check-in, vês os últimos 5 check-ins com data e hora.

---

## 5. Minhas Aulas

Menu → **Aulas**

Vês o histórico completo de todas as tuas presenças:
- Data e hora de cada aula
- Turma frequentada
- Método de check-in (GPS, manual)

Usa os filtros para ver por mês ou turma específica.

---

## 6. A Minha Evolução

Menu → **Evolução**

Acompanha o teu progresso no Jiu-Jitsu:

### 6.1 Faixa Atual

Mostra a tua faixa atual com a cor correta e o número de graus (listras).

### 6.2 Progressão de Faixas

**Adultos:**  
Branca → Azul → Roxa → Marrom → Preta

**GB Kids (até 15 anos):**  
Cinza/Branca → Cinza → Cinza/Preta → Amarela/Branca → Amarela → Amarela/Preta → Laranja/Branca → Laranja → Laranja/Preta → Verde/Branca → Verde → Verde/Preta → Azul

### 6.3 Histórico de Graduações

Lista de todas as tuas promoções com:
- Data da graduação
- Faixa anterior e nova
- Professor que promoveu
- Observações

---

## 7. O Meu Financeiro

Menu → **Financeiro** (se ativado)

### 7.1 Estado das Mensalidades

Vês todas as tuas mensalidades com estado:
- 🟢 **Pago** — mensalidade liquidada
- 🟡 **Pendente** — aguarda pagamento
- 🔴 **Vencido** — prazo expirado (contacta a receção)

### 7.2 Pagamento via Stripe

Se tens pagamento automático por cartão:
- As mensalidades são debitadas automaticamente no dia configurado
- Recebes email de confirmação a cada pagamento

### 7.3 Pagamento em Dinheiro

Se pagas em dinheiro (numerário):
- A tua mensalidade aparece como "Pendente"
- Paga na receção
- O staff regista e o estado passa a "Pago"

---

## 8. Mensagens da Academia

Menu → **Mensagens** (se ativado)

Vês todas as mensagens enviadas pela academia:
- Avisos gerais
- Datas de graduação
- Eventos especiais
- Informações sobre aulas

---

## 9. Perfil Pessoal

Toca no teu avatar (canto superior) para aceder ao perfil.

### 9.1 Alterar Foto

1. Na página de Perfil, toca no círculo com o teu avatar
2. Toca no ícone da câmara 📷
3. Seleciona uma foto da galeria
4. A foto é guardada automaticamente

### 9.2 Editar Nome e Telefone

1. Na secção "Dados Pessoais", edita os campos
2. Clica em **Guardar**

### 9.3 Alterar Password

1. Na secção "Segurança"
2. Insere a nova password (mínimo 6 caracteres)
3. Confirma a nova password
4. Clica em **Alterar Password**

---

## 10. Logout

Para terminar a sessão:
1. Toca no teu avatar (canto superior)
2. Toca em **Terminar sessão** (botão vermelho na parte inferior)

---

## 11. Perguntas Frequentes

**P: Esqueci a minha password. O que fazer?**  
R: Na página de login, clica em "Esqueci a password". Recebes um email com link para repor. Verifica a pasta de spam se não receberes em 5 minutos.

**P: A app não funciona offline?**  
R: A app carrega os dados quando tens internet e guarda-os temporariamente. Em modo offline, podes ver dados já carregados mas não podes fazer check-in (requer verificação GPS).

**P: O meu check-in não aparece no histórico.**  
R: Se o check-in foi manual (feito pelo staff), pode demorar alguns minutos. Se fizeste GPS check-in e não aparece, contacta a receção.

**P: Posso fazer check-in antes de sair de casa?**  
R: Não — o GPS valida que estás fisicamente na academia. O check-in só funciona dentro do raio configurado (tipicamente 100m da academia).

**P: A minha faixa está errada na app.**  
R: A faixa é atualizada pelo staff após cada graduação. Contacta a receção se houver um erro.

**P: Consigo usar a app noutro telemóvel?**  
R: Sim — o teu perfil está guardado na cloud. Faz login com o mesmo email e password em qualquer dispositivo.

---

## 12. Contactos de Suporte

**Academia GB Braga:**  
Rua Nova Santa Cruz 11, 4710-409 Braga  
📧 info@gbbraga.com  

**Em caso de problemas técnicos:**  
📧 Envia email para a receção descrevendo o problema e o teu dispositivo (iPhone/Android).
