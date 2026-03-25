# ShopCloud — Sistema de Pedidos

Aplicação web escalável baseada em nuvem desenvolvida como Atividade Final do curso ADS/IA (EAD – Unifor).

## Arquitetura

```
[Usuário] → [Angular 21 SSR — Vercel]
                  ↓ REST API
         [Node.js/Express — Render (Docker)]
                  ↓ supabase-js
         [Supabase — PostgreSQL + Auth]

GitHub Actions → CI (testes + build) → CD (Render webhook + Vercel auto-deploy)
```

## Stack Tecnológica

| Camada    | Tecnologia                           | Hospedagem |
|-----------|--------------------------------------|------------|
| Frontend  | Angular 21, SSR, Zoneless, Tailwind CSS v4, SCSS | Vercel |
| Backend   | Node.js 22, Express, Swagger/OpenAPI | Render (Docker) |
| Banco     | PostgreSQL via Supabase              | Supabase Cloud |
| Auth      | Supabase Auth (JWT)                  | Supabase Cloud |
| CI/CD     | GitHub Actions                       | GitHub |

## Funcionalidades

- **Autenticação**: Registro, login e logout via Supabase Auth
- **Catálogo de produtos**: Filtros por categoria, busca textual e faixa de preço
- **Carrinho de compras**: Adicionar, remover e ajustar quantidades
- **Pedidos**: Criação, histórico e acompanhamento de status com timeline visual
- **Painel Admin**: CRUD de produtos e gerenciamento de status de pedidos
- **API documentada**: Swagger UI em `/api/docs`

## Requisitos

- Node.js 22+
- Docker (para rodar o backend localmente)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Render](https://render.com) (gratuita)
- Conta no [Vercel](https://vercel.com) (gratuita)

## Setup Local

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/projeto-pedidos.git
cd projeto-pedidos
```

### 2. Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, execute o arquivo `supabase/schema.sql`
3. Anote a **Project URL**, **anon key** e **service_role key**

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edite .env com suas credenciais Supabase
npm install
npm run dev        # http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

**Ou com Docker:**
```bash
docker build -t pedidos-api ./backend
docker run -p 3000:3000 --env-file backend/.env pedidos-api
```

### 4. Frontend

```bash
cd frontend
# Edite src/environments/environment.ts com sua SUPABASE_URL e SUPABASE_ANON_KEY
npm install
npm start          # http://localhost:4200
```

## Deploy

### Backend no Render

1. Crie um **Web Service** no Render
2. Conecte ao repositório GitHub, pasta `backend/`
3. Configure **Docker** como runtime
4. Adicione as variáveis de ambiente:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` (URL do Vercel)
   - `PORT=3000`
5. Copie o **Deploy Hook URL** para o secret `RENDER_DEPLOY_HOOK_URL` no GitHub

### Frontend no Vercel

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Configure o **Root Directory** como `frontend`
3. Adicione as variáveis de ambiente no Vercel com seus valores reais de produção
4. A Vercel detecta automaticamente Angular SSR

### CI/CD (GitHub Actions)

Adicione os seguintes **Secrets** no repositório GitHub (`Settings → Secrets`):

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase |
| `RENDER_DEPLOY_HOOK_URL` | Webhook de deploy do Render |

## Testes

```bash
# Backend
cd backend && npm test

# Frontend (Angular unit tests)
cd frontend && npm test
```

## Estrutura do Projeto

```
projeto-pedidos/
├── frontend/          # Angular 21 SSR (Vercel)
│   ├── src/app/
│   │   ├── core/      # services, guards, interceptors, models
│   │   ├── features/  # auth, products, orders, admin
│   │   └── shared/    # navbar, status-badge
│   └── server.ts      # SSR server
├── backend/           # Node.js + Express (Render/Docker)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   └── middleware/
│   └── Dockerfile
├── supabase/
│   └── schema.sql     # Tabelas, RLS, triggers, seed
└── .github/
    └── workflows/
        └── ci-cd.yml
```

## Endpoints da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/health` | — | Health check |
| GET | `/api/products` | — | Lista produtos (filtros: category, search, price_min, price_max) |
| GET | `/api/products/:id` | — | Detalhe do produto |
| POST | `/api/products` | Admin | Criar produto |
| PUT | `/api/products/:id` | Admin | Atualizar produto |
| DELETE | `/api/products/:id` | Admin | Remover produto |
| GET | `/api/orders` | User | Lista pedidos (admin vê todos) |
| GET | `/api/orders/:id` | User | Detalhe do pedido |
| POST | `/api/orders` | User | Criar pedido |
| PATCH | `/api/orders/:id/status` | Admin | Atualizar status |
| GET | `/api/me` | User | Perfil do usuário |
| GET | `/api/docs` | — | Swagger UI |

## Segurança

- JWT validado no backend via Supabase Auth
- RLS (Row Level Security) no banco de dados
- Helmet (headers HTTP seguros)
- Rate limiting (200 req/15min por IP)
- CORS restrito ao domínio do frontend
- Variáveis de ambiente para todas as credenciais

## Equipe e Papéis

| Papel | Responsabilidade |
|-------|-----------------|
| Arquiteto(a) de Software em Nuvem | Definição da arquitetura, escolha de serviços cloud |
| Desenvolvedor(a) Back-end | API REST, middleware, banco de dados |
| Desenvolvedor(a) Front-end | Angular, SSR, UI/UX |
| Engenheiro(a) DevOps | Docker, CI/CD, deploy |

---

*Atividade Final — Desenvolvimento de Software em Nuvem — ADS/IA EAD Unifor*



scQ6buCJ36x5WHdE