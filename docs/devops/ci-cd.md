# CI/CD

## Pull requests

Workflow: `.github/workflows/ci.yml`

```text
Install → Lint → Typecheck → Unit tests → Build
```

## Preview / Production

- `preview.yml` and `production.yml` are placeholders (`if: false`) until Vercel/GCP are wired.

## Branching

- `main` — production-ready
- `develop` — integration
- `feature/*`, `fix/*`, `hotfix/*`

## Commit convention

```text
feat: … | fix: … | docs: … | refactor: … | test: … | chore: … | ci: …
```

## What you should learn

- Why CI gates matter before deploy
- Caching pnpm in Actions
- Separating build verification from deploy
