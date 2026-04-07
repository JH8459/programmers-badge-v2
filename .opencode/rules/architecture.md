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
- persistence, storage adapter, cache policy를 소유한다.
- 저장된 badge data를 `packages/badge-core`에 전달해 렌더링한다.

### `apps/extension`

- Chrome APIs와 browser UX를 소유한다.
- 로그인된 Programmers 세션을 활용해 sync payload를 준비한다.
- 사용자 트리거 기반 sync와 copy flow를 제공한다.

### `packages/badge-core`

- badge rendering rule과 deterministic helper를 소유한다.
- framework, network, filesystem, Chrome API에 의존하지 않는다.

### `packages/shared-types`

- API와 extension 사이의 request/response contract만 소유한다.
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
5. API가 `badge-core`를 사용해 public badge SVG를 제공한다.

## Forbidden Patterns

- `apps/api`에서 badge rendering 규칙을 중복 구현
- `apps/extension`에서 backend persistence 규칙 복제
- `packages/badge-core`에 I/O 또는 framework dependency 추가
- package boundary를 깨는 cross-import
