---
name: parallel-subagents
description: 병렬 가능한 단계를 서브에이전트로 분리해 실행하고 결과를 합친다.
---

## 언제 사용하나

- "병렬로 수행해줘"
- "서브에이전트로 나눠서 진행"
- "탐색/계획/리뷰를 동시에"

## 기준 문서

- `.opencode/instructions/project-context.md`
- `.opencode/instructions/agent-workflow.md`
- `.opencode/session/subagents/workflow-lanes.md`
- `.opencode/session/subagents/prompt-templates.md`

## 기본 분업

- Explore Lane
  - 영향 package와 핵심 파일 탐색
  - 원인 후보, boundary 리스크 정리
- Planning Lane
  - 실행 계획/체크리스트 작성
  - `In scope` / `Out of scope` 정리
- Package Lane
  - `apps/api`, `apps/extension`, `packages/*` 단위 영향 분석 또는 구현 분리
- Build Lane
  - 빌드 실패 로그 분류(타입/린트/런타임)
- Review Lane
  - hosted badge guardrail과 리뷰 체크리스트 사전 점검

## 병렬 실행 규칙

1. 서로 의존하지 않는 태스크만 병렬 실행
2. 합류 지점(merge point)을 먼저 정의
3. 동일 파일 동시 수정 금지
4. 충돌 시 계획 문서 기준 우선순위 적용

## 페이즈/계획명 규칙

- 병렬 실행 결과는 항상 현재 페이즈 기준으로 체크포인트에 반영한다.
- 계획명은 의미 기반으로 작성하며 `PLAN A`, `PLAN B` 같은 임시 이름을 사용하지 않는다.

## 결과 통합 규칙

- 모든 lane 결과를 하나의 체크포인트로 합친다.
- 중복/충돌 항목은 "결정 필요"로 표기하고 기본값 제안.
- 다음 액션은 직렬 순서로 재정렬한다.

## 완료 조건

- lane별 산출물이 모두 체크포인트에 반영됨
- 빌드/리뷰 게이트 통과
- 후속 액션이 1~3개로 명확히 정리됨
