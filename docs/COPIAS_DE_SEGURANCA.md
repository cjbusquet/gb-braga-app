# Cópias de segurança da base de dados

## Como funciona
- Todos os dias às 03:17 (UTC) o GitHub corre `.github/workflows/backup-base-dados.yml`.
- Exporta a base de dados de produção (Supabase) — esquemas `public`, `private`, `auth` (contas de utilizador) e `storage` (metadados).
- Verifica que a cópia contém as tabelas principais e as contas de utilizador.
- **Cifra** o ficheiro com AES-256. O repositório é público: sem a frase-passe o ficheiro é ilegível.
- Guarda o ficheiro cifrado no GitHub durante **30 dias** (separador **Actions** → execução → secção *Artifacts*).
- Custo: zero (GitHub Actions é gratuito em repositórios públicos).

**Não inclui:** os ficheiros de imagem (fotografias de perfil) guardados no Storage — só a lista desses ficheiros.

## Configuração inicial (uma vez)

### 1. Frase-passe da cópia
1. Crie uma frase-passe longa e aleatória (mínimo 20 caracteres, ideal 32+), por exemplo num gestor de palavras-passe.
2. Guarde-a **no gestor de palavras-passe**. Sem ela, as cópias não podem ser abertas — nem por si, nem por ninguém.

### 2. Endereço de ligação à base de dados
1. Supabase → projeto **GB BRAGA** → botão **Connect** (topo da página).
2. Escolha **Session pooler** e copie o endereço (começa por `postgresql://postgres.`…).
3. Substitua `[YOUR-PASSWORD]` pela palavra-passe da base de dados.
   - Se não a souber: **Project Settings → Database → Reset database password**. Isto **não** afeta a app (a app usa chaves de API, não esta palavra-passe).

### 3. Guardar os dois segredos no GitHub
GitHub → repositório → **Settings → Secrets and variables → Actions → New repository secret**:
| Nome | Valor |
|---|---|
| `SUPABASE_DB_URL` | o endereço do passo 2 |
| `BACKUP_PASSPHRASE` | a frase-passe do passo 1 |

Nunca coloque estes valores em ficheiros, no chat ou em mensagens.

### 4. Primeira execução
GitHub → **Actions** → **Cópia de segurança da base de dados** → **Run workflow**. Deve terminar a verde em 1–3 minutos.

## Como restaurar (em caso de perda de dados)
> Fazer primeiro num projeto Supabase **novo/de teste**, nunca por cima da produção sem confirmar.

1. Descarregar o ficheiro `.dump.gpg` em **Actions** → execução desejada → *Artifacts* (vem dentro de um `.zip`).
2. Decifrar (num computador com GnuPG):
   ```bash
   gpg --decrypt --output backup.dump gbbraga-backup-AAAA-MM-DDTHHMMZ.dump.gpg
   ```
   (pede a frase-passe)
3. Num projeto Supabase novo, obter o endereço *Session pooler* (como no passo 2) e:
   ```bash
   # contas de utilizador (logins)
   pg_restore --dbname "$NOVO_DB_URL" --data-only --table=users -n auth backup.dump
   # tabelas, funções, políticas e dados da app
   psql "$NOVO_DB_URL" -c "create schema if not exists private"
   pg_restore --dbname "$NOVO_DB_URL" --no-owner -n public -n private backup.dump
   ```
4. Verificar contagens (alunos, contas, planos) e apontar a app (Vercel) para o novo projeto.

Procedimento testado em 14/10/2026 numa base de dados local com dados fictícios: exportação, verificação, cifra, decifra, recusa de frase-passe errada e restauro (contas, 26 tabelas, políticas e dados) — sem erros. A primeira execução real deve ser confirmada no GitHub.

## Cuidados
- O GitHub suspende tarefas agendadas em repositórios sem atividade durante 60 dias. Se isso acontecer, aparece um aviso em **Actions** → basta reativar.
- A cópia contém dados pessoais de alunos (RGPD). Os ficheiros decifrados devem ser apagados após o uso.
- Trocar a frase-passe: atualizar o segredo `BACKUP_PASSPHRASE`; as cópias antigas continuam a abrir com a frase antiga.
