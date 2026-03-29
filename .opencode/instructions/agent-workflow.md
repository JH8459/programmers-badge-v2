# Agent Workflow Guide

## 목적

- AI 작업을 `PROGRAMMERS-BADGE-V2`의 hosted badge 방향에 맞춰 일관되게 수행한다.
- package boundary와 MVP guardrail을 페이즈별 게이트로 관리한다.
- 병렬 가능한 탐색/검토/검증 작업을 분리해 리드타임을 줄인다.

## 표준 6페이즈

1. 컨텍스트 고정
2. 계획 수립
3. 체크포인트 정리
4. 구현 및 검증
5. 리뷰
6. 테스트 루프 및 보고

## 용어 / 명명 규칙

- 진행 단계는 `페이즈(Phase)`로 표기한다.
- 계획명은 의미 기반으로 작성한다.
  - 금지: `PLAN A`, `작업1`, `임시안`
  - 권장: 대상 + 변경 + 목적
  - 예: `public badge endpoint 추가 및 렌더링 경계 정리`

## 페이즈별 규칙

### 페이즈1) 컨텍스트 고정

- 입력: 사용자 요구사항, `.opencode/instructions/project-context.md`
- 해야 할 일:
  - hosted badge product 맥락 재확인
  - `In scope` / `Out of scope` 정리
  - 영향 package와 기본 검증 기준 정의
- 산출물: 짧은 계획 메모 또는 `PLAN.md`
- 게이트: package boundary와 MVP 범위가 명확해야 한다.

### 페이즈2) 계획 수립

- 입력: 페이즈1 산출물
- 해야 할 일:
  - 파일 단위 작업 분해
  - 병렬/직렬 의존성 표기
  - security/privacy 리스크 정리
- 산출물: `WORKFLOW.md` 또는 실행 체크리스트
- 게이트: 변경 위치와 검증 위치가 연결되어야 한다.

### 페이즈3) 체크포인트 정리

- 입력: 계획 산출물
- 해야 할 일:
  - 긴 작업인 경우 현재 상태, 남은 이슈, 다음 액션을 기록
  - checkpoint 문서는 필요할 때만 만든다.
- 산출물: 체크포인트 문서 또는 todo 상태
- 게이트: 중간 상태가 재개 가능해야 한다.

### 페이즈4) 구현 및 검증

- 입력: 확정된 계획
- 해야 할 일:
  - 최소 범위 구현
  - lint/typecheck/test/build 중 relevant validation 실행
  - 실패 시 원인 분류 후 수정
- 산출물: 변경 파일과 검증 로그
- 게이트: 필수 validation 통과 또는 미실행 사유가 설명되어야 한다.

### 페이즈5) 리뷰

- 입력: 변경 diff
- 해야 할 일:
  - `code-reviewer` 기준으로 CRITICAL/WARNING/SUGGESTION 분류
  - boundary, security, public exposure, MVP drift 점검
- 산출물: 리뷰 메모
- 게이트: CRITICAL 0건

### 페이즈6) 테스트 루프 및 보고

- 입력: 검증/리뷰 결과
- 해야 할 일:
  - 실패 케이스 재현 및 수정
  - 최종 변경 요약, 파일 목록, 검증, 후속 작업 정리
- 산출물: 최종 보고
- 게이트: DoD 충족 시 완료

## 병렬 수행 원칙

- 병렬 우선 대상:
  - 코드 탐색 + 계획 정리
  - API 영향 분석 + extension 영향 분석
  - 리뷰 체크리스트 준비 + 빌드 로그 분류
- 직렬 고정 대상:
  - 동일 파일 수정
  - 최종 validation 판정
  - CRITICAL 수정 후 재리뷰

## 질문 / 기본값 규칙

- 질문은 정말 막힐 때 1개만 한다.
- 질문에는 권장 기본값과 달라질 결과를 함께 적는다.
- 기본값 우선순위:
  1. 기존 문서/패턴 재사용
  2. 최소 변경
  3. 검증 가능한 선택

## 완료 기준 (DoD)

- hosted badge MVP 방향이 유지된다.
- package boundary가 깨지지 않는다.
- relevant validation이 수행되었거나 미실행 사유가 설명된다.
- 리뷰 CRITICAL 0건
- 다음 액션이 명확히 기록된다.
