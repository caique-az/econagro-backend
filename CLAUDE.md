# EconAgro Backend — Contexto para Claude Code

## Stack
- Node.js + Express (CommonJS, sem TypeScript)
- MongoDB Atlas + Mongoose
- JWT (jsonwebtoken) + bcryptjs para autenticação
- Jest + Supertest + mongodb-memory-server para testes
- ESLint + Prettier

## Deploy
- Backend: Render (IP estático configurado manualmente no Atlas)
- Frontend: Vercel (Next.js, repo separado)
- MongoDB: Atlas (IP whitelist manual, não liberar 0.0.0.0/0)

## Arquitetura de autenticação
- `role: 'user'` — criado pelo registro público
- `role: 'admin'` — criado apenas via `npm run seed:admin`
- Rotas GET de produtos e categorias são públicas
- POST, PUT, DELETE exigem `admin`
- Promoção de role via `PATCH /api/users/:id/role` (admin only)

## O que já foi feito
- CRUD completo de produtos e categorias
- Autenticação JWT com register, login e me
- Middleware de auth (authenticate + authorize)
- Seed script para primeiro admin (`npm run seed:admin`)
- Todos os bugs do code review inicial corrigidos
- 69 testes passando

## O que falta
- Integração com Cloudinary para upload de imagens (decisão tomada, conta criada)
- Seed de produtos e categorias (aguardando dados de negócio do usuário)
- Docker (o usuário vai implementar)
- Testes para os endpoints de auth e user

## Decisões tomadas
- Flyway descartado — overengineering para Node.js
- MongoDB mantido (não migrar para PostgreSQL — portfólio, custo-benefício baixo)
- Cloudinary para imagens (não armazenar no servidor)
- Render free tier tem cold start (~30-60s) — aceitável para portfólio
- `package-lock.json` está no `.gitignore` do projeto

## Convenções de commit
- Conventional Commits em inglês
- Mensagens curtas, sem corpo desnecessário
- Nunca mencionar Claude na mensagem ou co-author
