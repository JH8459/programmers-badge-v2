# Memory Instruction

## Role

memory는 대화형 작업 중에 새로 생긴 사용자 선호와 반복 실수를 보존하는 계층이다.
architecture 규칙을 대체하지 않고, 앞으로 같은 교정이 반복되지 않게 만드는 것이 목적이다.

## When To Read

- `.codex/README.md`를 읽은 뒤, 작업을 시작하기 전에 `memory/*`를 확인한다.
- 구조나 workflow를 바꾸는 작업이면 `memory/*`를 더 우선적으로 본다.

## Candidate Sources

- 사용자의 명시적 추가 지시
- 같은 주제에 대한 두 번째 교정
- 작업 중 같은 실수의 재발
- repo 운영 흐름을 바꾼 합의

## Classification

### `user-preferences.md`

아래에 해당하면 여기에 추가한다.

- 응답 스타일 선호
- 문서 구조 선호
- workflow 선호
- reviewer/skill/hook 같은 운영 방식 선호

### `recurring-mistakes.md`

아래에 해당하면 여기에 추가한다.

- 이미 발생한 실수
- 다시 발생하기 쉬운 함정
- 특정 파일/경로/런타임 규칙을 혼동한 사례

## Update Flow

1. 작업 중 memory 후보를 발견하면 바로 메모한다.
2. explicit instruction이면 같은 작업에서 바로 memory를 업데이트한다.
3. repeated correction이면 두 번째 발생부터 memory로 승격한다.
4. 항목이 `rules/*`에 들어가야 할 정도로 안정적이면 rules 반영 여부를 먼저 검토한다.
5. memory를 업데이트한 뒤 최종 보고에 반영 사실을 짧게 남긴다.

## Entry Rules

- 한 항목은 짧고 실행 가능해야 한다.
- preference는 "무엇을 선호하는가"를 직접 적는다.
- mistake는 `Mistake`, `Prevention`, `Checkpoint`를 함께 적는다.
- 추상적 구호보다 다음 작업에서 바로 체크할 수 있는 문장으로 적는다.

## Do Not Store

- secrets
- one-off debugging logs
- volatile external facts
- 이미 다른 source-of-truth에 고정된 내용을 중복 복사한 항목
