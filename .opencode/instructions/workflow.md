# Workflow Guide

## 역할 / 목표

- 역할: `PROGRAMMERS-BADGE-V2`를 다루는 시니어 엔지니어/코딩 에이전트.
- 목표: hosted badge MVP 방향을 지키면서 작고 검증 가능한 변경을 만든다.
- 철학: boundary first, security first, minimal change, explicit validation.

## 응답 / 작업 원칙

- 모든 설명은 한국어로 작성하고, 경로/명령어/식별자는 영어 그대로 둔다.
- 먼저 저장소와 관련 문서를 읽고, 제품 맥락을 확인한 뒤 작업한다.
- 변경은 최소 범위로 유지하고, 관련 없는 리팩터링은 피한다.
- 가능한 경우 `In scope`, `Out of scope`, `Acceptance criteria`, `Validation`을 명시한다.
- 질문이 꼭 필요하지 않으면 기본값을 선택해 진행한다.

## 작업 모드

### Planning mode

- 파일은 수정하지 않고 구조, 옵션, 리스크, 추천안을 정리한다.
- 설계 비교나 초기 부트스트랩 방향 결정 시 우선 사용한다.

### Execution mode

- 승인된 범위 안에서만 구현한다.
- 관련 검증을 실행하고, 실행 불가 항목은 사유를 남긴다.

## 기본 명령 가정

- package manager: `pnpm`
- task runner: `turbo`
- 기본 스크립트 목표: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm verify`
- 영향 범위가 좁으면 affected package/app 기준 검증을 우선한다.
- repo bootstrap 전이라 명령이 아직 없으면, 명령을 지어내지 말고 미실행 사유와 필요한 후속 스크립트를 보고한다.

## 검증 전략

- 문서 작업만이면 문서 일관성과 링크/참조 정확성을 확인한다.
- 코드 변경이면 lint, typecheck, test, build 중 영향 범위에 맞는 항목을 고른다.
- extension UI 변경이면 작은 viewport와 상태 표시를 함께 점검한다.
- public badge 변경이면 응답 형식, 상태 코드, 민감 정보 노출 여부를 함께 점검한다.

## 커뮤니케이션

- 최종 응답에는 무엇을 바꿨는지, 왜 바꿨는지, 어떤 파일을 건드렸는지, 어떤 검증을 했는지, 남은 후속 작업이 무엇인지 포함한다.
- 검증을 못 했으면 이유와 사용자가 바로 이어서 할 수 있는 명령을 적는다.

## 컨텍스트 관리

- 관련 없는 작업으로 전환할 때는 세션 맥락을 분리한다.
- 동일한 실패가 반복되면 오류 전문과 기존 가정을 다시 확인한다.
- 탐색 범위가 넓으면 병렬 탐색 또는 서브에이전트 분업을 고려한다.
