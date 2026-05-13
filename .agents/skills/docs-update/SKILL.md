---
name: docs-update
description: Use when code, workflows, contracts, or repository structure changed and the documentation may now be stale. Compare the current diff against source-of-truth docs such as README, .codex rules or instructions, deploy docs, AGENTS path indexes, and skill docs, then update only the docs affected by the diff. Do not use for broad documentation rewrites disconnected from real code changes.
---

# Docs Update

이 skill은 현재 diff를 기준으로 stale 문서를 찾아 source-of-truth부터 갱신한다.

## Required context

작업 전에 아래 문서를 우선 기준으로 본다.

- `.codex/README.md`
- `.codex/rules/common.md`
- `.codex/rules/architecture.md`
- `.codex/instructions/workflow.md`
- `.codex/instructions/memory.md`
- 필요하면 작업 범위별 `api.md`, `extension.md`, `packages.md`

그리고 현재 diff를 아래 기준으로 확인한다.

- `git status --short`
- `git diff --name-only`
- 이미 staged change가 있으면 `git diff --cached --name-only`
- branch 비교가 필요하면 현재 base와의 diff 범위를 명시해서 본다

## Candidate doc surfaces

- `README.md`
- `AGENTS.md`
- `.codex/rules/*`
- `.codex/instructions/*`
- `.codex/memory/*`
- `deploy/README.md`
- `.agents/skills/*/SKILL.md`
- `.agents/skills/*/agents/openai.yaml`

## Diff Mapping

- `apps/api/**`, `Dockerfile`, `docker-compose*.yml`, `deploy/**`, `.github/workflows/deploy-api.yml`
  - 우선 후보: `.codex/rules/api.md`, `deploy/README.md`, `README.md`
- `apps/web/**`, `apps/extension/store-assets/**`, `docker-compose*.yml`, `deploy/**`, `.github/workflows/deploy-web.yml`
  - 우선 후보: `.codex/rules/web.md`, `deploy/README.md`, `README.md`
- `apps/extension/**`, `apps/extension/manifest.json`, `.github/workflows/release-extension.yml`
  - 우선 후보: `.codex/rules/extension.md`, `README.md`
- `packages/shared-types/**`, `packages/badge-core/**`
  - 우선 후보: `.codex/rules/packages.md`
  - runtime behavior까지 바뀌면 관련 app rule도 같이 본다
- `.codex/**`
  - source-of-truth 내부 정합성을 먼저 맞춘다
- `.agents/skills/**`
  - skill 문서와 호출 metadata가 현재 동작과 맞는지 본다

## Workflow

1. diff를 읽고 behavior change와 documentation change를 구분한다.
2. 어떤 문서가 source-of-truth인지 먼저 결정한다.
   - 규칙과 절차는 `.codex/*`
   - 운영 문서는 `deploy/README.md`
   - 개요 문서는 `README.md`
   - 경로 안내는 `AGENTS.md`
3. source-of-truth를 먼저 갱신한다.
4. 그 다음 요약 문서와 경로 문서를 맞춘다.
5. 문서가 실제 diff보다 앞서가지 않게 유지한다.
   - 아직 구현되지 않은 계획을 현재 동작처럼 쓰지 않는다.
6. memory 업데이트는 엄격하게 다룬다.
   - 사용자의 explicit instruction이 있거나 repeated correction이 있을 때만 `.codex/memory/*`를 갱신한다.
   - one-off debugging 내용은 넣지 않는다.
7. skill이나 reviewer 문서를 바꿨으면 예시 prompt와 호출 이름까지 함께 맞춘다.

## Guardrails

- `AGENTS.md`는 경로 안내만 유지하고 세부 정책은 `.codex`에 둔다.
- 같은 규칙 텍스트를 여러 문서에 중복 복사하지 않는다.
- 실제 코드와 다른 aspirational 문서를 쓰지 않는다.
- memory를 일반 문서 changelog처럼 쓰지 않는다.
- diff와 무관한 대규모 문체 정리는 기본값으로 하지 않는다.

## Reporting

최종 보고에는 아래를 포함한다.

1. 어떤 diff를 기준으로 문서를 판단했는지
2. 어떤 문서를 왜 갱신했는지
3. source-of-truth와 summary doc 중 무엇을 바꿨는지
4. 아직 문서화하지 않은 follow-up이 있는지

## Prompt examples

```text
Use $docs-update to compare the current diff against the repo docs.
Update the source-of-truth files first, then align README and AGENTS only where the diff requires it.
```

```text
Use $docs-update after this api and deploy workflow change.
Check whether .codex rules, deploy/README.md, and any skill docs are now stale.
```
