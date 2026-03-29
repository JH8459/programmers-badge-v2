# Workflow Lanes

## 목적

- 표준 파이프라인의 병렬 가능한 작업을 lane 단위로 분리한다.
- lane 결과가 `apps/api`, `apps/extension`, `packages/*` 경계를 흐리지 않도록 한다.

## Lane 정의

### Lane Explore

- 역할: 코드 영향 package/파일/원인 후보 탐색
- 입력: 기능 요구사항, 검색 키워드
- 산출물: 파일 목록, 변경 경계, 리스크 후보
- 권장 에이전트: `explore`

### Lane Planning

- 역할: 구현 계획/체크리스트 작성
- 입력: 요구사항, Lane Explore 결과
- 산출물: 페이즈별 액션, 병렬/직렬 분해안, in/out of scope
- 권장 에이전트: `general`

### Lane Package Boundary

- 역할: 작업이 어느 package 책임에 속하는지 정리
- 입력: 요구사항, 영향 파일 목록
- 산출물: API / extension / shared package 책임 분리안
- 권장 에이전트: `general`

### Lane Build Support

- 역할: 빌드/린트 실패 로그 분류
- 입력: 명령 출력
- 산출물: 오류 유형 분류(타입/린트/런타임), 우선순위
- 권장 에이전트: `general`

### Lane Review Support

- 역할: 리뷰 체크리스트 사전 점검
- 입력: diff, 규칙 문서
- 산출물: 점검 요약, 잠재 CRITICAL 후보, MVP drift 후보
- 권장 에이전트: `general`

## 합류 규칙

- Lane Explore/Planning/Package Boundary 결과를 먼저 합류해 구현 경계를 고정한다.
- 구현 이후 Lane Build Support/Review Support를 수행해 테스트 루프로 연결한다.
- 충돌 시 최소 변경 원칙을 우선한다.
