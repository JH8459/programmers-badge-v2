# Common Rule

## Product Definition

`PROGRAMMERS-BADGE-V2`는 hosted badge product다.

- 핵심 결과물은 public badge URL과 Markdown snippet이다.
- 사용자는 Chrome extension으로 로그인된 Programmers 세션을 활용해 데이터를 sync한다.
- backend는 정규화된 badge snapshot을 저장하고 public badge를 제공한다.

## Repository Defaults

- 설명은 한국어로 작성하고, 경로/명령어/식별자는 English 그대로 둔다.
- 변경은 작고 검증 가능한 단위로 유지한다.
- 애매하면 범위를 넓히기보다 hosted badge MVP와 package boundary를 다시 확인한다.
- `.codex`가 repo 작업 기준 문서다.

## Runtime And Tooling Defaults

- package manager: `pnpm`
- task runner: `turbo`
- Node.js: `>=22.0.0`
- shared runtime contract validation 기본값은 `zod`다.
- 외부 입력, storage, DB row, browser API 결과처럼 runtime shape가 불확실한 값은 `as` 타입 단언보다 zod parse 또는 명시적 타입가드를 우선한다.
- required 값은 zod base schema를 기본으로 검증하고, 허용 의도가 있을 때만 `.optional()`, `.nullable()`, `.nullish()`를 붙인다.
- unknown boundary에서 `class-validator`의 `isDefined()`처럼 `undefined`와 `null`만 막아야 하면 `packages/shared-types`의 `definedValueSchema`를 사용한다.
- 빈 배열 검증은 `class-validator`의 `arrayNotEmpty()` 대신 `z.array(...).nonempty()` 또는 `packages/shared-types`의 `createNonEmptyArraySchema(...)`를 사용한다.
- 빈 문자열 또는 공백 문자열 검증은 `z.string().trim().min(1)`을 사용한다.
- 기본 목표 스크립트: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm test:e2el`, `pnpm test:api-coverage`, `pnpm verify`
- repo에 없는 명령은 지어내지 않는다.

## MVP In Scope

1. extension-triggered sync
2. backend persistence for normalized badge data
3. public badge SVG delivery
4. copyable public badge URL and Markdown snippet

## MVP Out Of Scope

- GitHub repository write
- broad GitHub write automation, PAT, repository dispatch 기반 product automation
- raw credential 저장
- admin dashboard
- queue, Redis, analytics, WebSocket 같은 추가 인프라

## Shared Guardrails

- GitHub repository write, broad GitHub write automation, PAT, admin dashboard, queue/Redis/WebSocket은 명시적 요청 없이는 다루지 않는다.
- raw credential 저장을 기본값으로 두지 않는다.
- app boundary를 넘는 request/response validation이 필요하면 app-local validator보다 shared zod schema를 우선한다.
- 소유 코드에서 함수 또는 메서드 인자가 2개 이상이면 positional args보다 props object를 우선한다.
- 2개 이상 인자 함수에는 호출부가 의미를 잃지 않도록 `interface` 또는 명명된 object type을 정의한다.
- framework callback, DOM/Chrome/Nest API처럼 외부 시그니처가 고정된 경우에는 object-args 규칙을 강제하지 않는다.
- public surface에 민감한 사용자 정보를 노출하지 않는다.
- 저장 대상은 public badge delivery에 필요한 최소 데이터로 제한한다.
- sync는 사용자 트리거 기반을 기본값으로 두고, 과한 자동화는 나중 문제로 미룬다.
- 기능 추가보다 설치/동기화/복사 흐름의 단순성을 우선한다.

## Core User Flow

1. 사용자가 extension을 설치한다.
2. 사용자가 Programmers에 로그인된 브라우저 세션을 유지한다.
3. extension이 최소 payload를 backend로 sync한다.
4. backend가 badge snapshot을 저장한다.
5. 사용자가 public badge URL 또는 Markdown snippet을 복사해 사용한다.

## Auth Default

- 기본 인증 모델은 브라우저 세션 활용이다.
- extension은 로그인된 Programmers 세션을 활용한다.
- backend는 sync payload를 검증하고 저장한다.
- 장기 credential 저장 구조는 명시적 승인 없이는 도입하지 않는다.
