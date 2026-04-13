# FluoDelivery

Sistema completo de **cardapio digital e gestao de pedidos** para restaurantes, lanchonetes e estabelecimentos de alimentacao.

## Funcionalidades

**Loja publica (cardapio digital)**
- Cardapio online com categorias, produtos, variantes e adicionais
- Carrinho de compras com persistencia local
- Checkout com selecao de tipo (retirada, entrega, mesa)
- Cadastro e login de clientes por telefone
- Cupons de desconto e programa de fidelidade
- QR Code para pedidos na mesa

**Painel administrativo**
- Dashboard com visao geral
- Gestao de categorias, produtos, variantes e ingredientes
- Upload de imagens para produtos e banner
- Controle de pedidos com fluxo de status configuravel
- Atendimento e abertura de contas por mesa
- Caixa diario e fechamento financeiro
- Gestao de entregas e acerto com entregadores
- Controle de clientes, fidelidade e cupons
- Configuracao de formas de pagamento
- Gestao de usuarios com perfis e permissoes por tela
- Margem de lucro e lucratividade
- Multi-empresa (um usuario pode gerenciar varias empresas)

## Stack Tecnologica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | NestJS 11, TypeScript, Prisma ORM 7 |
| Banco | PostgreSQL 16 |
| Infra | Docker, Nginx |

## Estrutura do Projeto

```
fluodeliveryclaude/
├── src/                      # Frontend React
│   ├── components/           # Componentes reutilizaveis
│   ├── contexts/             # Contexts (Cart, Empresa, Mesa, Origem)
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilitarios (api, formatacao)
│   ├── pages/                # Paginas (loja publica + admin)
│   └── types/                # Tipos TypeScript
│
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── auth/             # Autenticacao JWT
│   │   ├── empresas/         # Gestao de empresas
│   │   ├── produtos/         # Produtos, variantes, ingredientes
│   │   ├── categorias/       # Categorias
│   │   ├── pedidos/          # Pedidos e itens
│   │   ├── clientes/         # Clientes e enderecos
│   │   ├── caixa/            # Caixa diario e recebimentos
│   │   ├── contas/           # Contas (mesa/comanda)
│   │   ├── cupons/           # Cupons de desconto
│   │   ├── fidelidade/       # Programa de fidelidade
│   │   ├── entregadores/     # Entregadores
│   │   ├── upload/           # Upload de imagens
│   │   └── common/           # Guards, filters, interceptors
│   └── prisma/
│       ├── schema.prisma     # Schema do banco
│       └── seed.ts           # Dados iniciais
│
├── docker-compose.yml        # Orquestracao dos containers
├── frontend.Dockerfile       # Build do frontend
├── nginx.conf                # Configuracao do proxy reverso
└── DEPLOY.md                 # Guia completo de publicacao
```

## Inicio Rapido (Desenvolvimento)

### Pre-requisitos

- Node.js 20+
- PostgreSQL 16 (local ou Docker)

### 1. Clonar o repositorio

```bash
git clone https://github.com/Flaviasvolpi/fluodeliveryclaude.git
cd fluodeliveryclaude
```

### 2. Configurar o backend

```bash
cd backend
cp .env.example .env
# Edite o .env com sua conexao PostgreSQL

npm install
npx prisma db push
npx prisma generate
npm run seed         # Cria empresa demo + usuario admin
npm run start:dev
```

### 3. Configurar o frontend

```bash
cd ..
cp .env.example .env
# Confirme que VITE_API_URL=http://localhost:3000/api

npm install
npm run dev
```

### 4. Acessar

- **Loja:** http://localhost:8080/loja/demo
- **Admin:** http://localhost:8080/login
- **Credenciais:** `admin@fluodelivery.com` / `admin123`

## Publicacao em Producao (Docker)

### 1. Configurar variaveis

```bash
cp .env.production .env
nano .env
```

```env
DB_PASSWORD=SuaSenhaSegura
JWT_SECRET=SuaChaveJWT          # gere com: openssl rand -base64 48
JWT_REFRESH_SECRET=OutraChave   # gere com: openssl rand -base64 48
```

### 2. Subir os containers

```bash
docker compose up -d --build
```

### 3. Acessar

O sistema fica disponivel na **porta 80** do servidor.

- **Loja:** `http://seu-servidor/loja/demo`
- **Admin:** `http://seu-servidor/login`

> Para o guia completo de publicacao, backup, HTTPS e resolucao de problemas, consulte o [DEPLOY.md](DEPLOY.md).

## API

A API segue o padrao REST com autenticacao JWT.

**Base URL:** `/api`

**Endpoints publicos (loja):**
- `GET /api/empresas/by-slug/:slug` — Dados da empresa
- `GET /api/empresas/:id/produtos/active` — Produtos ativos
- `GET /api/empresas/:id/categorias/active` — Categorias ativas
- `GET /api/empresas/:id/formas-pagamento` — Formas de pagamento
- `GET /api/empresas/:id/configuracoes` — Configuracoes
- `POST /api/empresas/:id/pedidos` — Criar pedido
- `POST /api/v1/cliente-auth/*` — Autenticacao de clientes

**Endpoints protegidos (admin):**
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Perfil do usuario logado
- `GET /api/empresas/:id/produtos` — Todos os produtos
- `POST/PATCH/DELETE /api/empresas/:id/*` — CRUD completo

## Licenca

Projeto privado.
