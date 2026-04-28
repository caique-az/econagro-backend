# EconAgro API

API RESTful do projeto **EconAgro**, uma plataforma demonstrativa de e-commerce agrícola.

Este backend fornece os dados consumidos pelo frontend, incluindo produtos, categorias e autenticação via JWT.

**Frontend:** https://github.com/caique-az/econagro-frontend

---

## Visão geral

A API foi construída com Node.js, Express e MongoDB, seguindo uma arquitetura simples em camadas:

- Rotas HTTP com Express
- Controllers para regras de aplicação
- Models com Mongoose
- Middlewares para autenticação, autorização, tratamento de erros e validação de ObjectId
- MongoDB Atlas como banco de dados em produção
- CORS configurável por variável de ambiente

O objetivo do projeto é demonstrar integração fullstack entre:

- Frontend em Next.js hospedado na Vercel
- Backend em Node.js/Express hospedado na Render
- Banco MongoDB Atlas
- Imagens externas via Cloudinary

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js |
| Framework HTTP | Express |
| Banco de dados | MongoDB Atlas |
| ODM | Mongoose |
| Autenticação | JWT |
| Criptografia de senha | bcryptjs |
| Validação | Mongoose validators |
| Testes | Jest + Supertest + MongoDB Memory Server |
| Logs | Morgan |
| Deploy | Render |

---

## Pré-requisitos

- Node.js `>=20.9 <25`
- npm
- MongoDB local ou MongoDB Atlas

---

## Instalação local

```bash
npm install
cp .env.example .env
npm run dev
```

Por padrão, a API roda em:

```txt
http://localhost:3001
```

Health check:

```txt
GET http://localhost:3001/api/health
```

---

## Variáveis de ambiente

Crie um arquivo `.env` com base no `.env.example`.

```env
NODE_ENV=development
PORT=3001

MONGODB_URI=mongodb://localhost:27017/econagro

ALLOWED_ORIGINS=http://localhost:3000

JWT_SECRET=troque_por_uma_chave_segura
JWT_EXPIRES_IN=7d

SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@econagro.com
SEED_ADMIN_PASSWORD=troque_por_senha_segura
```

### Produção

Na Render, configure algo como:

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/econagro
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
JWT_SECRET=uma_chave_forte_para_producao
JWT_EXPIRES_IN=7d
```

Para permitir frontend local e produção ao mesmo tempo:

```env
ALLOWED_ORIGINS=http://localhost:3000,https://seu-frontend.vercel.app
```

Não inclua `/api` em `ALLOWED_ORIGINS`.

Correto:

```env
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

Incorreto:

```env
ALLOWED_ORIGINS=https://seu-frontend.vercel.app/api
```

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor em desenvolvimento com Nodemon |
| `npm start` | Inicia o servidor em produção |
| `npm run lint` | Executa ESLint |
| `npm run lint:fix` | Corrige problemas de lint quando possível |
| `npm test` | Executa testes com cobertura |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:ci` | Executa testes em modo CI |
| `npm run seed:admin` | Cria o primeiro usuário administrador |

---

## Estrutura do projeto

```txt
src/
├── config/          # Configuração e conexão com MongoDB
├── controllers/     # Controllers da aplicação
├── middlewares/     # Auth, error handler e validações
├── models/          # Schemas Mongoose
├── routes/          # Rotas da API
├── utils/           # Classes de erro customizadas
├── app.js           # Configuração da aplicação Express
└── server.js        # Entry point do servidor

