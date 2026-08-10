# Database

## Migrations (source of truth)

Imperative SQL migrations are managed by the **Supabase CLI** under:

```text
supabase/migrations/
```

Create migrations with:

```bash
pnpm db:migration:new <name>
```

Do not invent migration filenames by hand.

## Seeds

- CLI seed file: `supabase/seed.sql` (loaded on `pnpm db:reset`)
- Extra seed notes/assets may live in `database/seeds/`

## Docs

Product-level database docs: [docs/database/](../docs/database/).

## Why `database/` still exists

`database/` holds human-facing notes and future seed assets. The CLI owns the executable migration history in `supabase/`.
