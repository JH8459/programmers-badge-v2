---
name: commit
description: Use when the user wants help splitting, staging, committing, and optionally pushing changes in this repository. Use for large mixed diffs, boundary-aware commit grouping, commit message drafting, staged validation, and safe push planning. Do not use for unrelated code changes by itself.
---

# Commit

이 skill은 dirty worktree를 reviewable commit set으로 정리하는 절차를 고정한다.

## Required context

작업 전에 아래 문서를 우선 기준으로 본다.

- `.codex/rules/architecture.md`
- `.codex/instructions/workflow.md`
- `.codex/instructions/git.md`
- 필요하면 `.agents/skills/senior-review-flow/SKILL.md`

그리고 현재 상태를 아래 순서로 확인한다.

- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- 이미 staged change가 있으면 `git diff --cached --name-only`

## When To Use

- 변경이 `api`, `extension`, `shared-types`, `docs`, `ci`를 함께 섞고 있을 때
- commit을 몇 개로 나눌지 애매할 때
- commit message를 repo 규칙에 맞춰 정리할 때
- push 전에 어떤 validation과 reviewer checkpoint가 필요한지 정할 때

## Split Heuristics

- 서로 다른 목적의 변경은 분리한다.
- boundary가 다르면 가능한 한 분리한다.
- 동일 기능의 코드, 테스트, 최소 문서 보강은 함께 묶는다.
- `shared-types`나 `badge-core` 변경은 consumer app 반영과 분리 가능한지 먼저 본다.
- deploy or workflow 변경은 product code commit과 분리하는 편을 기본값으로 둔다.
- docs-only 정리는 code commit에 억지로 붙이지 않는다.

## Workflow

1. diff를 목적과 boundary 기준으로 분류한다.
   - 예: `shared-types`, `api`, `extension`, `docs`, `ci`, `deploy`
2. commit plan을 먼저 제안한다.
   - 각 commit의 목적, 포함 파일, 검증 범위를 짧게 적는다.
3. 한 commit 단위로 stage한다.
   - 관련 없는 변경은 같이 stage하지 않는다.
   - 사용자가 만든 미완성 로컬 변경을 멋대로 끌어오지 않는다.
4. commit 직전 validation 범위를 정한다.
   - 작은 docs-only 변경이면 경로 정합성 확인으로 충분할 수 있다.
   - app code나 shared contract가 바뀌면 최소 해당 package validation을 본다.
   - cross-project 변경이면 가능하면 `pnpm verify`를 본다.
5. commit message를 작성한다.
   - 기본 형식은 `type: 한국어 설명` 또는 `type(scope): 한국어 설명`이다.
   - scope는 `api`, `extension`, `shared-types`, `badge-core`, `docs`처럼 경계를 드러내는 값을 우선한다.
   - workflow or deploy 변경은 repo 히스토리와 맞으면 `ci:`를 사용할 수 있다.
6. 필요하면 reviewer checkpoint를 끼운다.
   - 코드 영향이 크면 `$senior-review-flow`를 `before-commit` 또는 `multi-pass`로 붙이는 편이 안전하다.
7. push는 마지막에 처리한다.
   - 현재 branch를 확인한다.
   - push할 commit 집합을 사용자에게 명확히 설명한다.
   - `--force`, amend, rebase push는 명시적 요청 없이는 하지 않는다.

## Commit Planning Rules

- contract change가 app 둘 다를 강하게 묶으면 atomic cross-project commit도 허용한다.
- contract change와 각 consumer 정리가 시간차를 가져도 되면 `shared-types -> api -> extension` 순으로 나눈다.
- code와 docs를 무조건 분리하지는 않는다.
- docs가 그 commit을 이해하는 데 필수면 같이 묶고, release note 성격이면 분리한다.

## Never Do

- secret, env file, session data를 commit하지 않는다.
- 사용자가 요청하지 않은 unrelated change를 같이 묶지 않는다.
- 생성 산출물을 release 의도가 없는데 commit하지 않는다.
- force push나 history rewrite를 기본값처럼 다루지 않는다.

## Reporting

최종 보고에는 아래를 포함한다.

1. 최종 commit plan 또는 실제 commit 목록
2. 각 commit의 목적
3. 실행한 validation
4. push 여부와 대상 branch

## Prompt examples

```text
Use $commit to split the current diff into reviewable commits.
Keep code, tests, and minimal docs together, and separate deploy workflow changes.
```

```text
Use $commit to prepare commits for a shared-types + api + extension change.
Propose the split first, run the right validation, then commit and push only if requested.
```
