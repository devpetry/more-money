<div align="center">

<img src="./assets/logo-temporaria-readme.png" width="350" alt="More Money Logo" />



### Organize suas finanças com facilidade.

Aplicação web de gerenciamento financeiro pessoal desenvolvida com foco em simplicidade, velocidade e experiência do usuário.

<br />

<a href="https://domoremoney.com.br/">
  <img src="https://img.shields.io/badge/Deploy-Online-000?style=for-the-badge&logo=vercel" />
</a>

<a href="LICENSE">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" />
</a>

<img src="https://img.shields.io/badge/status-MVP%20Concluído-success?style=for-the-badge" />

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/PostgreSQL-Database-blue?style=for-the-badge&logo=postgresql" />
<img src="https://img.shields.io/badge/TailwindCSS-Styling-38bdf8?style=for-the-badge&logo=tailwindcss" />

</div>

---

# ✨ Sobre o projeto

O **More Money** é uma plataforma de controle financeiro pessoal desenvolvida para ajudar usuários a organizarem suas finanças de forma simples, rápida e intuitiva.

O sistema permite:

- Controle de receitas e despesas
- Visualização financeira em tempo real
- Dashboard com saldo consolidado
- Histórico de movimentações
- Organização por categorias
- Gestão financeira minimalista

O projeto foi desenvolvido com foco em:

- UX First
- Performance
- Interface limpa
- Facilidade de uso
- Fluxos rápidos
- Responsividade

---

# 🌐 Acesse o projeto

## Produção

👉 https://domoremoney.com.br/

---

<!-- # 📸 Preview do sistema

## 🔐 Login

```md
![Login](./assets/login-print.png)
```

---

## 📊 Dashboard

```md
![Dashboard](./assets/dashboard-print.png)
```

---

## 💸 lançamentos

```md
![Transactions](./assets/lancamento-print.png)
```

---

## 📜 Histórico financeiro

```md
![History](./assets/historico-print.png)
```

--- -->

# 🚀 Funcionalidades

## ✅ Funcionalidades do MVP

- Cadastro de usuários
- Login e autenticação segura
- Dashboard financeiro
- CRUD de lançamentos
- CRUD de categorias
- Controle de receitas e despesas
- Histórico de movimentações
- Filtro por período
- Visualização de saldo
- Interface responsiva
- Sessões autenticadas com JWT

---

# 🎯 Público-alvo

- Estudantes
- Trabalhadores CLT
- Freelancers
- Autônomos
- Usuários iniciantes em finanças

---

# 🧠 Problema que o projeto resolve

Muitas pessoas possuem dificuldade em organizar suas finanças pessoais utilizando ferramentas simples e acessíveis.

Grande parte das soluções existentes são:

- Complexas
- Burocráticas
- Poluídas visualmente
- Pouco intuitivas

O More Money foi criado para oferecer uma experiência financeira mais simples, moderna e objetiva.

---

# 🛠️ Stack utilizada

## Frontend

- Next.js
- React
- TailwindCSS

## Backend

- API Routes (Next.js)
- NextAuth.js

## Banco de dados

- PostgreSQL (Neon)
- SQL puro

## Infraestrutura

- Vercel

## Autenticação

- JWT
- NextAuth
- Criptografia de senhas

---

# 🗄️ Arquitetura do banco de dados

O projeto utiliza PostgreSQL com consultas SQL puras.

Exemplo de importação utilizada:

```ts
import { query } from "@/lib/db";
```

---

# 🧩 Diagrama do banco de dados

O banco de dados foi modelado utilizando PostgreSQL e hospedado no Neon.

A estrutura atual do sistema possui relacionamento entre:

- Usuários
- Categorias
- Lançamentos

