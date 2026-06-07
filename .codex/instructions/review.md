# Review Instruction

## Severity

- `CRITICAL`: 빌드/런타임 실패, 보안 문제, boundary 위반, MVP 방향 이탈
- `WARNING`: 잠재 버그, 검증 누락, 구조적 냄새
- `SUGGESTION`: 유지보수성 개선 제안

## Remote GitHub Review

- Codex GitHub 원격 PR 리뷰는 `.codex/instructions/remote-code-review.md`의 `P0`/`P1`/`P2`/`P3` 기준을 따른다.
- 원격 리뷰 코멘트와 요약은 한국어로 작성한다.
- `CRITICAL`은 보통 `P0`, merge 전에 고쳐야 하는 `WARNING`은 `P1`, 권장 수준의 `WARNING`은 `P2`, `SUGGESTION`은 보통 `P3`로 본다.

## Review Checklist

### Product / Scope

- hosted badge MVP 방향을 벗어난 기능이 섞이지 않았는가
- 요청하지 않은 automation, infra, admin 기능이 추가되지 않았는가

### Architecture

- `apps/api`, `apps/extension`, `packages/*` 책임이 섞이지 않았는가
- app 간 직접 import나 구현 누수가 없는가
- 공통 규칙과 개별 규칙이 충돌하지 않는가

### API

- 서버 입력 검증과 normalization이 누락되지 않았는가
- shared contract가 바뀌었으면 zod schema와 API boundary validation이 함께 갱신되었는가
- persistence/public badge 규칙이 `badge-core`, `shared-types`와 어긋나지 않는가
- public response에 과한 데이터가 노출되지 않는가

### Extension

- extension 권한이 최소 범위를 유지하는가
- sync state, popup, auto-sync 흐름이 함께 갱신되었는가
- backend persistence나 admin 성격 로직이 extension에 복제되지 않았는가

### Shared Packages

- `packages/badge-core`는 pure하고 deterministic한가
- `packages/shared-types`는 contract와 shared zod schema만 소유하는가
- shared package 변경이 consumer app들에 반영되었는가

### Quality

- 관련 타입, 테스트, 문서가 함께 갱신되었는가
- 상태 코드와 실패 케이스가 적절한가
- 관련 없는 리팩터링이 섞이지 않았는가