scripts/
└── seed-admin.js    # Script para criar usuário admin
```

---

## Autenticação

A API usa autenticação JWT.

Após login ou cadastro, a API retorna um token:

```json
{
  "success": true,
  "token": "jwt_token",
  "data": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@email.com",
    "role": "user"
  }
}
```

Rotas protegidas exigem o header:

```http
Authorization: Bearer <token>
```

### Perfis de usuário

| Role | Descrição |
|---|---|
| `user` | Usuário comum |
| `admin` | Pode criar, editar e remover produtos/categorias |

---

## Endpoints

Base URL local:

```txt
http://localhost:3001/api
```

Base URL em produção:

```txt
https://seu-backend.onrender.com/api
```

---

## Utilitários

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Informações básicas da API |
| `GET` | `/api/health` | Health check da API |

Exemplo:

```bash
curl http://localhost:3001/api/health
```

Resposta:

```json
{
  "status": "API está funcionando"
}
```

---

## Auth `/api/auth`

### `POST /api/auth/register`

Cria um novo usuário.

Body:

```json
{
  "name": "Caique Azevedo",
  "email": "caique@email.com",
  "password": "senha123"
}
```

Resposta:

```json
{
  "success": true,
  "token": "jwt_token",
  "data": {
    "id": "user_id",
    "name": "Caique Azevedo",
    "email": "caique@email.com",
    "role": "user"
  }
}
```

### `POST /api/auth/login`

Autentica um usuário existente.

Body:

```json
{
  "email": "caique@email.com",
  "password": "senha123"
}
```

Resposta:

```json
{
  "success": true,
  "token": "jwt_token",
  "data": {
    "id": "user_id",
    "name": "Caique Azevedo",
    "email": "caique@email.com",
    "role": "user"
  }
}
```

### `GET /api/auth/me`

Retorna os dados do usuário autenticado.

Requer:

```http
Authorization: Bearer <token>
```

---

## Produtos `/api/products`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/products` | Lista produtos | Pública |
| `GET` | `/api/products/:id` | Busca produto por ID | Pública |
| `GET` | `/api/products/category/:categoryName` | Lista produtos por categoria | Pública |
| `POST` | `/api/products` | Cria produto | Admin |
| `PUT` | `/api/products/:id` | Atualiza produto | Admin |
| `DELETE` | `/api/products/:id` | Remove produto | Admin |

### Query params

`GET /api/products`

| Param | Descrição | Exemplo |
|---|---|---|
| `search` | Busca por nome ou descrição | `/api/products?search=banana` |
| `category` | Filtra por ObjectId da categoria (retorna 400 se inválido) | `/api/products?category=<objectId>` |

> Endpoints públicos sempre retornam apenas produtos e categorias **ativos**.

### Exemplo de resposta

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "product_id",
      "name": "Banana Prata",
      "description": "Banana fresca",
      "price": 8.99,
      "quantity": 20,
      "category": {
        "_id": "category_id",
        "name": "Frutas"
      },
      "image": "https://res.cloudinary.com/...",
      "active": true
    }
  ]
}
```

### Criar produto

`POST /api/products`

Requer admin.

```http
Authorization: Bearer <token>
```

Body:

```json
{
  "name": "Banana Prata",
  "description": "Banana fresca",
  "price": 8.99,
  "quantity": 20,
  "category": "category_id",
  "image": "https://res.cloudinary.com/...",
  "active": true
}
```

---

## Categorias `/api/categories`

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| `GET` | `/api/categories` | Lista categorias ativas | Pública |
| `GET` | `/api/categories/:id` | Busca categoria ativa por ID | Pública |
| `GET` | `/api/categories/admin` | Lista todas as categorias (ativas e inativas) | Admin |
| `GET` | `/api/categories/admin/:id` | Busca qualquer categoria por ID | Admin |
| `POST` | `/api/categories` | Cria categoria | Admin |
| `PUT` | `/api/categories/:id` | Atualiza categoria | Admin |
| `DELETE` | `/api/categories/:id` | Remove categoria (falha se tiver produtos) | Admin |

### Exemplo de corpo para criar/atualizar categoria

```json
{
  "name": "Frutas",
  "image": "https://res.cloudinary.com/...",
  "active": true,
  "order": 1
}
```

Categorias esperadas pelo frontend atual:

```txt
Carnes
Ovos
Laticínios
Grãos
Frutas
Verduras
Legumes
Sementes
```

---

## Usuários `/api/users`

### `PATCH /api/users/:id/role`

Atualiza a role de um usuário.

Requer admin.

```http
Authorization: Bearer <token>
```

Body:

```json
{
  "role": "admin"
}
```

---

## Seed de administrador

Para criar o primeiro administrador, configure no `.env`:

```env
SEED_ADMIN_NAME=Admin
SEED_ADMIN_EMAIL=admin@econagro.com
SEED_ADMIN_PASSWORD=troque_por_senha_segura
```

Depois rode:

```bash
npm run seed:admin
```

---

## Deploy na Render

Configuração sugerida:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Branch | `main` |

Variáveis obrigatórias:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
JWT_SECRET=...
JWT_EXPIRES_IN=7d
```

Após o deploy, teste:

```bash
curl https://seu-backend.onrender.com/api/health
```

---

## Testes

O projeto possui testes automatizados com Jest, Supertest e MongoDB em memória.

```bash
npm test
```

Para CI:

```bash
npm run test:ci
```

---

## Status do projeto

Implementado:

- API REST de produtos
- API REST de categorias
- Autenticação com JWT
- Autorização por role admin
- Health check
- Integração com MongoDB Atlas
- CORS configurável para frontend em produção
- Testes automatizados

Fora do escopo desta versão:

- Newsletter persistida
- Gestão administrativa via painel web

---

## Licença

MIT
