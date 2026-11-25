# URL Shortener API

A backend-only REST API that shortens URLs, redirects visitors, and counts clicks.

**Stack:** Node.js (ESM, no TypeScript), Express 5, PostgreSQL, Sequelize, express-validator, cookie-based JWT auth, role based access control (RBAC), in-memory caching, Winston logging, Nodemailer, dotenv.

## Quick start

You need Node.js 20 or newer and a running PostgreSQL server.

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL and JWT_SECRET
createdb url_shortener        # or create the database with any Postgres tool

npm run migrate               # creates the tables
npm run seed -- --demo        # creates the admin account, a demo user and sample links
npm run dev                   # starts the API with auto restart on http://localhost:3000
```

Default seeded accounts (change them in `.env` and `scripts/seedDatabase.js`):

| Role | Email | Password |
| --- | --- | --- |
| admin | admin@example.com | ChangeMe123 |
| user | demo@example.com | Password123 |

Run the unit tests with `npm test`.

### About email in development

Leave `SMTP_HOST` empty and no email is sent. Each email is printed in the terminal and saved in `logs/combined.log` instead, so you can copy the verification link from there. To send real email, fill in the `SMTP_*` values (Mailtrap, Gmail app password, SES, and so on).

To skip email verification while developing, set `REQUIRE_EMAIL_VERIFICATION=false`.

## Try it with curl

```bash
# 1. Register, then open the verification link printed in the terminal
curl -X POST localhost:3000/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"Password123"}'

# 2. Log in. -c saves the cookie to a file
curl -c jar.txt -X POST localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"Password123"}'

# 3. Create a short link. -b sends the saved cookie
curl -b jar.txt -X POST localhost:3000/api/v1/urls -H 'Content-Type: application/json' \
  -d '{"originalUrl":"https://expressjs.com/en/guide/routing.html"}'

# 4. Visit it. -i shows the 302 redirect
curl -i localhost:3000/<code-from-step-3>
```

In Postman or Insomnia the cookie is stored automatically after login.

## Endpoints

All API routes live under `/api/v1`. The redirect route is at the root.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | public | Health check |
| GET | `/:code` | public | Redirect to the original URL and record a click |
| POST | `/api/v1/auth/register` | public | Create an account and email a verification link |
| GET | `/api/v1/auth/verify-email?token=` | public | Confirm the email address |
| POST | `/api/v1/auth/resend-verification` | public | Send a new verification email |
| POST | `/api/v1/auth/login` | public | Log in and set the auth cookie |
| POST | `/api/v1/auth/logout` | public | Clear the auth cookie |
| POST | `/api/v1/auth/forgot-password` | public | Email a password reset link |
| POST | `/api/v1/auth/reset-password` | public | Set a new password with the emailed token |
| GET | `/api/v1/auth/me` | logged in | The current user |
| PATCH | `/api/v1/auth/password` | logged in | Change password |
| POST | `/api/v1/urls` | user, admin | Create a short link (random code or custom alias, optional expiry) |
| GET | `/api/v1/urls` | user, admin | List your links (`page`, `limit`, `q`, `isActive`, `sortBy`, `order`) |
| GET | `/api/v1/urls/:id` | owner or admin | One link |
| PATCH | `/api/v1/urls/:id` | owner or admin | Change destination, active flag or expiry |
| DELETE | `/api/v1/urls/:id` | owner or admin | Delete a link and its click history |
| GET | `/api/v1/urls/:id/stats?days=7` | owner or admin | Total clicks, clicks per day, top referrers |
| GET | `/api/v1/admin/stats` | admin | Platform totals and cache hit rate |
| GET | `/api/v1/admin/users` | admin | List users (`q`, `role`, pagination) |
| PATCH | `/api/v1/admin/users/:id/role` | admin | Make someone `user` or `admin` |
| PATCH | `/api/v1/admin/users/:id/status` | admin | Activate or deactivate an account |
| GET | `/api/v1/admin/urls` | admin | Every link with its owner |

The full contract is in `docs/api-spec.yaml` (open it in Swagger Editor). The tables are described in `docs/database-schema.md`.

### Response format

```json
{ "success": true,  "message": "Short link created", "data": { "url": { } }, "meta": { } }
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "..." }] }
```

## Folder structure

```
url-shortener-api/
├── src/
│   ├── config/
│   │   ├── env.js                 reads and validates environment variables
│   │   ├── database.js            Sequelize connection
│   │   └── middleware.js          global middleware (helmet, cors, parsers, logging, cookies)
│   ├── controllers/               read the request, call a service, send the response
│   │   ├── authController.js
│   │   ├── urlController.js
│   │   ├── redirectController.js
│   │   └── adminController.js
│   ├── models/                    Sequelize models and relationships
│   │   ├── User.js
│   │   ├── Url.js
│   │   ├── Click.js
│   │   └── index.js
│   ├── routes/                    URL paths wired to middleware and controllers
│   │   ├── authRoutes.js
│   │   ├── urlRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── redirectRoutes.js
│   │   └── index.js
│   ├── services/                  business logic and database work
│   │   ├── authService.js
│   │   ├── urlService.js
│   │   ├── adminService.js
│   │   ├── tokenService.js        JWT and one-time token helpers
│   │   └── cacheService.js        the shared URL cache instance
│   ├── middlewares/
│   │   ├── authMiddleware.js      authenticate: who are you?
│   │   ├── roleMiddleware.js      authorize: what may you do? (RBAC)
│   │   ├── validationMiddleware.js
│   │   ├── errorMiddleware.js     404 handler and central error handler
│   │   └── rateLimiter.js
│   ├── utils/
│   │   ├── validation.js          express-validator rules
│   │   ├── logger.js              Winston logger
│   │   ├── cache.js               TTL + LRU in-memory cache class
│   │   ├── shortCode.js
│   │   ├── pagination.js
│   │   ├── response.js
│   │   ├── AppError.js
│   │   └── constants.js
│   ├── helpers/
│   │   └── emailHelper.js         Nodemailer and the email templates
│   ├── app.js                     builds the Express app (no listening, easy to test)
│   └── server.js                  connects to the database and starts listening
├── tests/
│   ├── unit/                      cache, short code and pagination tests
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── api-spec.yaml
│   └── database-schema.md
├── logs/                          combined.log and error.log are written here
├── scripts/
│   ├── migrate.js
│   └── seedDatabase.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

