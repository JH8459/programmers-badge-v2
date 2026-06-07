# Remote Code Review Instruction

이 문서는 Codex GitHub 원격 PR 리뷰의 기준이다.
일반 구현/로컬 리뷰 기준은 `.codex/instructions/review.md`를 함께 참고한다.

## Language

- 리뷰 코멘트와 리뷰 요약은 항상 한국어로 작성한다.
- 경로, 명령어, 식별자, error message, config key는 English 그대로 유지한다.
- finding 제목에는 severity prefix를 붙인다. 예: `[P1] sync payload runtime validation이 누락됨`.

## Review Scope

- PR diff 기준으로 실제 회귀, 보안/설정 위험, 필수 컨벤션 위반, 누락된 검증을 우선한다.
- 추측만으로 finding을 만들지 않는다. 코드 근거가 불충분하면 질문이나 가정으로 남긴다.
- 관련 없는 리팩터링, 취향성 스타일, 미래 개선안은 merge 판단에 영향을 주지 않는 낮은 priority로 둔다.
- GitHub 원격 리뷰의 기본 코멘트는 `P0`/`P1` 중심으로 유지한다. `P2`/`P3`는 명시적으로 요청받았거나 리뷰 요약에 짧게 남길 가치가 있을 때만 포함한다.

## Severity

### P0

즉시 수정하지 않으면 merge하면 안 되는 문제다.

- secret, token, credential, cookie, session, raw `.env` 값이 코드/로그/public response/release artifact에 노출됨
- `.env`, production secret, deploy target, domain, CORS, auth, permission 같은 설정값이 source-of-truth와 충돌하거나 보안을 약화함
- 인증/인가 우회, 민감 데이터 노출, public badge surface의 과도한 사용자 정보 노출
- build, typecheck, runtime bootstrap, deploy workflow가 깨져 production 또는 핵심 앱이 동작하지 않음
- destructive migration, 데이터 손실, rollback 불가능한 production deploy 위험
- repo boundary를 깨서 `apps/api`, `apps/extension`, `apps/web`, `packages/*` 책임이 심각하게 섞이고 실제 런타임 오류나 보안 위험으로 이어짐

### P1

merge 전에 수정해야 하는 필수 품질/컨벤션 위반이다.

- `.codex/rules/*`의 필수 architecture, package boundary, MVP scope, runtime validation 규칙을 위반함
- 외부 입력, storage, DB row, browser API 결과, request/response 같은 unknown boundary에서 zod parse 또는 명시적 타입가드가 누락됨
- shared contract 변경 후 `packages/shared-types` zod schema, API boundary validation, consumer app 반영, 관련 테스트 중 하나가 빠짐
- API 상태 코드, 실패 케이스, persistence/public badge delivery 흐름이 실제 사용자 동작을 깨뜨림
- extension permission, manifest, message flow, sync state 변경이 최소 권한 또는 사용자 트리거 기반 sync 원칙을 깨뜨림
- behavior change가 있는데 관련 테스트, typecheck, build, lint 검증 또는 문서 갱신이 누락되어 회귀를 잡기 어려움
- 필수 코드 품질 규칙을 어김: 의미 없는 `as` 단언, nullable 값의 부정확한 truthy/falsy 처리, 2개 이상 인자 함수의 무명 positional args 남용 등

### P2

현재 codebase 기준으로 갖추는 것이 좋지만 merge blocker는 아닌 문제다.

- local helper, established pattern, module structure를 따르지 않아 유지보수가 어려워짐
- 중복 구현, 불필요한 abstraction, 모듈 응집도 저하 같은 구조적 냄새가 있으나 즉시 버그로 이어지지는 않음
- 테스트가 있으면 좋지만 현재 변경의 위험도상 필수 blocker까지는 아닌 보강 포인트
- README, `.codex`, skill 문서, PR 설명 등 문서가 약간 stale하지만 사용자를 잘못된 운영/릴리스로 이끌 위험은 낮음
- 에러 메시지, 로그, user-facing copy가 더 명확해질 수 있음

### P3

선택적 개선 또는 취향성 피드백이다.

- naming, formatting, 작은 가독성 개선, comment wording 같은 nit
- 성능 영향이 작거나 검증되지 않은 micro-optimization 제안
- 현재 요청 범위를 넘는 미래 개선 아이디어
- merge 판단과 무관한 참고 의견

## Review Format

finding은 가능하면 아래 형식을 따른다.

```text
[P1] 짧은 제목
- 위치: path/to/file.ts:123
- 문제: 코드 근거와 실제 영향
- 제안: 가장 작은 수정 방향
```

리뷰에서 문제가 없으면 명확히 말한다.

```text
P0/P1 finding은 없습니다.
남은 리스크: 실행하지 못한 검증 또는 확인하지 못한 범위
```

## Priority Mapping

- 기존 `.codex/instructions/review.md`의 `CRITICAL`은 보통 `P0`다.
- 기존 `WARNING` 중 merge 전에 반드시 고쳐야 하는 것은 `P1`, 권장 개선은 `P2`다.
- 기존 `SUGGESTION`은 보통 `P3`이며, codebase convention을 유지하는 데 실질적으로 필요하면 `P2`로 올릴 수 있다.
