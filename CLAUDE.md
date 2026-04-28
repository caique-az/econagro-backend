# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working principles

Act as a rigorous, pragmatic staff engineer focused on real quality.

Prioritize: correctness, clarity of the frontend–backend contract, simple and sustainable code, tests that validate real behavior.

Avoid: broad refactors without immediate need, unrequested features, masking problems with comments, exposing admin/inactive data on public endpoints, large architectural changes just to satisfy a linter.

Fix glaring errors directly. If something is merely an acceptable architectural decision, don't dramatize it. Prefer small, focused, reviewable changes.

## Commands

```bash
npm run dev          # development server (nodemon)
npm start            # production server
npm test             # run all tests with coverage
npm run test:watch   # tests in watch mode
npm run test:ci      # tests for CI (--ci --forceExit)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run seed:admin   # create first admin user from .env vars
```

Run a single test file:
```bash
npx jest tests/routes/category.routes.test.js
```

Before considering any task done: `npm run lint && npm test`.

## Project context

EconAgro is a portfolio fullstack project:
- **Frontend**: Next.js, deployed on Vercel
- **Backend**: Node.js/Express/Mongoose, deployed on Render
- **Database**: MongoDB Atlas

The backend is considered finalized for this stage. Next work is on the frontend. Do not add new backend features unless explicitly requested.

## Architecture

CommonJS modules throughout.

```
src/
├── app.js           # Express App class (singleton export)
├── server.js        # Entry point — connects DB, starts listening
├── config/          # env.js and mongodb.js
├── controllers/     # Class-based, exported as singleton instances
├── middlewares/     # auth.js, errorHandler.js, validateObjectId.js
├── models/          # Mongoose schemas (index.js re-exports all)
├── routes/          # Route definitions; index.js mounts all under /api
└── utils/           # errors.js (custom error hierarchy), jwt.js
```

All routes are mounted under `/api`. The root `/` returns API metadata; `/api/health` is the health check.

### Controllers

ES6 classes exported as `new XController()` singletons. Methods use `try/catch` and pass errors to `next()`. Do not mix with standalone functions — refactoring to functions is future work.

### Error handling

Throw errors from `src/utils/errors.js` — the global `errorHandler` middleware handles them automatically:

| Class | HTTP status |
|---|---|
| `NotFoundError` | 404 |
| `ValidationError` | 422 |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `BadRequestError` | 400 |

Mongoose `ValidationError` and duplicate key errors (code 11000) are caught and re-thrown as the appropriate custom error class inside controllers before calling `next()`.

`errorHandler` only logs to `console.error` outside of `NODE_ENV=test`.

### Authentication & Authorization

`src/middlewares/auth.js` exports:

- `authenticate` — verifies `Authorization: Bearer <token>`, attaches `req.user` (`{ name, email, role }`)
- `authorize(...roles)` — must follow `authenticate`; rejects if role not in list

Admin-only routes use:
```js
const adminOnly = [authenticate, authorize('admin')];
router.post('/', ...adminOnly, controller.create);
```

Roles: `'user'` (default) and `'admin'`. Auth stays Bearer token — no cookie/httpOnly for now, so CORS does not need `credentials: true`.

### Active/inactive visibility rules

**Public endpoints** — always filter `active: true`, no query param can override this:

- `GET /api/categories` — active categories only
- `GET /api/categories/:id` — active category only
- `GET /api/products` — active products in active categories only; `?active=false` is ignored
- `GET /api/products/:id` — active product in active category only; returns 404 otherwise
- `GET /api/products/category/:categoryName` — active category, active products only
- `GET /api/products?category=<id>` — validates ObjectId before querying; returns 400 for invalid ID

**Admin endpoints** — see all records regardless of `active`:

- `GET /api/categories/admin` and `GET /api/categories/admin/:id` — all categories
- Admin can create/edit products associated with inactive categories (they just won't appear publicly)

### Response envelope

```json
{ "success": true, "data": ..., "count": 10 }
{ "success": false, "message": "...", "errors": [] }
```

### `validateObjectId` middleware

Factory — call as `validateObjectId()` (defaults to param `'id'`) or `validateObjectId('otherId')`.

## Tests

Tests use `mongodb-memory-server` — no external MongoDB needed. `tests/setup.js` sets `NODE_ENV=test` first, then creates an in-memory server before each suite and wipes all collections after each test.

Use helpers from `tests/helpers/auth.js`:
```js
const { createAdminAndGetToken, createUserAndGetToken } = require('../helpers/auth');
const { token } = await createAdminAndGetToken();
```

Tests are integration-style (Supertest against the real Express app). Do not mock the database.

Morgan HTTP logs are suppressed during tests (`NODE_ENV=test`). `console.error` from `errorHandler` is also suppressed in test mode, except for the one test that explicitly sets `NODE_ENV=development` to verify stack trace behavior.

Minimum test criteria: lint passes, all tests pass, public routes do not expose inactive categories/products, admin routes return 401/403 when unauthenticated/unauthorized.

## Pending features (implement only when explicitly requested)

- **Frontend auth integration** — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` contracts are stable and ready.
- **Dynamic categories on frontend** — Category model has `name`, `image`, `active`, `order`; public listing ordered by `order` then `name`.
- **Admin UI** — Admin routes exist and are protected; frontend panel not yet built.
- **Password reset** — Requires token generation, secure storage, expiry, no email-existence leak, email sending.
- **Contact form** — Decide on persistence vs. email, validate payload, prevent spam.
- **Newsletter** — Decide on own backend vs. external service, dedup emails.
- **Orders/checkout** — Out of scope entirely.
- **Cookie httpOnly / CORS credentials** — Not until auth strategy changes.
- **TypeScript migration** — Not planned for this stage.
- **Controllers refactor to functions** — Not planned for this stage.

## Conventions

- CommonJS only — do not introduce ES modules.
- `class-methods-use-this` is off by design while controllers remain stateless classes.
- Always use existing error classes from `utils/errors.js`; do not add new HTTP status handling inline.
- Preserve `{ success, data, count, message }` envelope in all responses.
- Use field whitelists in create/update (`pickFields` pattern from `category.controller.js`); never pass `req.body` directly to Mongoose.
- Avoid new dependencies without strong justification.

## Hard constraints

- Do not introduce MongoDB local dependency at runtime — `mongodb-memory-server` is for tests only.
- Do not leak `password` in any auth/me/register/login response.
- Do not return inactive category or product on any public endpoint.
- Do not create admin routes without `authenticate` + `authorize('admin')`.
- Do not run a broad refactor alongside a focused bug fix — keep them separate.

## ESLint

Extends `airbnb-base` + `prettier`. Notable customizations:
- `for...of` is allowed (only `for...in` is banned)
- `class-methods-use-this` is off
- `_id` is allowed in `no-underscore-dangle`
- Unused args prefixed with `_` are allowed (Express error middleware needs the 4th arg)

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins — no trailing `/api` |
| `PORT` | Server port (default 3001) |
| `SEED_ADMIN_*` | Used only by `npm run seed:admin` |
