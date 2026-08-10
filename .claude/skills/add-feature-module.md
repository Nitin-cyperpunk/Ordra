# Skill: Add Feature Module

Use when scaffolding a new Ordra domain module under `apps/web/features/`.

## Steps

1. Confirm the module is listed in `docs/product/modules.md`.
2. Create `features/<name>/` with:
   - `components/`
   - `actions/` (server actions)
   - `schemas/` (Zod)
   - `types.ts`
   - `README.md` describing boundaries
3. Keep routes in `app/` thin.
4. Ensure all tenant data paths include `cafe_id` checks.
5. Add/extend tests under `tests/` when behavior exists.
6. Do not add unrelated refactors.
