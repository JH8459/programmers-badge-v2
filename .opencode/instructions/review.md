# Review Guide

## 등급

- `CRITICAL`: 보안 문제, package boundary 위반, 빌드/런타임 실패, MVP 방향 이탈
- `WARNING`: 잠재 버그, 검증 누락, 구조적 냄새
- `SUGGESTION`: 개선 제안, 유지보수성 향상 포인트

## 필수 체크

### 아키텍처 경계

- `packages/badge-core`가 pure하고 deterministic한가
- `packages/shared-types`가 계약 타입 외 책임을 갖지 않는가
- `apps/api`가 rendering 로직을 중복 구현하지 않는가
- `apps/extension`이 Chrome-specific 책임을 넘지 않는가
- app 간 직접 import 또는 누수된 구현 의존성이 없는가

### 제품 방향

- hosted badge MVP 방향을 벗어난 GitHub export, PAT, workflow 자동화를 끼워 넣지 않았는가
- 요청하지 않은 admin/infra 확장이 섞이지 않았는가

### 보안/개인정보

- raw credential 저장 구조가 기본값으로 들어가지 않았는가
- public badge endpoint에서 민감 정보가 노출되지 않는가
- extension 권한이 최소 범위를 유지하는가
- 입력 검증과 서버 측 normalization이 누락되지 않았는가

### API / sync / rendering

- payload contract와 서버 처리 흐름이 일관적인가
- HTTP 상태 코드와 실패 케이스가 적절한가
- rendering은 `badge-core`를 통해 재사용되는가
- sync 성공/실패 후 상태 갱신이 추적 가능한가

### UX / 품질

- extension 또는 public UI에 로딩/에러/빈 상태가 있는가
- 작은 화면에서도 핵심 액션이 드러나는가
- 관련 문서, 타입, 테스트가 필요한 범위만큼 갱신되었는가
- 관련 없는 리팩터링이 섞이지 않았는가
