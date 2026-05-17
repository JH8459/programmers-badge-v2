# Architecture Rule

이 문서는 monorepo 전체의 책임 경계, dependency boundary, 기본 data flow를 정의한다.
app별 runtime, deploy, UI, permission 같은 세부 정책은 각 app rule entrypoint와 하위 rule을 따른다.

## System Shape

```text
apps/api            NestJS backend
apps/extension      Chrome extension (Manifest V3)
apps/web            React public web UI
packages/badge-core pure TypeScript badge rendering/domain logic
packages/shared-types shared request/response contracts
packages/config     shared lint/prettier/tsconfig config
```

## Responsibility Boundaries

### `apps/api`

- sync endpoint와 public badge endpoint를 제공한다.
- persistence, badge asset storage adapter, env/runtime wiring을 소유한다.
- sync 시 저장된 badge data를 `packages/badge-core`에 전달해 full/mini pre-rendered SVG asset을 생성한다.
- Nest/Express static serving으로 `/badge/*.svg`를 정적으로 서빙한다.
- production artifact는 API Docker image로 관리하고, NAS는 DockerHub image pull과 committed deploy compose sync 후 API service만 재시작한다.

### `apps/extension`

- Chrome APIs와 browser UX를 소유한다.
- 로그인된 Programmers 세션을 활용해 sync payload를 준비한다.
- 사용자 트리거 기반 sync와 full/mini badge copy flow를 제공한다.

### `apps/web`

- public landing, guide, contact, legal pages를 소유한다.
- 사용자를 위한 설치/동기화/복사 안내와 Chrome Web Store 제출용 public 문서를 제공한다.
- API 서버는 기존 `apps/api`를 사용하고, web app은 persistence나 extension-only 로직을 소유하지 않는다.
- production artifact는 web Docker image로 관리하고, NAS는 DockerHub image pull과 committed deploy compose sync 후 web service만 재시작한다.
- production UI 도메인은 `programmers-badge.jh8459.com`, API 도메인은 `api.programmers-badge.jh8459.com` 분리를 기본 방향으로 둔다.

### `packages/*`

- shared package는 app 간 contract, rendering, config만 소유한다.
- cross-project runtime validation이 필요하면 shared contract는 `packages/shared-types`의 zod schema를 우선 기준으로 둔다.
- app-specific implementation이나 runtime dependency를 담지 않는다.

## Dependency Rules

- `packages/*`는 `apps/*`를 import하지 않는다.
- `apps/api`는 Chrome API를 import하지 않는다.
- `apps/extension`은 persistence 구현체나 NestJS 전용 모듈을 import하지 않는다.
- `apps/web`은 persistence 구현체, Chrome API, NestJS 전용 모듈을 import하지 않는다.
- app 간 직접 import보다 shared package 경계를 우선한다.

## Data Flow Default

1. extension이 로그인된 세션에서 최소 badge data를 읽는다.
2. extension이 sync payload를 만든다.
3. extension과 API가 shared contract면 `packages/shared-types` zod schema를 기준으로 payload와 response를 검증한다.
4. API가 persistence에 badge snapshot을 저장한다.
5. API가 `badge-core`를 사용해 full/mini public badge SVG를 pre-render하여 shared volume에 저장한다.
6. API가 `/badge/*.svg`를 정적으로 서빙한다.
7. GitHub Actions가 API 변경 시 API 이미지만 DockerHub에 push하고, committed deploy compose 파일과 `.env.deploy`를 NAS에 반영한 뒤 API service만 갱신한다.
8. GitHub Actions가 web 변경 시 web 이미지만 DockerHub에 push하고, 같은 production compose를 NAS에 반영한 뒤 web service만 갱신한다.
9. GitHub Actions가 extension build 결과를 zip으로 묶어 `extension-release` environment 기준 Release asset으로 게시한다.
10. `programmers-badge.jh8459.com`은 web route를 제공하고, `api.programmers-badge.jh8459.com`은 API와 `/badge/*.svg` public badge route를 제공한다.

## Current Monorepo Defaults

- root workspace는 `pnpm-workspace.yaml`과 `turbo.json`으로 관리한다.
- 공통 검증은 root `pnpm verify`를 기준으로 본다.
- cross-project 변경은 shared contract와 boundary를 먼저 고정한 뒤 app 구현을 맞춘다.

## Forbidden Patterns

- `apps/api`에서 badge rendering 규칙을 중복 구현
- `apps/extension`에서 backend persistence 규칙 복제
- `apps/web`에서 backend persistence 규칙 또는 extension Chrome API 로직 복제
- `packages/badge-core`에 I/O 또는 framework dependency 추가
- package boundary를 깨는 cross-import
