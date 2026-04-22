# Memory Guide

이 디렉토리는 `.codex/rules/*`를 대체하지 않는다.
여기에는 대화 중 누적된 사용자 선호, 작업 방식 선호, 반복되는 실수와 예방 규칙만 둔다.

## Purpose

- 반복해서 다시 설명하지 않아도 되는 사용자 선호를 저장한다.
- 같은 실수나 같은 교정이 반복될 때 예방 규칙을 남긴다.
- 구조적 규칙은 `rules`에, 작업 절차는 `instructions`에, 누적 선호/실수는 `memory`에 둔다.

## File Map

- `user-preferences.md`: 사용자가 반복해서 요구한 선호, 문서 구조 선호, 작업 방식 선호
- `recurring-mistakes.md`: 이미 발생했거나 다시 발생하기 쉬운 실수와 예방 규칙

## Read Order

1. `user-preferences.md`
2. `recurring-mistakes.md`

## Promotion Rules

아래 중 하나에 해당하면 memory 후보로 본다.

- 사용자가 명시적으로 "기억해", "memory에 넣어", "앞으로 이렇게 해"라고 말한 경우
- 같은 선호나 같은 교정이 두 번 이상 반복된 경우
- 같은 실수로 재작업이 발생한 경우
- repo 구조나 workflow를 다시 고치게 만든 운영 규칙이 생긴 경우

아래는 memory로 올리지 않는다.

- 단발성 task scope
- 일시적인 branch 상태
- 외부 서비스의 휘발성 정보
- 비밀값, 토큰, 자격 증명
- 이미 `rules/*`에 안정적으로 정리된 architecture 규칙의 단순 복제

## Update Policy

- explicit user instruction은 같은 작업 안에서 바로 반영할 수 있다.
- repeated correction은 두 번째 발생 시점부터 memory로 승격한다.
- memory를 업데이트하면 최종 보고에 어떤 항목을 추가했는지 함께 적는다.
- memory와 `rules/*`가 충돌하면 먼저 `rules/*`에 반영할지 검토하고, memory에는 보완 정보만 남긴다.
