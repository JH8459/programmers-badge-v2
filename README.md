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
- `.opencode/rules/product.md`
- `.opencode/rules/architecture.md`
- `.opencode/rules/roadmap.md`
- `.opencode/rules/adrs/README.md`
- `.opencode/instructions/workflow.md`
- `.opencode/instructions/review.md`
- `.opencode/instructions/git.md`
