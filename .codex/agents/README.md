# Agent Catalog

이 디렉토리는 `PROGRAMMERS-BADGE-V2`에서 재사용할 custom subagent 정의를 둔다.
현재는 구현 후 code review를 분리하기 위한 senior reviewer만 둔다.

## Available Agents

- `api_senior_code_review`: `apps/api`와 API 관점의 shared contract 변경을 검토한다.
- `extension_senior_code_review`: `apps/extension`과 extension 관점의 shared contract 변경을 검토한다.

## When To Use

- diff가 `apps/api`를 건드리면 `api_senior_code_review`를 먼저 사용한다.
- diff가 `apps/extension`을 건드리면 `extension_senior_code_review`를 먼저 사용한다.
- diff가 `packages/shared-types`나 `packages/badge-core`를 함께 건드리면 영향받는 app 관점 reviewer를 같이 호출한다.
- API와 extension을 동시에 바꾸면 두 reviewer를 모두 돌리고 findings를 따로 정리한다.

## Calling Pattern

- 구현 후 reviewer를 호출한다.
- reviewer는 read-only로 동작하고 파일을 수정하지 않는다.
- reviewer 결과를 반영한 뒤 필요하면 같은 reviewer를 한 번 더 호출한다.
- reviewer 호출 시점을 조절하고 싶으면 `$senior-review-flow` skill을 사용한다.

## Skill Integration

- repo-local skill 경로: `.agents/skills/senior-review-flow`
- 이 skill은 `review_timing`과 `review_scope`를 받아 적절한 시점에 reviewer를 호출한다.
- 기본값은 `after-implementation + auto`다.
- `multi-pass`를 쓰면 계획 직후와 commit 직전에 두 번 reviewer를 호출한다.

## Prompt Examples

```text
api_senior_code_review agent를 호출해서 현재 diff를 리뷰해줘.
validation, normalization, public data exposure, persistence safety, missing tests를 중심으로 봐줘.
```

```text
extension_senior_code_review agent를 호출해서 현재 diff를 리뷰해줘.
permissions, manifest/runtime messaging, auto-sync safety, popup state flow, missing tests를 중심으로 봐줘.
```