Todos os IDs são `uuid` (`gen_random_uuid()`). O schema é versionado em `db/migrations/` (veja [Migrations do banco](#migrations-do-banco)).

---

## 📌 Diagrama ER

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

    LANCAMENTOS {
        uuid id PK
        text descricao
        numeric valor
        varchar tipo
        date data
        uuid categoria_id FK
        uuid usuario_id FK
        timestamptz criado_em
        timestamptz atualizado_em
    }

    USUARIOS ||--o{ CATEGORIAS : cria
    USUARIOS ||--o{ LANCAMENTOS : registra

    CATEGORIAS ||--o{ LANCAMENTOS : categoriza
```

O tipo de usuário (`tipo_usuario_enum`) aceita `ADMIN` e `PADRAO`.

---

# ⚙️ Como executar o projeto

## 1. Clone o repositório

```bash
git clone https://github.com/devpetry/more-money.git
```

---

## 2. Acesse a pasta do projeto

```bash
cd more-money
```

---

## 3. Instale as dependências

```bash
npm install
```

---

## 4. Configure o ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

RESEND_API_KEY=

DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
```

Em produção (Neon), use a string de conexão com *pooling* (host com `-pooler`).

---

## 5. Configure o banco PostgreSQL

1. Crie um banco PostgreSQL (localmente ou um projeto no [Neon](https://neon.tech))
2. Configure a `DATABASE_URL` no `.env`
3. Execute `npm run db:migrate` para criar o schema

## 6. 🧪 Dados iniciais (seed)

Para facilitar o primeiro acesso ao sistema, é necessário criar um usuário administrador manualmente.

### 👤 Usuário padrão

- Email: admin@moremoney.com
- Senha: definida manualmente via hash bcrypt
```sql
INSERT INTO usuarios (
    nome,
    email,
    senha_hash,
    tipo_usuario,
    criado_em,
    atualizado_em
) VALUES (
    'Administrador',
    'admin@moremoney.com',
    '$2b$10$COLE_AQUI_O_HASH_DA_SENHA',
    'ADMIN',
    NOW(),
    NOW()
);
```

---

## 7. Execute o projeto

```bash
npm run dev
```

---

# 📂 Estrutura do projeto

```txt
src/
├── app/
│   ├── api/
│   ├── (screens)/
├── components/
├── lib/
├── schemas/
├── styles/
└── api/
```

---

# 📈 Roadmap

## 🔜 Próximas funcionalidades

- O sistema atualmente permite criação de usuários apenas via perfil de administrador.
  Planeja-se implementar uma funcionalidade de **auto-cadastro (sign up)**, com uma tela pública de "Cadastre-se", permitindo que novos usuários criem suas próprias contas.

---

# 🎨 Design e experiência

O projeto foi desenvolvido priorizando:

- Interface minimalista
- Navegação intuitiva
- Performance
- Poucos cliques
- Responsividade
- Experiência moderna

---

# 📌 Status do projeto

| Status | Descrição |
|---|---|
| ✅ MVP concluído | Primeira versão funcional disponível |
| 🚧 Em evolução | Novas funcionalidades em desenvolvimento |

---

# 👨‍💻 Autor

## João Augusto Petry

Desenvolvedor Full-Stack e estudante de Engenharia de Software.

### Contato

- GitHub: https://github.com/devpetry
- LinkedIn: https://www.linkedin.com/in/joopetry/

---

# 📄 Licença

Este projeto está sob a licença MIT.

Consulte o arquivo `LICENSE` para mais informações.

---

<div align="center">

### More Money © 2026

Desenvolvido por João Augusto Petry.

</div>



## Migrations do banco

A estrutura do banco (sem dados) é versionada em `db/migrations/*.sql`, aplicadas em ordem alfabética e registradas na tabela `schema_migrations`.

- Toda mudança de estrutura vira um novo arquivo (ex.: `0002_adicionar_coluna_x.sql`), commitado no mesmo PR da mudança de código. Não edite migrations já aplicadas.
- Localmente: `npm run db:migrate` aplica as pendentes no banco da `DATABASE_URL`.
- Em produção: o `npm run build` da Vercel roda as migrations pendentes antes do `next build` quando `VERCEL_ENV=production`. Se a migration falhar, o build falha e a versão anterior continua no ar. Previews não alteram o banco.
- Prefira mudanças aditivas (criar tabela/coluna). Renomear ou apagar coluna deve ser feito em duas etapas, pois o código antigo continua no ar durante o build.
