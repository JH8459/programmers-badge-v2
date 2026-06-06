---
name: critical-review
description: Perform the critical risk/regression lane of a review. Use when the user explicitly asks for a critical, skeptical, adversarial, risk-focused, regression-focused, source-of-truth, broken-reference, stale-docs, missing-validation, or unsafe-assumption review, or when invoked by $review-workflow as the critical lane. Do not use as the default general review entrypoint; use $review-workflow for generic review requests. Works without Conductor-specific tooling.
---

# Critical Review

## Overview

이 skill은 변경을 칭찬하거나 요약하기보다, merge 전에 막아야 할 버그와 운영 리스크를 먼저 찾는다.
Conductor 없이도 사용할 수 있으며, Conductor의 `DiffComment` 같은 리뷰 댓글 도구가 있으면 명시 요청 시에만 사용한다.
일반 리뷰 요청은 `$review-workflow`를 진입점으로 사용하고, 이 skill은 critical lane으로 사용한다.

## Required Context

리뷰 전에 아래를 확인한다.

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- staged change가 있으면 `git diff --cached --stat`와 `git diff --cached --name-only`
- branch 비교가 필요하면 사용자가 지정한 base 또는 repo 기준 base
- `AGENTS.md`, `.codex/README.md`, 관련 `.codex/rules/*`, 관련 `.codex/instructions/*`

Conductor 환경에서는 workspace branch와 target branch를 확인한다.
GitHub PR 또는 external diff만 리뷰하는 경우에는 제공된 diff와 metadata를 source로 삼고, 없는 정보는 추정하지 않는다.

## Review Workflow

1. 변경 범위를 분류한다.
   - code, test, docs, CI/deploy, config, generated artifact를 분리한다.
   - app boundary와 source-of-truth 문서 영향을 먼저 본다.
2. source-of-truth를 확인한다.
   - repo 규칙은 `.codex/rules/*`와 `.codex/instructions/*`를 우선한다.
   - 요약 문서, skill, README, AGENTS가 규칙을 중복하거나 반대로 가리키면 finding으로 잡는다.
3. diff를 위험 순서로 읽는다.
   - build/runtime failure
   - security, privacy, secret exposure
   - data loss, deploy failure, release failure
   - contract or boundary regression
   - broken references and stale docs
   - missing tests or missing validation
4. 검증 상태를 확인한다.
   - 사용자가 review-only를 요청했으면 파일을 수정하지 않는다.
   - 필요한 검증을 이미 실행했는지 보고, 실행하지 않았으면 residual risk로 남긴다.
5. findings-first로 보고한다.
   - 문제가 없으면 "blocking finding 없음"을 명확히 쓰고 남은 risk/test gap만 적는다.

## Severity

- `CRITICAL`: merge하면 build/runtime/deploy가 깨지거나, 보안/secret/data loss 문제가 생기거나, 명백한 source-of-truth 위반이 발생한다.
- `WARNING`: 실제 버그 가능성, 운영 실패 가능성, stale docs, missing validation, 유지보수 리스크가 있다.
- `SUGGESTION`: merge를 막지는 않지만 follow-up으로 정리하면 좋은 개선이다.

## Finding Format

각 finding은 아래 형식을 지킨다.

```text
SEVERITY [file](absolute-path:line): 짧은 제목
영향: 왜 문제인지.
근거: diff 또는 현재 파일에서 확인한 사실.
권장: 최소 수정 방향.
```

규칙:

- findings를 severity 높은 순서로 먼저 쓴다.
- 실제 파일과 line을 붙인다. line이 애매하면 가장 가까운 관련 line을 붙인다.
- 취향, 문체, 네이밍만으로 finding을 만들지 않는다.
- "아마", "보일 수 있음" 같은 추정은 추정이라고 명시한다.
- summary는 findings 뒤에 짧게 둔다.

## Commenting Tools

- Conductor `DiffComment` tool이 있고 사용자가 inline comments를 요청하면 changed line에 남긴다.
- GitHub comments/reviews는 사용자가 명시적으로 요청한 경우에만 작성한다.
- tool이 없으면 plain text review만 제공한다.
