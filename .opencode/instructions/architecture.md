# Architecture Guide

## 기본 방향

- `PROGRAMMERS-BADGE-V2`는 hosted badge product다.
- 기본 구조는 `apps/api` + `apps/extension` + `packages/*` 모노레포다.
- 구현은 항상 package boundary를 먼저 지키고, 기능은 작게 나눠 추가한다.
- 자세한 제품 방향은 `.opencode/instructions/project-context.md`를 따른다.

## 패키지 책임

- `apps/api`
  - NestJS API, sync orchestration, persistence, caching, public badge delivery
- `apps/extension`
  - Chrome extension UX, browser session integration, user-triggered sync
- `packages/badge-core`
  - pure TypeScript rendering logic, badge rules, deterministic helpers
- `packages/shared-types`
  - extension과 API가 공유하는 request/response contracts

## 의존성 규칙

- `apps/api`는 `packages/badge-core`, `packages/shared-types`를 사용할 수 있다.
- `apps/extension`은 `packages/shared-types`를 기본으로 사용하고, badge preview가 필요할 때만 `packages/badge-core`를 사용한다.
- `packages/*`는 `apps/*`를 import하지 않는다.
- `apps/api`는 Chrome API를 import하지 않는다.
- `apps/extension`은 NestJS 전용 모듈이나 persistence 구현체를 import하지 않는다.

## 데이터 흐름 기본값

1. extension이 로그인된 Programmers 세션을 활용한다.
2. extension이 최소한의 sync payload를 만든다.
3. API가 payload를 검증하고 정규화해 저장한다.
4. public badge endpoint가 저장된 데이터와 `badge-core`를 사용해 SVG를 제공한다.

## 경계별 가드레일

### `packages/badge-core`

- framework-agnostic해야 한다.
- 입력이 같으면 출력이 같아야 한다.
- NestJS, Chrome API, network, filesystem 접근을 넣지 않는다.

### `apps/api`

- rendering template를 직접 소유하지 않는다.
- public badge endpoint와 sync endpoint를 제공한다.
- storage와 caching은 API 계층 내부에 캡슐화한다.

### `apps/extension`

- popup, options, background/service worker 같은 browser UX만 담당한다.
- 가능한 최소 권한만 요청한다.
- 서버의 정규화 규칙을 프런트에 중복 구현하지 않는다.

## 보안과 범위

- raw credential 저장 구조는 명시적 승인 없이는 추가하지 않는다.
- public badge URL에는 민감 정보가 드러나지 않아야 한다.
- GitHub export, admin dashboard, queue/Redis/WebSocket은 기본 MVP 범위가 아니다.
