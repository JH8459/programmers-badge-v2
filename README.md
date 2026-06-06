# PROGRAMMERS-BADGE-V2

Hosted badge product for sharing Programmers badge data through public badge URLs.

## Workspace Layout

```text
apps/
  api/          NestJS backend
  extension/    Chrome extension (Manifest V3)
  web/          React public web UI
packages/
  badge-core/   pure TypeScript badge rendering/domain logic
  shared-types/ shared request/response contracts
  config/       shared lint, prettier, tsconfig config
```

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm dev:web`
- `pnpm build`
- `pnpm build:web`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:e2el`
- `pnpm test:api-coverage`
- `pnpm verify`
- `pnpm package:extension`

## Key Documents

- `AGENTS.md`
- `.codex/README.md`
- `.codex/rules/common.md`
- `.codex/rules/architecture.md`
- `.codex/rules/api.md`
- `.codex/rules/api/runtime.md`
- `.codex/rules/api/contracts.md`
- `.codex/rules/api/badge-delivery.md`
- `.codex/rules/extension.md`
- `.codex/rules/extension/runtime.md`
- `.codex/rules/extension/sync-flow.md`
- `.codex/rules/extension/release-assets.md`
- `.codex/rules/web.md`
- `.codex/rules/web/ui.md`
- `.codex/rules/web/assets.md`
- `.codex/rules/web/publishing.md`
- `.codex/rules/packages.md`
- `.codex/rules/roadmap.md`
- `.codex/rules/adrs/README.md`
- `.codex/instructions/workflow.md`
- `.codex/instructions/review.md`
- `.codex/instructions/git.md`

## Deployment

- local Docker flow: `docker-compose.local.yml`
- NAS production flow: `deploy/README.md`
- privacy policy page: `https://programmers-badge.jh8459.com/privacy`
- web local container: `docker compose -f docker-compose.local.yml up -d --build web`
- extension package release flow: `.github/workflows/release-extension.yml`
- extension local package: `pnpm package:extension`
- Chrome Web Store listing assets: `apps/extension/store-assets`

## Local Docker

```bash
docker compose -f docker-compose.local.yml up -d --build
```

Optional local port override:

```bash
API_PORT=5611 \
WEB_PORT=5610 \
PUBLIC_BASE_URL=http://localhost:5611 \
VITE_API_BASE_URL=http://localhost:5611 \
docker compose -f docker-compose.local.yml up -d --build

API_PORT=5611 WEB_PORT=5610 docker compose -f docker-compose.local.yml down
```

## Local Web

```bash
pnpm dev:web
```

## Local Dynamic Ports

`docker-compose.local.yml` supports `API_PORT`, `WEB_PORT`, `PUBLIC_BASE_URL`, `VITE_API_BASE_URL`, `ALLOWED_WEB_ORIGINS`, `ALLOW_LOCALHOST_ORIGINS`, `ENABLE_SWAGGER`, `SWAGGER_USERNAME`, `SWAGGER_PASSWORD`, and `COMPOSE_PROJECT_NAME` environment overrides for running isolated local stacks.
