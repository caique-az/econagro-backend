# EconAgro Backend — Plano de Trabalho Real

Este documento lista apenas trabalho real de produto/engenharia. Não inclui pequenas limpezas, ajustes cosméticos isolados, correções triviais de lint ou formatação.

## Objetivo

Evoluir o backend para sustentar as integrações reais do frontend, mantendo a API simples, testável, segura o bastante para portfólio e sem endpoints decorativos sem decisão clara.

## Estado atual resumido

- API de produtos funcional.
- API de categorias funcional, mas categoria ainda possui apenas `name`.
- Auth com JWT existe.
- Middleware de autenticação/autorização existe.
- CRUD admin existe no backend.
- Lint e testes passam.
- Cobertura geral está boa, mas auth/user ainda precisam melhorar.
- Recuperação de senha, contato e newsletter ainda não existem como funcionalidades reais.

---

# Prioridade 1 — Suporte completo à autenticação do frontend

## Estado atual

Backend já possui endpoints de registro, login e `/auth/me`. O frontend ainda não consome esses endpoints.

## Tarefas

- Revisar contrato de resposta de `POST /auth/login`.
- Revisar contrato de resposta de `POST /auth/register`.
- Garantir que `/auth/me` retorna dados suficientes para o frontend.
- Garantir que erros de auth sejam consistentes:
    - credenciais inválidas;
    - e-mail já cadastrado;
    - token ausente;
    - token inválido;
    - usuário inexistente.
- Avaliar se a estratégia será:
    - token no body para frontend salvar;
    - ou cookie httpOnly.
- Se optar por cookie httpOnly:
    - ajustar CORS;
    - habilitar credentials;
    - criar endpoint de logout;
    - revisar deploy Render/Vercel.

## Critérios de aceite

- Frontend consegue logar e cadastrar usando API real.
- `/auth/me` funciona com token válido.
- Erros são previsíveis e documentados.
- `npm run lint` passa.
- `npm test` passa.

---

# Prioridade 2 — Categorias com imagem e metadados

## Estado atual

Categoria possui apenas `name`. O frontend precisa renderizar banners/navbar dinamicamente com imagem.

## Tarefas

- Adicionar campo `image` ao model `Category`.
- Considerar campo `active`.
- Considerar campo `order`.
- Atualizar validações do model.
- Atualizar controller de categorias.
- Atualizar testes de model.
- Atualizar testes de rotas.
- Atualizar seed, se houver.
- Garantir fallback quando `image` não for enviada.
- Garantir ordenação previsível das categorias.
- Garantir que categorias inativas não apareçam em endpoints públicos, se `active` for implementado.

## Modelo sugerido

```js
{
  name: String,
  image: String,
  active: Boolean,
  order: Number
}'