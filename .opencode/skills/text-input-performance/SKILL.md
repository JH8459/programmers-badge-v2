---
name: text-input-performance
description: extension/options/public UI에서 입력 지연과 과다 렌더링을 예방하기 위한 체크리스트.
---

## 언제 사용하나

- extension popup, options page, public settings UI에 `input`, `textarea`, 검색창을 추가할 때
- 입력 중 버벅임, 커서 끊김, 타이핑 지연이 반복될 때
- badge preview, copy snippet, 설정 폼이 같은 화면에 섞일 때

## 핵심 원칙

1. 입력 상태는 가능한 한 로컬에 둔다.
   - 여러 카드나 폼이 있는 경우 부모의 거대한 상태 객체보다 필드 또는 섹션 단위 상태를 우선한다.

2. 대형 부모 컴포넌트에 입력 상태를 두지 않는다.
   - 글자 1개 입력마다 popup 전체, badge preview 전체, 상태 배너 전체가 다시 그려지기 쉽다.
3. 입력 가능한 구역은 별도 컴포넌트로 분리하고, 사용 중인 프레임워크가 React라면 `memo` 등을 먼저 검토한다.
4. 네트워크 sync 또는 clipboard payload 생성은 저장/복사 시점에 가깝게 둔다.
5. badge preview 계산이 비싸다면 debounce, memoization, 지연 계산을 검토한다.

## 위험 신호

- `onChange`에서 상위 배열/맵 전체를 매번 복사한다.
- 하나의 state 변경이 popup 전체 또는 preview 전체 렌더를 동시에 유발한다.
- 입력할 때마다 SVG preview나 sync payload를 매번 새로 계산한다.
- 입력 변경마다 네트워크 요청을 보내거나 background message를 남발한다.

## 권장 패턴

- 설정 폼
  - 하위: `draft`, `isDirty`, `error`
  - 상위: `onSave(draft)`, `onCopy(result)`
- preview
  - 원본 입력과 렌더링 결과를 분리한다.
  - 입력 중에는 필요한 최소 범위만 갱신하고, 무거운 계산은 지연한다.
- sync
  - 입력 draft와 실제 sync payload 생성 시점을 분리한다.

## 체크리스트

- 입력 state가 로컬 컴포넌트에 있는가?
- 부모 state 변경이 popup 전체 재렌더를 유발하지 않는가?
- 컴포넌트 분리나 memoization으로 영향 범위를 줄였는가?
- 저장 중/실패 상태는 최소 범위로만 갱신되는가?
- 검색/필터/preview 입력이 불필요한 전체 계산을 만들지 않는가?

## 금지 패턴

- 대형 화면 또는 popup 루트에서 모든 draft를 한꺼번에 관리
- 입력 중 네트워크 sync와 렌더링 계산을 동시에 강제
- 입력 1회마다 무거운 preview/SVG/snippet 계산과 전체 UI 재실행
