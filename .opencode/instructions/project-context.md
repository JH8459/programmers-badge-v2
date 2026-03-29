# Project Context

## 제품 한 줄 요약

- `PROGRAMMERS-BADGE-V2`는 GitHub repository 자동화 도구가 아니라 hosted badge product다.

## MVP 사용자 흐름

1. 사용자가 Chrome extension을 설치한다.
2. extension이 로그인된 Programmers 브라우저 세션을 활용한다.
3. extension이 최소한의 정규화된 badge 데이터를 backend로 동기화한다.
4. backend가 공개 badge URL 또는 Markdown snippet에 사용할 badge를 제공한다.

## 기본 가드레일

- GitHub repository write, GitHub Actions, PAT 입력은 명시적 요청이 있을 때만 다룬다.
- raw email/password 저장은 기본값으로 두지 않는다.
- public badge endpoint에는 민감한 사용자 정보를 노출하지 않는다.
- 작업은 항상 작고 검증 가능한 단위로 나눈다.

## 기본 구조 가정

```text
apps/api            NestJS backend
apps/extension      Chrome extension (Manifest V3)
packages/badge-core pure TypeScript badge rendering/domain logic
packages/shared-types shared request/response contracts
docs                architecture, product, auth, roadmap
```

## 책임 경계

- `apps/api`
  - sync endpoint, public badge delivery, persistence, caching, orchestration
- `apps/extension`
  - Chrome APIs, browser UX, user-triggered sync, session-aware integration
- `packages/badge-core`
  - framework-agnostic rendering logic, badge rules, deterministic output
- `packages/shared-types`
  - API/extension shared contracts only

## 금지 패턴

- `packages/badge-core`에서 NestJS, Chrome API, network, filesystem 사용
- `apps/api`에서 rendering 규칙 중복 구현
- `apps/extension`에서 backend persistence 로직 복제
- 범위를 넘는 리팩터링이나 미요청 인프라 추가

## 프롬프트 작성 기본값

- 설명은 한국어, 경로/패키지/코드 식별자는 영어 그대로 유지한다.
- `In scope`, `Out of scope`, `Acceptance criteria`, `Validation`을 함께 적는다.
- Planning mode와 Execution mode를 구분한다.
- 최종 보고에는 변경 이유, 변경 파일, 검증, 후속 작업을 포함한다.
