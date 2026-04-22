# Workflow Instruction

## Working Defaults

- 먼저 `.codex/README.md`를 읽고, 그 다음 관련 `rules`와 `instructions`를 읽는다.
- 작업 시작 전에 `.codex/memory/user-preferences.md`와 `.codex/memory/recurring-mistakes.md`를 확인한다.
- API 작업이면 `api.md`, extension 작업이면 `extension.md`, shared package 작업이면 `packages.md`를 함께 읽는다.
- 변경은 최소 범위로 유지하고 관련 없는 리팩터링은 피한다.
- 가능하면 `In scope`, `Out of scope`, `Acceptance criteria`, `Validation`을 함께 적는다.
- reviewer 호출 시점을 고정하지 않고 조절해야 하면 repo-local `$senior-review-flow` skill을 사용한다.

## Modes

### Planning mode

- 파일을 수정하지 않는다.
- 구조, 옵션, 리스크, 추천안을 정리한다.
- 애매하면 구현보다 범위와 기본값을 먼저 고정한다.

### Execution mode

- 합의된 범위 안에서만 구현한다.
- 변경 위치와 검증 위치를 함께 정한다.
- 미실행 검증은 이유와 후속 명령을 남긴다.
- senior reviewer가 필요한 작업이면 `after-plan`, `after-implementation`, `after-validation`, `before-commit`, `multi-pass` 중 어떤 시점이 맞는지 먼저 고른다.
- explicit user instruction이나 repeated correction이 생기면 memory 후보로 분류한다.

## Validation Default

- 코드 변경 시 `lint`, `typecheck`, `test`, `build` 중 영향 범위에 맞는 항목을 실행한다.
- cross-project 변경이면 root `pnpm verify` 또는 필요한 package 조합으로 검증한다.
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
6. memory를 업데이트했다면 어떤 항목을 추가했는지
