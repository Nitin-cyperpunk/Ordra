# Security Rules

- Treat RLS as a hard security boundary, not a nice-to-have.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or payment secrets to the client.
- Do not use editable `user_metadata` for authorization decisions.
- Validate all external input with Zod on the server.
- Prefer `TO authenticated` + ownership predicates in RLS; avoid deprecated `auth.role()` checks.
