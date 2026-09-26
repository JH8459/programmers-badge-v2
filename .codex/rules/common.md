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

## TypeScript 코드 작성 규칙

### 주석

- 주석은 한국어로 작성하고, 식별자와 API 용어는 English 표기를 유지한다.
- 코드를 읽으면 알 수 있는 내용을 되풀이하지 않는다. 주석은 코드만으로 알기 어려운 불변 조건, 실행 순서의 제약, 플랫폼/API 제약, 실패 시 지켜야 할 동작을 설명할 때 쓴다.
- 일반 인라인 주석은 한 문장, 최대 두 줄로 제한한다. 두 줄 안에 담기 어려우면 지켜야 할 규칙만 남기고 배경이나 설계 결정은 문서 또는 ADR에 둔다.
- 코드 주석 본문에는 백틱, 강조, 제목, 링크 같은 Markdown 표기를 쓰지 않는다. `@ts-expect-error`, lint suppression 등 도구 지시 주석에는 필요한 이유를 같은 줄에 적는다.
- TODO는 한 줄로 작성하고 완료 조건이 드러나게 한다. 임시 코드가 정리되면 TODO도 함께 제거한다.
- 테스트의 Given/When/Then 표식과 짧은 섹션 제목처럼 구조를 구분하는 주석은 유지할 수 있다. 각 표식은 간결하게 쓰고, 테스트 동작을 다시 설명하는 주석은 덧붙이지 않는다.
- `if`, `for`, `while` 등 제어문 본문에는 한 줄이어도 중괄호를 쓴다.
- TypeScript 또는 lint suppression은 필요한 가장 좁은 범위에 적용하고, 사유를 같은 줄에 적는다. 코드가 바뀌어 예외가 더는 필요 없으면 suppression도 제거한다.

### 가변 변수와 예외 처리

- 변수는 `const`를 기본으로 한다. 반복 상태가 바뀌거나 `try` 안에서 값을 받아 성공 경로에서 이어서 써야 하는 경우처럼 재할당이 필요한 곳에만 `let`을 쓴다.
- `try` 안에서 만든 값을 뒤에서 사용할 때는 필요한 타입으로 `let`을 선언하고, `try` 안에서 대입한다. 실패 경로는 `return` 또는 `throw`로 끝내어 성공 경로의 값이 항상 대입되게 한다. 사용하지 않는 기본값이나 non-null assertion으로 초기화 순서를 감추지 않는다.
- `try/catch`는 예외를 복구하거나, 현재 경계의 오류로 변환하거나, 필수 정리 작업을 한 뒤 다시 던져야 할 때 사용한다. 처리할 일이 없는 예외는 상위 경계로 전파한다.
- `try` 블록에는 해당 `catch`가 처리할 실패 가능 작업만 둔다. 인자 계산, 요청 본문 조립, 검증처럼 별도로 실패해야 하는 작업은 `try` 밖에서 수행해 그 오류가 실수로 삼켜지지 않게 한다.
- `catch` 값은 `unknown`으로 다루고 `instanceof Error` 또는 명시적 타입 가드로 좁힌다. 예상하지 못한 값을 `Error`로 단정하거나, 원인 오류를 무심코 버리지 않는다.
- 실패를 삼키는 것은 주 작업의 성공 여부와 무관한 best-effort 작업으로 한정한다. 이 경우 실패가 의도적으로 격리된다는 점을 드러내고, 필요한 로그에는 진단에 필요한 비민감 정보만 포함한다. 저장, 검증, 동기화, 배지 생성 등 기능의 필수 결과에 영향을 주는 오류는 성공으로 처리하지 않는다.
- 예외를 사용자 응답으로 변환할 때는 내부 오류 메시지나 민감 정보를 그대로 노출하지 않고, 필요한 경우 원인 오류는 내부 진단용으로 보존한다.

### 테스트

- Promise rejection을 검증할 때는 테스트 프레임워크의 rejection matcher를 사용한다. 직접 `try/catch`를 써야 한다면 예외가 발생하지 않은 경우 테스트가 실패하도록 명시한다.
- 테스트에서 변경한 환경변수, timer, 파일, DB 같은 공유 상태와 임시 자원은 `finally` 또는 `afterEach`에서 복원·정리한다.

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
