---
name: web-publish
description: Use when creating, refactoring, or publishing public web UI/pages for this repository, especially apps/web landing, guide, contact, privacy/legal pages, Vite React routing, domain split, static deployment, and Chrome Web Store-facing copy. Do not use for API-only or extension-only changes unless public web routes or domains are affected.
---

# Web Publish

이 skill은 `apps/web` public UI와 publishing surface를 추가하거나 수정할 때 사용한다.

## Required Context

작업 전에 아래 문서를 우선 확인한다.

- `.codex/rules/common.md`
- `.codex/rules/architecture.md`
- `.codex/rules/web.md`
- `.codex/rules/web.md`가 안내하는 작업 범위별 하위 rule
- domain/API 영향이 있으면 `.codex/rules/api.md`, `.codex/rules/extension.md`와 각 entrypoint가 안내하는 하위 rule
- 관련 작업 절차는 `.codex/instructions/workflow.md`
- web deploy 영향이 있으면 `.github/workflows/deploy-web.yml`, `docker-compose.yml`, `deploy/README.md`

필요한 경우만 reference를 읽는다.

- React/Vite scaffold와 routing 선택: `references/react-vite.md`
- domain split, Route 53, reverse proxy, static deploy: `references/domain-deploy.md`
- UI quality guardrail과 anti-AI pattern checklist: `references/ui-quality.md`

## Workflow

1. 변경 목적을 `landing`, `guide`, `contact`, `privacy/legal`, `domain/deploy`, `shared UI` 중 하나 이상으로 분류한다.
2. `.codex/rules/web.md`의 Read By Scope 기준에 따라 필요한 하위 rule을 읽는다.
3. route ownership을 먼저 정한다.
   - public UI route는 `apps/web`
   - API와 `/badge/*.svg`는 `apps/api`
   - extension popup/background UX는 `apps/extension`
4. API origin 또는 badge URL이 바뀌면 API, extension, deploy docs 영향 범위를 함께 점검한다.
5. UI 작업이면 `references/ui-quality.md`를 보조 자료로 확인한다.
6. web Docker/deploy 변경이면 web image build, DockerHub tag, deploy path filter, web-only service restart 기준을 확인한다.
7. docs-update가 필요하면 `.codex/rules/*`, `README.md`, `AGENTS.md`, deploy docs 중 stale surface만 갱신한다.

## Guardrails

- 이 skill에는 세부 web 정책을 중복 정의하지 않는다.
- web 세부 기준은 `.codex/rules/web.md`와 작업 범위별 하위 rule을 source-of-truth로 따른다.
- rule과 skill이 충돌하면 rule을 우선하고, stale한 skill 문구를 갱신한다.
- `references/*`는 구현 보조 자료이며 `.codex/rules/*`를 대체하지 않는다.

## Validation

- web code 변경 시:
  - `pnpm --filter @programmers-badge/web lint`
  - `pnpm --filter @programmers-badge/web typecheck`
  - `pnpm --filter @programmers-badge/web build`
- domain/API 영향이 있으면 관련 API/extension package 검증도 추가한다.
- docs-only 변경이면 경로, route, reference URL 정합성을 확인한다.

## Reporting

최종 보고에는 아래를 포함한다.

1. 추가/수정한 route 또는 publishing surface
2. domain/API 영향 여부
3. 실행한 validation
4. 남은 DNS, reverse proxy, Chrome Web Store 후속 작업
