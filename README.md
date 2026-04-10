# EconAgro API

API RESTful para o sistema EconAgro - plataforma de gerenciamento de produtos agrícolas.

## Tecnologias

- **Node.js** (v14+) + **Express**
- **MongoDB Atlas** + **Mongoose**
- **ESLint** + **Prettier**

## Instalação

```bash
npm install
cp .env.example .env  # Configure MONGODB_URI
npm run dev
```

## Variáveis de Ambiente

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/econagro
ALLOWED_ORIGINS=http://localhost:3000
```

## Endpoints

### Produtos `/api/products`

| Método | Rota | Descrição | Query Params |
|--------|------|-----------|--------------|
| GET | `/` | Lista produtos | `?search=`, `?category=`, `?active=` |
| GET | `/:id` | Produto por ID | - |
| GET | `/category/:name` | Produtos por categoria | - |
| POST | `/` | Criar produto | - |
| PUT | `/:id` | Atualizar produto | - |
| DELETE | `/:id` | Remover produto | - |

### Categorias `/api/categories`

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Lista categorias |
| GET | `/:id` | Categoria por ID (com produtos) |
| POST | `/` | Criar categoria |
| PUT | `/:id` | Atualizar categoria |
| DELETE | `/:id` | Remover categoria |

### Utilitários

| Rota | Descrição |
|------|-----------|
| `GET /` | Info da API |
| `GET /api/health` | Health check |

## Estrutura

```
src/
├── config/        # Conexão MongoDB
├── controllers/   # Lógica de negócio
├── middlewares/   # Error handler, validação ObjectId
├── models/        # Schemas Mongoose
├── routes/        # Definição de rotas
├── utils/         # Classes de erro customizadas
├── app.js         # Configuração Express
└── server.js      # Entry point
```

## Scripts

```bash
npm run dev       # Desenvolvimento (nodemon)
npm start         # Produção
npm test          # Rodar testes com cobertura
npm run test:watch # Testes em modo watch
npm run lint      # Verificar código
npm run lint:fix  # Corrigir formatação
```

## Testes

69 testes automatizados com Jest + Supertest usando MongoDB em memória.

```bash
npm test  # Roda todos os testes com relatório de cobertura
```

| Módulo | Cobertura |
|--------|-----------|
| Models | 100% |
| Routes | 100% |
| Controllers | 89% |
| Middlewares | 71% |
| **Total** | **85%** |

## Licença

MIT
