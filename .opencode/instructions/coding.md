# Coding Guide

## 공통 원칙

- TypeScript `strict` 기준의 타입 안전을 우선한다.
- `any`와 과한 타입 단언은 피하고, 필요한 타입은 명시적으로 추가한다.
- 네이밍은 타입/클래스 `PascalCase`, 함수/변수 `camelCase`, 상수 `UPPER_SNAKE_CASE`를 기본으로 한다.
- Boolean 값은 `is`, `has`, `should`, `can` 접두어를 선호한다.
- 불필요한 리네이밍, 포맷 변경, 넓은 리팩터링은 피한다.

## 모노레포 경계 규칙

- app-specific 코드는 해당 app 안에 둔다.
- shared contract는 `packages/shared-types`에 둔다.
- badge rendering과 badge domain rule은 `packages/badge-core`에 둔다.
- `packages/*`는 side effect가 적고 재사용 가능해야 한다.

## import 규칙

- 외부 패키지 -> workspace package -> 로컬 모듈 순서로 정리한다.
- app끼리의 직접 import는 금지한다.
- 깊은 상대 경로보다 workspace entrypoint 또는 명시적 모듈 경로를 선호한다.
- 내부 구현 세부 경로에 과도하게 의존하지 않는다.

## 구현 기준

- 함수는 작고 테스트 가능하게 유지한다.
- 입출력 경계에서는 validation과 normalization을 명확히 분리한다.
- extension에서는 Chrome API wrapper와 UI 로직을 섞지 않는다.
- API에서는 controller, service, persistence 책임을 한 파일에 몰아넣지 않는다.
- `badge-core`는 pure function 중심으로 작성한다.

## 문서와 검증

- public behavior나 contract가 바뀌면 관련 문서와 타입을 함께 갱신한다.
- 테스트가 가능한 로직은 구현과 가까운 범위에 테스트를 둔다.
- 검증 명령은 영향 범위에 맞춰 실행하고, 실행하지 못한 항목은 이유를 보고한다.

## 금지 패턴

- `badge-core`에서 framework import 또는 I/O 추가
- extension에서 backend persistence 규칙 복제
- API에서 rendering 문자열을 직접 이어붙여 중복 구현
- 설명 없는 `eslint-disable`, 빈 catch, 죽은 코드 방치
