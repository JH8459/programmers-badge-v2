---
name: workflow-orchestrator
description: PROGRAMMERS-BADGE-V2 표준 6페이즈 파이프라인을 오케스트레이션한다.
---

## 언제 사용하나

- "워크플로우로 진행해줘"
- "워크플로우"

## 기준 문서

- `.opencode/instructions/project-context.md`
- `.opencode/instructions/workflow.md`
- `.opencode/instructions/agent-workflow.md`
- `.opencode/instructions/review.md`

## 워크플로우

1. 페이즈1 컨텍스트 고정 (`PLAN.md` 또는 계획 메모)
2. 페이즈2 계획 수립 (`WORKFLOW.md`)
3. 페이즈3 체크포인트 저장 (`.opencode/checkpoint/{name}` 또는 todo 상태)
4. 페이즈4 구현 + relevant validation 실행
5. 페이즈5 코드 리뷰 (`code-reviewer`)
6. 페이즈6 테스트 루프 (실패 원인 분류 후 재검증)

## 계획명 규칙

- 계획명은 의미 기반으로 작성한다.
- `PLAN A`, `PLAN B`, `작업1` 같은 임시 이름은 사용하지 않는다.
- 권장 패턴: `대상 + 변경 + 목적`
  - 예: `extension sync payload 구조 정리 및 public badge 계약 명확화`

## 병렬 규칙

- 병렬 가능:
  - 영향 파일 탐색 + 계획 문서화
  - extension UX 검토 + API contract 검토
  - 리뷰 준비 + 빌드 로그 분류
- 직렬 고정:
  - 코드 수정 후 최종 빌드 판정
  - CRITICAL 수정 후 재리뷰

## 실행 산출물

- `PLAN.md`: 요구사항 매핑/검증 기준
- `WORKFLOW.md`: 병렬/직렬 의존성 및 페이즈 계획
- `CHECKPOINT_TEMPLATE.md`: 진행률/이슈/다음 액션
- `REVIEW.md`(선택): 리뷰 결과와 조치 계획

## 완료 조건

- relevant validation 통과
- 리뷰 CRITICAL 0건
- 체크포인트 최신화
- hosted badge MVP 방향 유지
