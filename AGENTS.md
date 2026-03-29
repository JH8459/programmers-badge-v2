# AGENTS.md

## Purpose

이 문서는 `PROGRAMMERS-BADGE-V2`에서 작업하는 AI 코딩 에이전트를 위한 저장소 기본 지침이다.

- 먼저 `AGENTS.md`를 읽고,
- 이어서 `.opencode/instructions/project-context.md`를 확인한다.

명시적인 사용자 요청이 있으면 그 범위를 우선하되, 별도 지시가 없으면 이 문서의 기본값을 따른다.

## Product Context

- `PROGRAMMERS-BADGE-V2`는 hosted badge product다.
- MVP의 기본 결과물은 public badge URL이다.
- 사용자는 Chrome extension을 설치하고, 로그인된 Programmers 브라우저 세션을 활용해 badge 데이터를 sync한다.
- backend는 정규화된 badge 데이터를 저장하고 public badge URL 또는 Markdown snippet에 사용할 결과를 제공한다.
- MVP에서는 사용자의 GitHub repository에 badge 파일을 push하지 않는다.
- MVP에서는 GitHub Actions, PAT 입력, repository dispatch 같은 흐름을 기본값으로 도입하지 않는다.

## Architecture Defaults

별도 지시가 없으면 아래 구조를 기준으로 판단한다.

```text
apps/api            NestJS backend
apps/extension      Chrome extension (Manifest V3)
packages/badge-core pure TypeScript badge rendering/domain logic
packages/shared-types shared request/response contracts
docs                architecture, product, auth, roadmap
```

### Responsibility Boundaries

- `apps/api`
  - API, sync orchestration, persistence, caching, public badge delivery
- `apps/extension`
  - Chrome APIs, browser UX, user-triggered sync, session-aware integration
- `packages/badge-core`
  - framework-agnostic rendering logic, badge rules, deterministic helpers
- `packages/shared-types`
  - API와 extension이 공유하는 계약 타입

### Boundary Rules

- `packages/*`는 `apps/*`를 import하지 않는다.
- `packages/badge-core`에는 NestJS, Chrome API, network, filesystem access를 넣지 않는다.
- `apps/api`는 badge rendering 규칙을 중복 구현하지 않는다.
- `apps/extension`은 backend persistence 로직을 복제하지 않는다.
- app 간 직접 import보다 shared package 경계를 우선한다.

## Working Principles

- 설명은 한국어로 작성하고, 파일 경로, 패키지명, 명령어, API 경로, 코드 식별자는 영어 그대로 둔다.
- 작업은 작고 검증 가능한 단위로 나눈다.
- 항상 `In scope`와 `Out of scope`를 분명히 한다.
- 관련 없는 리팩터링, 리네이밍, 포맷 변경은 피한다.
- 먼저 기존 문서와 구조를 읽고, 그 뒤 기존 패턴을 재사용한다.
- 설계만 요청받았으면 파일을 수정하지 않는다.

## Security Guardrails

- raw email/password 저장은 기본값으로 두지 않는다.
- public badge endpoint에 민감한 사용자 정보를 노출하지 않는다.
- extension 권한은 가능한 최소 범위만 사용한다.
- privacy, retention, public exposure 이슈가 생기면 최종 보고에 반드시 적는다.

## MVP Guardrails

명시적인 요청이 없으면 아래 항목은 기본 범위 밖이다.

- GitHub repository write
- GitHub Actions / PAT / workflow automation
- admin dashboard
- queue, Redis, analytics, WebSocket 같은 추가 인프라

## Planning And Execution

### Planning mode

- 저장소와 문서를 읽고 구현 계획, 옵션, 리스크, 추천안을 정리한다.
- 구현은 하지 않는다.

### Execution mode

- 합의된 범위 안에서만 구현한다.
- 영향 범위에 맞는 검증을 수행한다.
- 검증이 불가능하면 이유와 필요한 후속 작업을 적는다.

## Validation Rules

- 코드 변경 시 가능한 범위에서 `lint`, `typecheck`, `test`, `build`를 실행한다.
- 문서 변경만 있으면 문서 일관성, 참조 경로, 가드레일 정합성을 확인한다.
- repo bootstrap 전이라 스크립트가 없으면 명령을 지어내지 말고, 미실행 사유를 보고한다.
- public badge 관련 변경은 상태 코드, 출력 형식, 민감 정보 노출 여부를 함께 확인한다.
- extension UI 관련 변경은 작은 viewport에서 핵심 상태와 액션이 보이는지 함께 확인한다.

## Reporting Format

작업이 끝나면 아래를 짧게 보고한다.

1. 무엇을 바꿨는지
2. 왜 바꿨는지
3. 어떤 파일을 건드렸는지
4. 어떤 검증을 했는지
5. 남은 제한사항이나 후속 작업이 무엇인지

## Recommended References

- `.opencode/instructions/project-context.md`
- `.opencode/instructions/architecture.md`
- `.opencode/instructions/workflow.md`
- `.opencode/instructions/review.md`

이 저장소에서 애매함이 생기면, 범위를 넓히기보다 hosted badge MVP와 package boundary를 다시 확인하는 쪽을 우선한다.
