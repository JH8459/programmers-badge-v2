# PROGRAMMERS-BADGE-V2

Hosted badge product for sharing Programmers badge data through public badge URLs.

## Workspace Layout

```text
apps/
  api/          NestJS backend
  extension/    Chrome extension (Manifest V3)
packages/
  badge-core/   pure TypeScript badge rendering/domain logic
  shared-types/ shared request/response contracts
  config/       shared lint, prettier, tsconfig config
```

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm verify`

## Key Documents

- `AGENTS.md`
- `.codex/README.md`
- `.codex/rules/common.md`
- `.codex/rules/architecture.md`
- `.codex/rules/api.md`
- `.codex/rules/extension.md`
- `.codex/rules/packages.md`
- `.codex/rules/roadmap.md`
- `.codex/rules/adrs/README.md`
- `.codex/instructions/workflow.md`
- `.codex/instructions/review.md`
- `.codex/instructions/git.md`

## Deployment

- local Docker flow: `docker-compose.local.yml`
- NAS production flow: `deploy/README.md`
