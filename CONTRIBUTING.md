# Contributing to Ordra

Thanks for helping build Ordra.

## Workflow

1. Branch from `develop` (or `main` for hotfixes):
   - `feature/<short-name>`
   - `fix/<short-name>`
   - `hotfix/<short-name>`
2. Keep PRs focused and small.
3. Ensure CI passes: lint, typecheck, tests, build.
4. Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `ci:`.

## Engineering standards

- TypeScript strict — avoid `any`
- Validate inputs with Zod
- Never bypass auth, RBAC, RLS, or tenant isolation
- Every tenant-owned resource needs `cafe_id`
- No secrets in git
- Prefer simple designs; record meaningful choices as ADRs in `docs/decisions/`

## Local checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

Pre-commit hooks run lint, typecheck-related formatting, and Prettier via Husky + lint-staged.
