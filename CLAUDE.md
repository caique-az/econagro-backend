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
├── middlewares/     # auth.js, errorHandler.js, validateObjectId.js, rateLimiters.js
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
| `ServiceUnavailableError` | 503 |

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

### Security middlewares

`helmet` is applied globally in `app.js` before CORS, setting standard security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.).

`express-rate-limit` is applied on sensitive routes via `src/middlewares/rateLimiters.js`:

| Limiter | Routes | Limit |
|---|---|---|
| `authLimiter` | `POST /register`, `POST /login`, `POST /reset-password` | 20 req / 15 min |
| `emailLimiter` | `POST /forgot-password`, `POST /contact` | 5 req / 1 hour |

In `NODE_ENV=test` both limiters use `max: 1000` to avoid interfering with existing tests. Use `createAuthLimiter`/`createEmailLimiter` factory functions to create tight limiters for unit-style rate limit tests.

The backend runs behind a proxy on Render; `app.set('trust proxy', 1)` is configured so that rate limiting reads the real client IP from `X-Forwarded-For`.

### Active/inactive visibility rules

**Public endpoints** — always filter `active: true`, no query param can override this:

- `GET /api/categories` — active categories only
- `GET /api/categories/:id` — active category only
- `GET /api/products` — active products in active categories only; `?active=false` is ignored; `?search=term` uses MongoDB `$text` index on `name` and `description`
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

Product search tests call `await Product.syncIndexes()` in `beforeAll` to ensure the text index exists in the in-memory server before any `$text` query runs.

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

## Auth endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `POST /api/auth/register` | None | Register a new user |
| `POST /api/auth/login` | None | Login and receive JWT |
| `GET /api/auth/me` | Bearer | Return current user data |
| `POST /api/auth/forgot-password` | None | Request password reset email |
| `POST /api/auth/reset-password` | None | Reset password using token |

### Password reset flow

`forgot-password` always returns a generic 200 regardless of whether the email exists (no account enumeration). If the user exists, a random token is generated, its SHA-256 hash is stored in the DB (never the raw token), and an email is sent with a link to `${FRONTEND_URL}/redefinir-senha?token=<rawToken>`. The token expires in 30 minutes.

`reset-password` receives `{ token, password }`, hashes the token, looks up the user, updates the password via `user.save()` (triggers bcrypt hook), and clears the reset fields. Reuse of the token is rejected.

## Contact endpoint

`POST /api/contact` — receives `{ name, email, message }`, validates, and sends an email to `CONTACT_TO_EMAIL` using `MAIL_FROM` as sender and the user's email as `replyTo`. No auth required.

## Email service

`src/services/email.service.js` wraps Nodemailer SMTP. Two exported functions:
- `sendPasswordResetEmail({ to, resetUrl })`
- `sendContactEmail({ name, email, message })`

Controllers import and call the service; they never know SMTP details. In tests the module is mocked via `jest.mock`.

All user-supplied values are HTML-escaped before being injected into email bodies. The `replyTo` field uses the raw (validated) email, not the escaped version. Line breaks in `message` are converted to `<br />`.

Email provider failures return 503 (`ServiceUnavailableError`), not 400 — the payload was valid; the fault is on the infrastructure side.

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
| `FRONTEND_URL` | Base URL for password reset link (e.g. `https://econagro.vercel.app`) |
| `MAIL_FROM` | Sender identity (e.g. `EconAgro <no-reply@econagro.com>`) |
| `CONTACT_TO_EMAIL` | Recipient of contact form emails |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (default 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

Email variables (`FRONTEND_URL`, `MAIL_FROM`, `CONTACT_TO_EMAIL`, `SMTP_*`) are required only in `NODE_ENV=production`. In development and test they are optional — the API starts without them, and email endpoints will fail gracefully (503) if called without SMTP configured.
