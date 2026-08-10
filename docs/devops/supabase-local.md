# Local Supabase

## Why Supabase CLI

Ordra uses Supabase for Postgres, Auth, Storage, and Realtime. The CLI runs the full stack in Docker so Auth + RLS behave like production — closer than a bare Postgres container.

## Prerequisites

- Docker Desktop running
- Node 20+ (22 recommended)
- `pnpm install` (CLI is a pinned root devDependency: `supabase@2.113.0`)

## Commands

```bash
pnpm db:start      # Start local stack (first run downloads images)
pnpm db:status     # URLs + keys
pnpm db:status -o env
pnpm db:stop       # Stop (keeps data)
pnpm db:reset      # Re-apply migrations + seed.sql
pnpm db:migration:new <name>
pnpm db:types      # Generate TS types → apps/web/types/database.ts
```

## Wire env for Next.js

1. Start the stack: `pnpm db:start`
2. Print env: `pnpm db:status -o env`
3. Copy into `.env.local` (repo root or `apps/web` — Next loads both in monorepos when configured; prefer **`apps/web/.env.local`** or root `.env.local` used by `next dev`):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon or publishable>
SUPABASE_SERVICE_ROLE_KEY=<service_role or secret>
```

Local CLI currently prints legacy `anon` / `service_role` JWTs. Hosted projects should prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`. Both naming schemes are supported in code.

## App clients

| File | Use |
|---|---|
| `apps/web/lib/supabase/client.ts` | Browser / Client Components |
| `apps/web/lib/supabase/server.ts` | Server Components, Actions, Route Handlers |
| `apps/web/lib/supabase/middleware.ts` | Session refresh via `getClaims()` |
| `apps/web/lib/supabase/admin.ts` | Service role — **server only**, bypasses RLS |

## Studio

http://127.0.0.1:54323

## Auth redirects

Set in Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** value of `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
- **Redirect URLs:** `{NEXT_PUBLIC_APP_URL}/auth/callback`

Signup uses `emailRedirectTo` pointing at `/auth/callback`.
