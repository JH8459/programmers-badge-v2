# Workflow Instruction

## Working Defaults

- 모든 설명은 한국어로 작성하고, 경로/명령어/식별자는 영어 그대로 둔다.
- 먼저 `rules`를 읽고, 그 다음 관련 `instructions`를 읽는다.
- 변경은 최소 범위로 유지하고 관련 없는 리팩터링은 피한다.
- 가능하면 `In scope`, `Out of scope`, `Acceptance criteria`, `Validation`을 함께 적는다.

## Modes

### Planning mode

- 파일을 수정하지 않는다.
- 구조, 옵션, 리스크, 추천안을 정리한다.
- 애매하면 구현보다 범위와 기본값을 먼저 고정한다.

### Execution mode

- 합의된 범위 안에서만 구현한다.
- 변경 위치와 검증 위치를 함께 정한다.
- 미실행 검증은 이유와 후속 명령을 남긴다.

## Validation Default

- 코드 변경 시 `lint`, `typecheck`, `test`, `build` 중 영향 범위에 맞는 항목을 실행한다.
- 문서 변경만이면 링크, 참조 경로, source-of-truth 정합성을 확인한다.
- public badge 변경이면 상태 코드, 응답 형식, 민감 정보 노출 여부를 함께 확인한다.
- extension UI 변경이면 작은 viewport와 핵심 액션 노출 여부를 함께 본다.

## Reporting Default

최종 보고에는 아래를 포함한다.

1. 무엇을 바꿨는지
2. 왜 바꿨는지
3. 어떤 파일을 건드렸는지
4. 어떤 검증을 했는지
5. 남은 제한사항이나 후속 작업

## Tooling Default

- package manager: `pnpm`
- task runner: `turbo`
- 기본 목표 스크립트: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm verify`
- repo에 없는 명령은 지어내지 않는다.
