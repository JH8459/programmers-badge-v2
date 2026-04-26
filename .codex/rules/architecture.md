# Architecture Rule

## System Shape

```text
apps/api            NestJS backend
apps/extension      Chrome extension (Manifest V3)
packages/badge-core pure TypeScript badge rendering/domain logic
packages/shared-types shared request/response contracts
packages/config     shared lint/prettier/tsconfig config
```

## Responsibility Boundaries

### `apps/api`

- sync endpoint와 public badge endpoint를 제공한다.
- persistence, badge asset storage adapter, env/runtime wiring을 소유한다.
- sync 시 저장된 badge data를 `packages/badge-core`에 전달해 pre-rendered SVG asset을 생성한다.
- Nest/Express static serving으로 `/badge/*.svg`를 정적으로 서빙한다.
- production artifact는 단일 Docker image로 관리하고, NAS는 DockerHub image pull과 rendered deploy compose로 배포한다.

### `apps/extension`

- Chrome APIs와 browser UX를 소유한다.
- 로그인된 Programmers 세션을 활용해 sync payload를 준비한다.
- 사용자 트리거 기반 sync와 copy flow를 제공한다.

### `packages/*`

- shared package는 app 간 contract, rendering, config만 소유한다.
- app-specific implementation이나 runtime dependency를 담지 않는다.

## Dependency Rules

- `packages/*`는 `apps/*`를 import하지 않는다.
- `apps/api`는 Chrome API를 import하지 않는다.
- `apps/extension`은 persistence 구현체나 NestJS 전용 모듈을 import하지 않는다.
- app 간 직접 import보다 shared package 경계를 우선한다.

## Data Flow Default

1. extension이 로그인된 세션에서 최소 badge data를 읽는다.
2. extension이 sync payload를 만든다.
3. API가 payload를 검증하고 정규화한다.
4. API가 persistence에 badge snapshot을 저장한다.
5. API가 `badge-core`를 사용해 public badge SVG를 pre-render하여 shared volume에 저장한다.
6. API가 `/badge/*.svg`를 정적으로 서빙한다.
7. GitHub Actions가 API 이미지를 DockerHub에 push하고, rendered deploy compose 파일을 NAS로 동기화한 뒤 production 배포를 갱신한다.

## Current Monorepo Defaults

- root workspace는 `pnpm-workspace.yaml`과 `turbo.json`으로 관리한다.
- 공통 검증은 root `pnpm verify`를 기준으로 본다.
- cross-project 변경은 shared contract와 boundary를 먼저 고정한 뒤 app 구현을 맞춘다.

## Forbidden Patterns

- `apps/api`에서 badge rendering 규칙을 중복 구현
- `apps/extension`에서 backend persistence 규칙 복제
- `packages/badge-core`에 I/O 또는 framework dependency 추가
- package boundary를 깨는 cross-import
