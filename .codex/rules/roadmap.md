# Roadmap Rule

## Current State

- monorepo baseline은 준비되어 있다.
- `packages/badge-core`와 `packages/shared-types`는 기본 rendering/contract를 제공한다.
- `apps/api`는 SQLite 기반 sync/public badge/health MVP와 pre-rendered SVG 정적 서빙을 제공한다.
- `apps/extension`은 manual sync, 제출 감지 기반 auto-sync, popup copy flow를 제공한다.
- Docker Compose 기반 단일 API 배포 베이스가 있다.
- PR verify, master deploy, tag/manual release 기준 GitHub Actions 베이스가 있다.
- NAS deploy는 DockerHub image와 rendered deploy compose sync 기준으로 운영한다.

## Next Phase 1 - Runtime Strategy Hardening

- local/dev/prod API base URL 전략을 확정한다.
- extension 배포 시 host permission과 runtime config 주입 방식을 정리한다.
- API env strategy와 public base URL 운영 규칙을 문서화한다.

## Next Phase 2 - Contract And Identity Hardening

- sync payload와 public response contract를 안정화한다.
- validation failure, not-found, re-sync semantics를 문서와 테스트로 고정한다.
- `programmerHandle`, `displayName`, public 노출 데이터의 의미를 명확히 한다.

## Next Phase 3 - Hosted Delivery Hardening

- public badge URL 운영 방식, slug 정책, caching policy를 정리한다.
- privacy/data retention 기준을 문서화한다.
- deployment, backup, restore, env strategy를 안정화한다.

## Deferred Until Explicit Need

- admin UI
- multi-tenant admin features
- queue/worker infra
- analytics/observability stack beyond minimal ops needs
