# Public waitlist (Coming Soon)

Submissions are stored in `public.waitlist` with RLS: **anon/authenticated INSERT only**.

## Abuse controls (current)

- Unique email (case-insensitive)
- Honeypot field (`website`)
- Server-side Zod validation
- Friendly errors (no DB internals)

## Before public launch

Add production-grade **rate limiting** and/or **CAPTCHA**. Do not rely on honeypot alone.
