<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark.svg">
  <img src="./assets/logo-light.svg" width="350" alt="More Money Logo" />
</picture>

### Organize suas finanças com facilidade.

Aplicação web de finanças pessoais, simples e rápida: receitas, despesas, carteiras e cartões de crédito em um só lugar.

<br />

<a href="https://domoremoney.com.br/"><img src="https://img.shields.io/badge/Deploy-Online-000?style=for-the-badge&logo=vercel" alt="Deploy" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="Licença MIT" /></a>
<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
<img src="https://img.shields.io/badge/PostgreSQL-Neon-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />

**[Acessar o More Money](https://domoremoney.com.br/)**

</div>

---

## Sobre

O **More Money** ajuda a organizar as finanças pessoais sem a complexidade das planilhas e dos apps tradicionais. A proposta é ter poucos cliques, uma interface limpa e números que fazem sentido de imediato.

Feito para estudantes, CLT, freelancers, autônomos e quem está começando a se organizar.

## Funcionalidades

- **Dashboard** com saldo total, saldo por carteira, receitas, despesas, evolução mensal e despesas por categoria.
- **Lançamentos** de receitas e despesas (criar, editar, excluir), com busca por texto e filtros por tipo e categoria.
- **Visualização por período**: a lista abre no mês atual e permite trocar para ano, tudo ou um período personalizado. O mesmo seletor é usado no dashboard.
- **Carteiras** (Física e Digital): cada lançamento pertence a uma carteira.
- **Categorias** personalizadas por usuário.
- **Cartões de crédito** com faturas, fechamento manual ou automático, pagamentos parciais ou totais e estorno.
- **Contas de usuário**: cadastro, login, recuperação e alteração de senha. Perfis `ADMIN` e `PADRAO`.
- Interface responsiva, com tema claro e escuro.

### Como o dashboard calcula os números

- O período padrão é o **mês atual**. Receitas, despesas, gráficos e últimos lançamentos seguem o período escolhido.
- O **saldo total** (e o de cada carteira) considera todo o histórico **até hoje**, independente do filtro. Lançamentos e pagamentos com data futura só entram no saldo quando a data chegar.
- Compras no cartão não mexem no saldo: só o **pagamento da fatura** conta, na data efetiva e na carteira escolhida.

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, Radix UI, Recharts, lucide-react |
| Backend | API Routes do Next.js, NextAuth.js (JWT), Zod |
| Banco de dados | PostgreSQL (Neon) com SQL puro via `pg` |
| E-mail | Resend (recuperação de senha) |
| Infra | Vercel |

## Rodando localmente

**Pré-requisitos:** Node.js 20+ e um banco PostgreSQL (local ou um projeto no [Neon](https://neon.tech)).

```bash
git clone https://github.com/devpetry/more-money.git
cd more-money
npm install
```

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=uma-chave-secreta-longa
RESEND_API_KEY=
```

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL. Em produção no Neon, use a string com *pooling* (host com `-pooler`). |
| `NEXTAUTH_URL` | URL base da aplicação. |
| `NEXTAUTH_SECRET` | Segredo usado para assinar as sessões (JWT). |
| `RESEND_API_KEY` | Envio de e-mails de recuperação de senha. |

Aplique o schema e inicie o servidor:

```bash
npm run db:migrate
npm run dev
```

A aplicação fica em http://localhost:3000. Crie sua conta pela tela de cadastro.

<details>
<summary>Criar um usuário administrador manualmente</summary>

Gere o hash bcrypt da senha e rode, trocando o placeholder:

```sql
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, criado_em, atualizado_em)
VALUES ('Administrador', 'admin@moremoney.com', '$2b$10$COLE_AQUI_O_HASH_DA_SENHA', 'ADMIN', NOW(), NOW());

-- Carteiras do administrador
INSERT INTO carteiras (usuario_id, nome)
SELECT u.id, n.nome
FROM usuarios u CROSS JOIN (VALUES ('Física'), ('Digital')) AS n(nome)
WHERE u.email = 'admin@moremoney.com'
ON CONFLICT (usuario_id, nome) DO NOTHING;
```

</details>

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (roda as migrations antes, só em produção na Vercel) |
| `npm start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm test` | Testes (`node:test`) |

## Estrutura do projeto

```txt
src/
├── app/
│   ├── api/            # rotas: auth, lancamentos, categorias, carteiras, cartoes, dashboard, usuarios
│   └── (screens)/      # telas: acesso (login, cadastro, senhas) e app (dashboard, listas)
├── components/         # componentes de tela e de UI
├── lib/                # banco, autenticação, regras de fatura, dashboard e períodos
├── schemas/            # validações com Zod
└── styles/
db/migrations/          # schema versionado (SQL)
scripts/                # build e migrate
tests/                  # testes
```

## Banco de dados

PostgreSQL com consultas SQL puras (`query` de `@/lib/db`). Todos os IDs são `uuid` (`gen_random_uuid()`) e o schema é versionado em `db/migrations/`.

### Diagrama ER

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        varchar nome
        varchar email
        varchar senha_hash
        timestamptz criado_em
        timestamptz atualizado_em
        varchar token_recuperacao
        timestamptz expiracao_token_recuperacao
        tipo_usuario_enum tipo_usuario
        timestamptz data_exclusao
    }

    CATEGORIAS {
        uuid id PK
        varchar nome
        varchar tipo
        uuid usuario_id FK
        timestamptz criado_em
        timestamptz atualizado_em
    }

    CARTEIRAS {
        uuid id PK
        varchar nome
        uuid usuario_id FK
        timestamptz criado_em
        timestamptz atualizado_em
    }

    LANCAMENTOS {
        uuid id PK
        text descricao
        numeric valor
        varchar tipo
        date data
        uuid categoria_id FK
        uuid carteira_id FK "nula em compra de cartão"
        uuid fatura_id FK "preenchido só em compra de cartão"
        uuid usuario_id FK
        timestamptz criado_em
        timestamptz atualizado_em
    }

    CARTOES {
        uuid id PK
        varchar nome
        uuid usuario_id FK
        smallint dia_fechamento
        smallint dia_vencimento
        timestamptz criado_em
        timestamptz atualizado_em
    }

    FATURAS {
        uuid id PK
        uuid cartao_id FK
        uuid usuario_id FK
        date ciclo "dia 1 do mês do ciclo"
        date data_fechamento
        date data_vencimento
        timestamptz fechada_em "só fechamento manual"
        timestamptz criado_em
        timestamptz atualizado_em
    }

    PAGAMENTOS_FATURA {
        uuid id PK
        uuid fatura_id FK
        uuid usuario_id FK
        uuid carteira_id FK
        numeric valor
        date data
        timestamptz estornado_em
        timestamptz criado_em
    }

    USUARIOS ||--o{ CATEGORIAS : cria
    USUARIOS ||--o{ CARTEIRAS : possui
    CARTEIRAS ||--o{ LANCAMENTOS : recebe
    USUARIOS ||--o{ LANCAMENTOS : registra

    CATEGORIAS ||--o{ LANCAMENTOS : categoriza
    USUARIOS ||--o{ CARTOES : possui
    CARTOES ||--o{ FATURAS : gera
    FATURAS ||--o{ LANCAMENTOS : agrupa
    FATURAS ||--o{ PAGAMENTOS_FATURA : recebe
    CARTEIRAS ||--o{ PAGAMENTOS_FATURA : paga
```


### Cartões e faturas

- Cada cartão tem dias padrão de fechamento e vencimento. A fatura de cada mês (`ciclo`) é criada só quando necessário (compra, fechamento manual ou ajuste de datas) e guarda suas próprias datas, que podem ser ajustadas enquanto ela não estiver paga. Dias maiores que o mês (ex.: 31 em fevereiro) usam o último dia do mês; o vencimento fica no mês do fechamento se o dia for posterior ao do fechamento, senão no mês seguinte.
- Compra de cartão é um lançamento de **despesa** com `fatura_id` e sem `carteira_id`: não altera o saldo das carteiras. Compra feita no dia do fechamento entra na fatura seguinte.
- O estado da fatura é **derivado**, não gravado: *aberta*, *fechada com pagamento pendente*, *parcialmente paga* ou *paga*. Fechada = fechamento manual (`fechada_em`) ou `data_fechamento` já alcançada em `America/Sao_Paulo` (fechamento automático, sem job agendado). Fatura fechada de valor zero é considerada paga, sem pagamento fictício.
- Pagamentos (parciais ou totais) ficam em `pagamentos_fatura` com data efetiva e carteira; o estorno preserva o registro (`estornado_em`). Só o pagamento reduz o saldo da carteira escolhida e entra nos indicadores do dashboard, distribuído entre as categorias na proporção dos lançamentos da fatura.
- Fatura paga não aceita inclusão, edição ou exclusão de lançamentos nem ajuste de datas (estorne o pagamento antes). Em fatura fechada e não paga essas alterações são permitidas com aviso, desde que o total pago não passe do total da fatura.
- Pagamentos, estornos e alterações de lançamentos de um cartão rodam em transação, travando a linha do cartão (`SELECT ... FOR UPDATE`).
- Cartão com faturas (histórico) não pode ser excluído (FK sem `CASCADE`).

## Testes

`npm test` usa o `node:test` nativo (sem dependências). Os testes de regras puras (datas, faturas, períodos, schemas) rodam sempre; os de integração só rodam com `TEST_DATABASE_URL` apontando para um Postgres **descartável** (o nome do banco precisa conter `test`; o schema `public` é recriado a cada execução):

```bash
docker run -d --rm --name mm-test-pg -e POSTGRES_PASSWORD=teste -e POSTGRES_DB=more_money_test -p 127.0.0.1:55432:5432 postgres:16-alpine
TEST_DATABASE_URL=postgres://postgres:teste@127.0.0.1:55432/more_money_test npm test
```

## Migrations

A estrutura do banco (sem dados) é versionada em `db/migrations/*.sql`, aplicadas em ordem alfabética e registradas na tabela `schema_migrations`.

- Toda mudança de estrutura vira um novo arquivo (ex.: `0002_adicionar_coluna_x.sql`), commitado no mesmo PR da mudança de código. Não edite migrations já aplicadas.
- Localmente: `npm run db:migrate` aplica as pendentes no banco da `DATABASE_URL`.
- Em produção: o `npm run build` da Vercel roda as migrations pendentes antes do `next build` quando `VERCEL_ENV=production`. Se a migration falhar, o build falha e a versão anterior continua no ar. Previews não alteram o banco.
- Prefira mudanças aditivas (criar tabela/coluna). Renomear ou apagar coluna deve ser feito em duas etapas, pois o código antigo continua no ar durante o build.

### Histórico: carteiras (migração em duas etapas)

Cada usuário tem as carteiras **Física** e **Digital** (criadas no cadastro). A `0003_carteiras.sql` cria a tabela, associa os lançamentos existentes à Digital e deixa `lancamentos.carteira_id` **nullable**, com um trigger temporário (`lancamentos_carteira_padrao`) que preenche a Digital para o código antigo, que ainda não envia `carteira_id` durante o build. Ela aborta se houver lançamentos com `usuario_id` NULL.

**Etapa 2** é uma nova migration, em PR separado. Ela **não** deve ser incluída no mesmo deploy da 0003 (as migrations rodam antes do build, e o código antigo ainda estaria no ar).

Pré-condições, nesta ordem:

1. O deploy com o código da issue #22 foi promovido para produção e está estável (o código novo é o deployment atual).
2. Verifique os lançamentos sem carteira (o resultado esperado é 0; um valor maior é tratado pela própria etapa 2, mas investigue a origem):
   ```sql
   SELECT count(*) FROM lancamentos WHERE carteira_id IS NULL;
   ```
3. Faça o deploy da etapa 2 **logo após** a promoção do código novo. Usuários cadastrados pelo código antigo durante a janela de deploy podem estar sem carteiras (o trigger só cria a Digital quando eles lançam algo); sem a etapa 2 eles não têm carteira para escolher no modal. A etapa 2 cria as carteiras ausentes.

> **Sem rollback após a etapa 2.** Com o trigger removido e `carteira_id` `NOT NULL`, o código anterior à issue #22 não consegue criar lançamentos (nem usuários com carteiras). Não reverta o deployment para versões anteriores sem antes definir um procedimento de compatibilidade específico.

SQL da etapa 2:

```sql
INSERT INTO carteiras (usuario_id, nome)
SELECT u.id, n.nome FROM usuarios u CROSS JOIN (VALUES ('Física'), ('Digital')) n(nome)
ON CONFLICT (usuario_id, nome) DO NOTHING;
UPDATE lancamentos l SET carteira_id = c.id FROM carteiras c
WHERE l.carteira_id IS NULL AND c.usuario_id = l.usuario_id AND c.nome = 'Digital';
DROP TRIGGER lancamentos_carteira_padrao ON lancamentos;
DROP FUNCTION lancamentos_carteira_padrao();
ALTER TABLE lancamentos ALTER COLUMN carteira_id SET NOT NULL;
```

## Autor

**João Augusto Petry**, desenvolvedor full-stack e estudante de Engenharia de Software.

- GitHub: https://github.com/devpetry
- LinkedIn: https://www.linkedin.com/in/joopetry/

## Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE).

<div align="center">

More Money © 2026

</div>
