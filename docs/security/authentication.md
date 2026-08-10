# Authentication

## Provider

Supabase Auth (email/password initially; OAuth later if needed).

## Session model

- Cookie-based sessions for the Next.js app using SSR helpers
- Middleware will refresh sessions (to be implemented in auth module)

## Why Supabase Auth?

- Integrated with Postgres RLS (`auth.uid()`)
- Faster than building custom JWT auth
- Fits learning goals without reinventing session security

## Alternatives

| Option | Trade-off |
|---|---|
| NextAuth / Auth.js | Flexible, more DIY with Supabase RLS wiring |
| Clerk / Auth0 | Excellent UX, extra vendor cost and coupling |
| Custom JWT | High risk; avoid for learning + production |

## What you should learn

- Cookie vs bearer token sessions
- CSRF considerations with cookie auth
- Linking `auth.users` to application profiles
