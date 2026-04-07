# Roadmap Rule

## Current State

- monorepo baseline은 준비되어 있다.
- `packages/badge-core`와 `packages/shared-types`는 기본 contract/rendering을 제공한다.
- `apps/api`는 SQLite 기반 sync/public badge MVP를 제공한다.
- Docker Compose 기반 단일 API 배포 베이스가 있다.

## Next Phase 1 - Extension MVP Completion

- 실제 Programmers page/session에서 sync payload를 추출한다.
- popup에서 sync 결과, 마지막 상태, 복사 액션을 연결한다.
- local/dev/prod API base URL 전략을 확정한다.

## Next Phase 2 - Contract Hardening

- sync payload와 public response contract를 안정화한다.
- validation failure, not-found, re-sync semantics를 문서와 테스트로 고정한다.
- extension과 API 사이의 ownership/auth strategy를 명확히 한다.

## Next Phase 3 - Hosted Delivery Hardening

- public badge URL 운영 방식, slug 정책, caching policy를 정리한다.
- privacy/data retention 기준을 문서화한다.
- deployment, backup, restore, env strategy를 안정화한다.

## Deferred Until Explicit Need

- GitHub automation
- admin UI
- multi-tenant admin features
- queue/worker infra
- analytics/observability stack beyond minimal ops needs
