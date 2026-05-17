# Roadmap Rule

## Current State

- monorepo baseline은 준비되어 있다.
- `packages/badge-core`와 `packages/shared-types`는 기본 rendering/contract를 제공하고, shared contract runtime validation은 zod schema를 기준으로 맞춘다.
- `apps/api`는 SQLite 기반 sync/public badge/health MVP와 pre-rendered SVG 정적 서빙을 제공한다.
- `apps/api` runtime env는 단일 zod config로 검증하고 bootstrap 전에 fail-fast 한다.
- `apps/extension`은 manual sync, 제출 감지 기반 auto-sync, popup copy flow를 제공한다.
- `apps/extension`은 page-context fetch와 extension-context validation을 분리해 `executeScript` boundary를 안전하게 유지한다.
- `apps/extension`은 hosted API URL과 host permission을 `api.programmers-badge.jh8459.com` 기준으로 사용한다.
- Docker Compose 기반 API/web 배포 베이스가 있다.
- PR verify, master production deploy, tag/manual release 기준 GitHub Actions 베이스가 있다.
- NAS deploy는 DockerHub API/web image와 committed root `docker-compose.yml` sync 기준으로 운영하되, API/Web workflow를 분리해 service별로 갱신한다.
- API deploy environment는 `production`, extension package release environment는 `extension-release`를 사용한다.
- `apps/web`은 Vite + React + TypeScript 기반 public web UI scaffold와 Nginx runtime image, landing/contact/privacy route를 제공한다.

## Next Phase 1 - Runtime Strategy Hardening

- local/dev/prod API base URL 전략을 장기 운영 관점에서 더 단순화할지 검토한다.
- extension 배포 시 host permission과 runtime config 주입 방식을 정리한다.
- public base URL 운영 규칙과 deploy env ownership을 더 명확히 정리한다.

## Next Phase 2 - Contract And Identity Hardening

- sync payload와 public response contract를 안정화한다.
- validation failure, not-found, re-sync semantics를 문서와 테스트로 고정한다.
- `programmerHandle`, `displayName`, public 노출 데이터의 의미를 명확히 한다.

## Next Phase 3 - Hosted Delivery Hardening

- public badge URL 운영 방식, slug 정책, caching policy를 정리한다.
- privacy/data retention 기준을 문서화한다.
- deployment, backup, restore, env strategy를 안정화한다.
- `programmers-badge.jh8459.com` web UI와 `api.programmers-badge.jh8459.com` API host 분리를 적용한다.

## Next Phase 4 - Public Web UI

- NAS reverse proxy host routing을 확정한다.
- Chrome Web Store 개인정보처리방침 URL을 domain split 기준으로 갱신한다.

## Deferred Until Explicit Need

- admin UI
- multi-tenant admin features
- queue/worker infra
- analytics/observability stack beyond minimal ops needs
