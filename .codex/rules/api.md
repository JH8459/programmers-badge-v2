# API Rule

## Ownership

`apps/api`는 NestJS backend로서 아래를 소유한다.

- `/api/sync`, `/api/badge/:slug.svg`, `/api/health` endpoint
- `/badge/:slug.svg` 정적 서빙 경로
- payload validation과 normalization
- SQLite persistence와 schema 관리
- pre-rendered SVG asset 생성과 public badge URL 조합

## Runtime Defaults

- global prefix는 `/api`다.
- 기본 `PORT`는 `3000`이다.
- `PUBLIC_BASE_URL`이 없으면 public badge URL은 `http://localhost:${PORT}` 기준으로 생성한다.
- `PUBLIC_BADGE_PATH_PREFIX`가 없으면 public badge URL path는 `/badge`를 사용한다.
- `DATABASE_PATH`가 없으면 기본 SQLite 파일은 `data/programmers-badge.sqlite`다.
- `BADGE_OUTPUT_DIR`가 없으면 기본 SVG 출력 디렉토리는 `data/badges`다.
- Docker Compose runtime은 `/data/programmers-badge.sqlite`를 사용한다.
- Docker Compose public entrypoint는 API 단일 컨테이너 `:3000`을 사용한다.
- NAS production runtime은 `deploy/docker-compose.deploy.yml` 기준으로 GHCR 이미지를 pull한다.
- NAS host port 기본 추천값은 `5010`이다.

## Current Behavior Defaults

- sync 응답은 `BadgeSyncResponse`를 반환한다.
- public badge는 SVG만 제공한다.
- health endpoint는 minimal readiness 확인용이다.
- re-sync 시 같은 `programmerHandle`이면 기존 `publicSlug`를 유지한다.
- sync 시 동일 slug의 SVG asset을 pre-render하여 갱신한다.
- `/badge/*.svg`는 Nest/Express static middleware로 정적 서빙한다.
- persistence schema 변경은 현재 additive migration 패턴을 우선한다.
- API production deploy는 `verify -> GHCR push -> NAS SSH deploy` 순서를 기본 흐름으로 둔다.
- 현재 NAS deploy workflow는 `appleboy/ssh-action`의 password 인증을 기본값으로 둔다.

## Validation And Security

- 입력 검증은 서버에서 수행하고 client 입력을 신뢰하지 않는다.
- whitelist 기반 validation과 normalization을 유지한다.
- public response에는 public badge 제공에 필요 없는 민감 정보를 넣지 않는다.
- CORS 변경 시 localhost 개발 흐름과 extension origin 허용 범위를 함께 검토한다.

## Guardrails

- `apps/api`는 rendering 규칙을 직접 중복 구현하지 않고 `packages/badge-core`를 사용한다.
- Chrome API나 extension 전용 상태 모델을 API로 끌어오지 않는다.
- persistence 로직은 API 안에 두고 extension으로 새지 않게 유지한다.
- badge asset I/O는 API가 소유하되, 렌더링 자체는 `badge-core`에 유지한다.
- env, URL, slug 정책을 바꾸면 API 응답, extension 소비부, 문서를 함께 갱신한다.

## When Editing

- public response shape를 바꾸면 `packages/shared-types`, extension copy flow, 관련 테스트를 함께 갱신한다.
- badge SVG 규칙을 바꾸면 `packages/badge-core`로 이동 가능한지 먼저 검토한다.
- persistence/schema를 바꾸면 기존 DB 호환성과 re-sync semantics를 먼저 확인한다.
