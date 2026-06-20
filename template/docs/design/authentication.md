# Authentication System Documentation

## Overview

This project implements a scalable authentication system using a split architecture with two Next.js applications:

- **Landing App** (Port 3001): Public marketing site and authentication UI (login, signup)
- **Main App** (Port 3000): Full-stack app with the backend API and protected routes

## Architecture

### Authentication Flow

1. User visits Main App (3000) without a session cookie → `proxy.ts` redirects to Landing App `/login?redirect=...`
2. User submits login/signup on Landing App (3001) → API call to Main App (3000)
3. Main App authenticates and sets an `httpOnly` session cookie → browser redirects back to Main App
4. Protected routes validate the session in Server Components via `requireAuth()` and in API route handlers

### Next.js 16 Proxy vs Auth

`proxy.ts` is an **optimistic network gate** only. It checks whether a `session_id` cookie exists and redirects unauthenticated visitors to the landing login page. It does **not** validate the session against the database.

Real authentication checks happen in:

- `requireAuth()` — Server Components and layouts
- `getCurrentUser()` — API route handlers
- `services/auth/auth-service.ts` — login/register business logic

Do not rely on `proxy.ts` as your sole security boundary.

### Key Components

#### Main App (Port 3000)

**Backend Services:**
- [lib/auth/password.ts](../../lib/auth/password.ts) — Password hashing/verification using scrypt
- [lib/auth/session.ts](../../lib/auth/session.ts) — Session management with cookies
- [lib/auth/validation.ts](../../lib/auth/validation.ts) — Zod schemas for validation
- [lib/auth/helpers.ts](../../lib/auth/helpers.ts) — `requireAuth()` for Server Components
- [services/auth/auth-service.ts](../../services/auth/auth-service.ts) — Core auth business logic
- [lib/db.ts](../../lib/db.ts) — Prisma database client

**API Routes:**
- `POST /api/auth/login` — User login (rate-limited)
- `POST /api/auth/register` — User registration (rate-limited)
- `POST /api/auth/logout` — User logout
- `GET /api/auth/session` — Get current session

**Proxy:**
- [proxy.ts](../../proxy.ts) — Optimistic cookie check; redirects to landing login when missing

#### Landing App (Port 3001)

**Frontend Pages:**
- [app/(auth)/login/page.tsx](../../landing/app/(auth)/login/page.tsx) — Login form
- [app/(auth)/signup/page.tsx](../../landing/app/(auth)/signup/page.tsx) — Signup form
- [hooks/api/use-auth.ts](../../landing/hooks/api/use-auth.ts) — SWR hooks for auth mutations

## Database Schema

The authentication system uses the following Prisma models:

```prisma
model User {
  id            String        @id @default(uuid())
  email         String        @unique
  passwordHash  String
  name          String
  status        AccountStatus @default(ACTIVE)
  emailVerified Boolean       @default(false)
  sessions      Session[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  ip        String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

## Setup Instructions

### 1. Environment Variables

**Main App (.env):**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/{{DB_NAME}}"
NEXT_PUBLIC_LANDING_URL="{{LANDING_URL}}"
NEXT_PUBLIC_MAIN_APP_URL="{{MAIN_APP_URL}}"
NODE_ENV="development"
```

**Landing App** uses the same `NEXT_PUBLIC_MAIN_APP_URL` at build/runtime (set in root `.env` or `landing/.env.local`).

### 2. Database Migration

```bash
pnpm db:migrate
```

### 3. Run Both Apps

```bash
mprocs
```

Or separately:

```bash
pnpm dev          # Main app on :3000
cd landing && pnpm dev  # Landing app on :3001
```

## API Reference

### POST /api/auth/register

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### POST /api/auth/login

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### GET /api/auth/session

Returns the current authenticated user or `401` if unauthenticated.

### POST /api/auth/logout

Clears the session cookie and deletes the session record.

## Security Features

1. **Password Security:**
   - Minimum 8 characters with uppercase, lowercase, and number requirements
   - Hashed using scrypt with random salt

2. **Session Management:**
   - HTTP-only cookies (not accessible via JavaScript)
   - 30-day expiration
   - Secure flag in production
   - SameSite=Lax

3. **CORS Configuration:**
   - Allows credentialed requests from the Landing App origin

4. **Route Protection:**
   - `proxy.ts` — optimistic cookie gate at the network boundary
   - `requireAuth()` — database-backed validation in Server Components
   - Rate limiting on login/register (10 requests per 60 seconds per IP)

## Testing the Flow

1. Start both apps (Main: 3000, Landing: 3001)
2. Navigate to `{{MAIN_APP_URL}}`
3. You should be redirected to `{{LANDING_URL}}/login?redirect={{MAIN_APP_URL}}/`
4. Register or sign in on the Landing App
5. After success, you are redirected to the Main App dashboard
6. Accessing protected routes without a valid session redirects back to login

## Troubleshooting

### Cookies Not Being Set

- Use `localhost` consistently (not `127.0.0.1`)
- Check browser dev tools → Application → Cookies on `localhost:3000`
- Verify CORS headers in the Network tab

### Redirects Not Working

- Confirm `NEXT_PUBLIC_LANDING_URL` and `NEXT_PUBLIC_MAIN_APP_URL` are set
- Ensure `proxy.ts` matcher covers the route you are testing

### Database Connection Issues

- Confirm PostgreSQL is running (`pnpm docker:dev`)
- Check `DATABASE_URL` is correct
- Run `pnpm db:push` to sync schema

## Future Enhancements

- [ ] Email verification
- [ ] Password reset flow
- [ ] Two-factor authentication
- [ ] OAuth providers (Google, GitHub, etc.)
- [ ] Session management UI
- [ ] Remember me functionality
