---
name: review-workflow
description: Orchestrate repository reviews by combining a senior design/code-quality lane with a critical risk/regression lane. Use when the user asks for a review, PR review, code review, diff review, "리뷰 해줘", "PR 리뷰", or wants a combined review report. Default target mode is subagent-parallel: run senior and critical review lanes independently and synthesize one findings-first report. If active runtime or tool policy does not permit subagent delegation, use the single-agent-two-lane fallback and report that fallback.
---

# Review Workflow

## Overview

이 skill은 일반 리뷰 요청의 진입점이다.
리뷰를 senior lane과 critical lane으로 나누고, 기본값으로 두 lane을 독립적으로 수행한 뒤 하나의 findings-first 보고서로 합친다.
기본 목표 실행 모드는 `subagent-parallel`이다.

## Review Lanes

### Senior Lane

설계와 코드 품질 관점이다.

- architecture boundary
- 책임 분리와 app/package ownership
- maintainability와 확장성
- contract/schema 정합성
- test strategy와 validation depth
- local pattern과 style 일관성

API 또는 extension code가 포함되고 active tool policy가 subagent/reviewer 실행을 허용하면 기존 custom reviewer를 사용할 수 있다.

- API 중심: `api_senior_code_review`
- extension 중심: `extension_senior_code_review`
- 양쪽 또는 shared contract 영향: 필요한 reviewer를 모두 사용

### Critical Lane

merge 전에 막아야 할 실패를 찾는 관점이다.
자세한 절차는 `.agents/skills/critical-review/SKILL.md`를 따른다.

- build/runtime/deploy failure
- security, privacy, secret exposure
- data loss, release failure
- source-of-truth drift
- broken reference and stale docs
- missing validation
- unsafe assumption

## Execution Rules

- 사용자가 단순히 "리뷰", "PR 리뷰", "코드 리뷰"를 요청해도 senior lane과 critical lane을 모두 수행한다.
- 두 lane은 서로의 결론을 먼저 보지 않고 독립 pass로 작성한 뒤 synthesis 단계에서만 합친다.
- 기본 목표 실행 모드는 `subagent-parallel`이다.
- active runtime과 tool policy가 현재 요청에서 subagent delegation을 허용하면 senior lane과 critical lane을 별도 subagent로 병렬 실행한다.
- subagent delegation이 허용되지 않으면 `single-agent-two-lane` fallback으로 수행하고, 최종 보고에 fallback 사실을 남긴다.
- review-only 요청이면 파일을 수정하지 않는다.
- Conductor `DiffComment`나 GitHub review comment는 사용자가 명시적으로 요청한 경우에만 남긴다.

## Execution Modes

### `subagent-parallel`

active runtime과 tool policy가 현재 요청에서 agent delegation을 허용할 때 사용한다.

- Senior Lane과 Critical Lane을 별도 subagent로 동시에 실행한다.
- 두 subagent는 read-only로 둔다.
- synthesis 전에는 한 lane의 결론을 다른 lane에 주입하지 않는다.
- 중복 finding은 하나의 findings-first 보고서로 합친다.

### `single-agent-two-lane`

subagent delegation이 현재 요청에서 가능하지 않을 때 사용하는 fallback이다.

- 현재 agent 안에서 Senior Lane과 Critical Lane을 별도 internal pass로 수행한다.
- `subagent-parallel`과 같은 output format을 유지한다.
- `Validation Gaps` 또는 `Short Summary`에 subagent 병렬이 아니라 fallback으로 수행했음을 남긴다.

## Workflow

1. diff와 staged state를 확인한다.
   - `git status --short`
   - `git diff --stat`
   - `git diff --name-only`
   - staged change가 있으면 cached diff도 확인한다.
2. 관련 rule을 읽는다.
   - 항상 `AGENTS.md`, `.codex/README.md`, `.codex/instructions/review.md`
   - 변경 범위에 맞는 `.codex/rules/*`
   - deploy/release 영향이 있으면 `.codex/rules/deployment.md`
3. senior lane 결과를 독립적으로 작성한다.
4. critical lane 결과를 독립적으로 작성한다.
5. 중복 finding을 병합한다.
   - 같은 root cause면 더 높은 severity와 더 정확한 file/line을 유지한다.
   - senior/critical 의견이 충돌하면 `Open Question`으로 분리한다.
6. 최종 보고를 작성한다.

## Output Format

보고는 아래 순서를 따른다.

1. Findings
2. Open Questions
3. Validation Gaps
4. Short Summary

Finding 형식:

```text
SEVERITY [file](absolute-path:line): 제목
영향: 왜 문제인지.
근거: diff 또는 현재 파일에서 확인한 사실.
권장: 최소 수정 방향.
Lane: Senior 또는 Critical
```

findings가 없으면 `blocking finding 없음`을 먼저 쓴다.

## Parallel Review Prompt Shape

subagent delegation이 허용되는 환경에서는 기본 리뷰도 아래처럼 분리한다.

Senior lane:

```text
현재 diff를 senior design/code-quality reviewer 관점으로 read-only 리뷰해줘.
architecture boundary, ownership, maintainability, contract/schema, test strategy를 우선으로 보고 findings-first로 정리해줘.
```

Critical lane:

```text
Read .agents/skills/critical-review/SKILL.md and use it to review the current diff read-only.
Focus on regressions, broken references, source-of-truth drift, deploy/release failure, missing validation, and unsafe assumptions.
```