`types/` from the course template is not used because this project is plain JavaScript.

## How a request flows

```
Request
  → global middleware (request id, helmet, cors, body parsers, cookies, logging)
  → router (/api/v1/urls)
  → authenticate (verify cookie, load user)
  → authorize (check role)
  → validate (express-validator rules)
  → controller (thin)
  → service (business logic, Sequelize)
  → response  { success, message, data }

Any error thrown along the way → errorHandler → { success: false, message }
```

Express 5 forwards errors from `async` handlers to the error handler by itself, so there is no `try/catch` or `asyncHandler` wrapper in the controllers. Throw an `AppError` and the client gets the right status code.

## Where each concept lives

| Concept | Files |
| --- | --- |
| ESM, dotenv | `"type": "module"` in `package.json`, `src/config/env.js` |
| Sequelize models and relations | `src/models/` |
| Validation and sanitising | `src/utils/validation.js`, `src/middlewares/validationMiddleware.js` |
| Cookies | `src/controllers/authController.js`, `src/config/middleware.js` |
| Authentication (JWT in an httpOnly cookie) | `src/middlewares/authMiddleware.js`, `src/services/tokenService.js` |
| RBAC | `src/middlewares/roleMiddleware.js`, `src/routes/adminRoutes.js`, ownership checks in `urlService.js` |
| In-memory caching | `src/utils/cache.js`, `resolveCode` in `src/services/urlService.js` |
| Logging | `src/utils/logger.js`, request logging in `src/config/middleware.js` |
| Email | `src/helpers/emailHelper.js`, used by `authService.js` |
| Centralised error handling | `src/utils/AppError.js`, `src/middlewares/errorMiddleware.js` |
| Pagination | `src/utils/pagination.js` |
| Rate limiting | `src/middlewares/rateLimiter.js` |

## Design decisions worth discussing in class

1. **302, not 301, for redirects.** Browsers cache a 301 permanently, so repeat visits would skip the server and clicks could not be counted.
2. **Cache with invalidation.** Redirects check an in-memory cache before the database. Updating or deleting a link removes its cache entry. Creating a link also removes it, because "this code does not exist" is cached for a short time (negative caching).
3. **Click recording is not awaited.** The visitor is redirected immediately. A failure to record a click is logged and never breaks the redirect.
4. **The database enforces unique codes.** Instead of "check, then insert" (which two requests can race through), the service inserts and handles the unique constraint error, retrying with a new random code if needed.
5. **The user is loaded from the database on every authenticated request.** A role change, deactivation or password change takes effect immediately instead of when the token expires.
6. **Only hashes of one-time tokens are stored.** The raw token exists only in the email.
7. **Forgot password and resend verification always answer the same way,** so nobody can discover which emails are registered. Login also takes the same time for unknown emails and wrong passwords.
8. **Non-owners get 404, not 403,** so an attacker cannot learn which link ids exist.

## Suggested teaching order

1. Project setup: ESM, `.env`, folder structure, `app.js` and `server.js`.
2. Models and the database: `migrate.js`, relationships.
3. A first endpoint end to end: `POST /urls` (route, validator, controller, service).
4. Redirect and click counting.
5. Authentication: register, login, cookies, `authenticate`.
6. RBAC: `authorize`, ownership rules, the admin routes.
7. Caching: add `resolveCode`, then break it on purpose by removing the invalidation and watch stale data appear.
8. Logging and error handling.
9. Email: verification and password reset.
10. Tests, docs and deployment.

Ideas for student exercises: QR code endpoint, per-user link limits, bulk create, link password protection, custom domains, soft delete, geolocation of clicks, switching the cache to Redis.

## Production notes

- Set `NODE_ENV=production`, a long random `JWT_SECRET`, `BASE_URL` to your real domain, and serve over HTTPS. Cookies are `Secure` automatically in production.
- Behind Nginx or a load balancer set `TRUST_PROXY=1`, otherwise rate limiting and click IPs see only the proxy.
- If the frontend is on a different site, set `COOKIE_SAMESITE=none` (HTTPS required) and list the frontend in `CORS_ORIGINS`. Add CSRF protection in that case.
- `npm run migrate` uses `sequelize.sync()`, which is fine for learning. Real projects should move to versioned migrations (`sequelize-cli` or `umzug`).
- The in-memory cache is per process. Running several instances means several caches, so an update on one instance leaves stale entries on the others until they expire. Switch to Redis when you scale out.
- Run with a process manager such as PM2, or in Docker. `server.js` already shuts down gracefully on SIGTERM.
