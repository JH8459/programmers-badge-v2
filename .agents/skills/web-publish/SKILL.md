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
- domain/API 영향이 있으면 `.codex/rules/api.md`, `.codex/rules/extension.md`
- 관련 작업 절차는 `.codex/instructions/workflow.md`
- web deploy 영향이 있으면 `.github/workflows/deploy-web.yml`, `docker-compose.yml`, `deploy/README.md`

필요한 경우만 reference를 읽는다.

- React/Vite scaffold와 routing 선택: `references/react-vite.md`
- domain split, Route 53, reverse proxy, static deploy: `references/domain-deploy.md`
- UI quality guardrail과 anti-AI pattern checklist: `references/ui-quality.md`

## Workflow

1. 변경 목적을 `landing`, `guide`, `contact`, `privacy/legal`, `domain/deploy`, `shared UI` 중 하나 이상으로 분류한다.
2. route ownership을 먼저 정한다.
   - public UI route는 `apps/web`
   - API와 `/badge/*.svg`는 `apps/api`
   - extension popup/background UX는 `apps/extension`
3. API origin 또는 badge URL이 바뀌면 extension `host_permissions`, runtime API client, CORS, `PUBLIC_BASE_URL`, deploy docs를 함께 점검한다.
4. UI 구현은 Vite + React + TypeScript 기본값을 우선한다.
5. UI 작업이면 `references/ui-quality.md`를 확인하고, generic AI template 패턴을 제거한다.
6. copywriting은 한국어를 기본으로 하고, Chrome Web Store-facing legal copy는 기능/수집/보관/문의 정보를 과장 없이 적는다.
7. 새 page는 desktop/mobile readability, primary action 노출, link target을 확인한다.
8. web Docker/deploy 변경이면 web image build, DockerHub tag, deploy path filter, web-only service restart 기준을 확인한다.
9. docs-update가 필요하면 `.codex/rules/*`, `README.md`, `AGENTS.md`, deploy docs 중 stale surface만 갱신한다.

## Guardrails

- `apps/web`에서 API persistence 구현체나 Chrome API를 import하지 않는다.
- `vite preview`를 production server로 쓰지 않는다.
- 문의 form처럼 서버 저장이 필요한 기능은 API endpoint, validation, abuse 방지 기준을 먼저 설계한다.
- public web page에 secret, token, raw session, 식별 가능한 사용자 샘플 데이터를 넣지 않는다.
- web production deploy는 `deploy-web.yml`에서 web image만 push하고 `web` service만 재시작한다.
- UI를 generic SaaS template처럼 만들지 말고 extension/store assets와 이어지는 dark neon badge/productivity 톤을 유지한다.
- decorative label, 과한 그림자, 불필요한 pill badge, Unicode icon 같은 AI-generated UI 냄새가 강한 패턴을 피한다.

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
