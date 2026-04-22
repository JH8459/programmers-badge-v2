---
name: senior-review-flow
description: Use when the user wants a coding task to include this repository's custom senior reviewer agents at a configurable checkpoint. Supports review_timing values after-plan, after-implementation, after-validation, before-commit, multi-pass, and manual, plus review_scope values auto, api, extension, and both. Do not use for pure review-only requests or doc-only tasks unless the user explicitly asks for senior reviewer agents.
---

# Senior Review Flow

이 skill은 reviewer 자체를 대체하지 않는다.
실제 리뷰는 아래 custom agent를 호출해서 수행한다.

- `api_senior_code_review`
- `extension_senior_code_review`

## Required context

리뷰를 돌리기 전에 아래 문서를 우선 기준으로 본다.

- `.codex/rules/common.md`
- `.codex/rules/architecture.md`
- `.codex/instructions/workflow.md`
- `.codex/instructions/review.md`
- `.codex/agents/README.md`

## Inputs

프롬프트에 가능하면 아래 두 값을 함께 적는다.

- `review_timing`
  - `after-plan`
  - `after-implementation`
  - `after-validation`
  - `before-commit`
  - `multi-pass`
  - `manual`
- `review_scope`
  - `auto`
  - `api`
  - `extension`
  - `both`

기본값:

- `review_timing`: `after-implementation`
- `review_scope`: `auto`

## Auto scope rules

- 변경이 `apps/api/**` 중심이면 `api_senior_code_review`를 사용한다.
- 변경이 `apps/extension/**` 중심이면 `extension_senior_code_review`를 사용한다.
- 변경이 `apps/api/**`와 `apps/extension/**`를 함께 건드리면 둘 다 사용한다.
- 변경이 `packages/shared-types/**`, `packages/badge-core/**`만 걸쳐도 영향 범위를 보고 reviewer를 고른다.
- 영향 범위가 애매하지만 app boundary나 contract가 바뀌면 보수적으로 둘 다 사용한다.
- `.codex`, `README`, 문서만 바뀐 경우에는 reviewer를 자동 호출하지 않는다. 사용자가 명시하면 예외로 한다.

## Checkpoint semantics

### `after-plan`

- 먼저 짧은 계획을 만든다.
- 파일 수정 전에 reviewer를 호출해 계획 리스크와 빠진 검증을 본다.
- reviewer 결과를 반영해 계획을 다듬고 구현에 들어간다.

### `after-implementation`

- 구현이 끝난 직후 reviewer를 호출한다.
- 아직 validation을 안 돌렸다면 reviewer 결과를 반영한 뒤 validation로 간다.

### `after-validation`

- 구현 후 관련 validation을 먼저 실행한다.
- reviewer는 diff와 validation 결과를 함께 보고 위험을 판단한다.

### `before-commit`

- 구현과 validation을 끝낸 뒤 commit 직전에 reviewer를 호출한다.
- reviewer 결과를 반영한 뒤에만 commit 단계로 간다.

### `multi-pass`

- `after-plan` 한 번, `before-commit` 한 번, 총 두 번 reviewer를 호출한다.
- 첫 패스는 방향과 리스크를 줄이고, 두 번째 패스는 최종 diff를 검토한다.

### `manual`

- skill이 reviewer를 자동 호출하지 않는다.
- 대신 현재 작업에 맞는 reviewer와 추천 시점을 정리해서 사용자에게 보여준다.
- 사용자가 명시적으로 reviewer 실행을 요청하면 그때 호출한다.

## Workflow

1. 작업이 code task인지 확인한다. pure review-only 요청이면 이 skill 대신 바로 reviewer를 사용한다.
2. `review_timing`과 `review_scope`를 프롬프트에서 읽고, 없으면 기본값을 사용한다.
3. `review_scope=auto`면 변경 범위 또는 계획 기준으로 reviewer를 고른다.
4. 지정된 checkpoint에 도달하면 필요한 reviewer agent를 호출한다.
5. reviewer가 둘 이상이면 병렬로 호출하고, 결과를 agent별로 분리해 요약한다.
6. `CRITICAL`과 `WARNING` finding은 해결하거나, 해결하지 못하면 이유와 남은 리스크를 명시한다.
7. `before-commit` 또는 `multi-pass`의 마지막 단계에서는 reviewer 결과 반영 후에만 commit으로 진행한다.

## Reviewer invocation rules

- API reviewer를 호출할 때는 validation, normalization, public exposure, persistence, missing tests를 보라고 지정한다.
- Extension reviewer를 호출할 때는 permissions, manifest/runtime messaging, auto-sync safety, popup state flow, missing tests를 보라고 지정한다.
- 둘 다 호출하면 결과를 섞지 말고 reviewer 이름별로 정리한다.
- reviewer는 read-only이므로 파일 수정은 메인 작업 스레드에서만 수행한다.

## Reporting

- 최종 보고에는 reviewer가 언제 실행됐는지 적는다.
- reviewer가 없었다면 왜 스킵했는지 적는다.
- unresolved finding이 남으면 commit 전 상태인지, 이후 follow-up이 필요한지 적는다.

## Prompt examples

```text
$senior-review-flow
review_timing: after-implementation
review_scope: auto

apps/api의 sync payload validation을 수정해줘.
구현 후 적절한 senior reviewer를 호출해서 findings를 반영해줘.
```

```text
$senior-review-flow
review_timing: multi-pass
review_scope: both

shared-types와 api, extension을 함께 바꾸는 작업이다.
계획 단계와 commit 직전에 senior reviewer를 각각 호출해줘.
```

```text
$senior-review-flow
review_timing: manual
review_scope: extension

popup 상태 흐름을 바꾸려 한다.
어느 시점에 extension reviewer를 부르면 좋은지 먼저 제안해줘.
```
