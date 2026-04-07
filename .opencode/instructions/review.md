# Review Instruction

## Severity

- `CRITICAL`: 빌드/런타임 실패, 보안 문제, boundary 위반, MVP 방향 이탈
- `WARNING`: 잠재 버그, 검증 누락, 구조적 냄새
- `SUGGESTION`: 유지보수성 개선 제안

## Review Checklist

### Product / Scope

- hosted badge MVP 방향을 벗어난 기능이 섞이지 않았는가
- 요청하지 않은 automation, infra, admin 기능이 추가되지 않았는가

### Architecture

- `packages/badge-core`는 pure하고 deterministic한가
- `packages/shared-types`는 contract만 소유하는가
- `apps/api`와 `apps/extension` 책임이 섞이지 않았는가
- app 간 직접 import나 구현 누수가 없는가

### Security / Privacy

- raw credential 저장 구조가 추가되지 않았는가
- public surface에 민감 정보가 노출되지 않는가
- 서버 입력 검증과 normalization이 누락되지 않았는가
- extension 권한이 최소 범위를 유지하는가

### Quality

- 관련 타입, 테스트, 문서가 함께 갱신되었는가
- 상태 코드와 실패 케이스가 적절한가
- 관련 없는 리팩터링이 섞이지 않았는가
