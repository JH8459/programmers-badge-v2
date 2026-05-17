# Codex Guide

이 디렉토리는 `PROGRAMMERS-BADGE-V2`의 작업 기준 문서다.
규칙은 `.codex/rules/*`, 작업 절차는 `.codex/instructions/*`를 source-of-truth로 사용한다.
`.codex` 밖의 문서와 충돌하면 `.codex`를 우선한다.

## Read Order

1. `.codex/rules/common.md`
2. `.codex/rules/architecture.md`
3. `.codex/memory/user-preferences.md`, `.codex/memory/recurring-mistakes.md`
4. 작업 범위에 맞는 `.codex/rules/api.md`, `.codex/rules/extension.md`, `.codex/rules/web.md`, `.codex/rules/packages.md`
   - api 작업은 `.codex/rules/api.md`를 entrypoint로 읽고, 필요한 `.codex/rules/api/*.md` 하위 rule을 추가로 읽는다.
   - extension 작업은 `.codex/rules/extension.md`를 entrypoint로 읽고, 필요한 `.codex/rules/extension/*.md` 하위 rule을 추가로 읽는다.
   - web 작업은 `.codex/rules/web.md`를 entrypoint로 읽고, 필요한 `.codex/rules/web/*.md` 하위 rule을 추가로 읽는다.
5. 관련 `.codex/instructions/*.md`
6. reviewer나 custom subagent를 쓰면 `.codex/agents/README.md`
7. 필요 시 `.codex/rules/roadmap.md`, `.codex/rules/adrs/README.md`

## Directory Map

- `.codex/rules/common.md`: 제품 목표, MVP 범위, 공통 guardrail, repo/runtime 기본값
- `.codex/rules/architecture.md`: monorepo 구조, 책임, dependency boundary, 기본 data flow
- `.codex/rules/api.md`: `apps/api` 전용 entrypoint, 하위 API rule 읽기 기준
- `.codex/rules/api/runtime.md`: API runtime env, Docker, NAS deploy, health check 기준
- `.codex/rules/api/contracts.md`: API endpoint, request/response, validation, CORS 기준
- `.codex/rules/api/badge-delivery.md`: API persistence, public slug, SVG asset, badge static serving 기준
- `.codex/rules/extension.md`: `apps/extension` 전용 entrypoint, 하위 extension rule 읽기 기준
- `.codex/rules/extension/runtime.md`: extension manifest, permissions, Chrome API, runtime bundling 기준
- `.codex/rules/extension/sync-flow.md`: extension popup, background, content script, sync flow 기준
- `.codex/rules/extension/release-assets.md`: extension icon, store listing asset, zip packaging, release workflow 기준
- `.codex/rules/web.md`: `apps/web` 전용 entrypoint, 하위 web rule 읽기 기준
- `.codex/rules/web/ui.md`: web UI, layout, component, copy tone 기준
- `.codex/rules/web/assets.md`: landing image, screenshot, generated bitmap asset 기준
- `.codex/rules/web/publishing.md`: web route, domain, deploy, privacy/legal publishing 기준
- `.codex/rules/packages.md`: `packages/*` 전용 규칙, contract/rendering/config boundary와 shared zod schema 기준
- `.codex/rules/roadmap.md`: 현재 상태와 다음 단계
- `.codex/rules/adrs/README.md`: 장기 architecture decision record 위치
- `.codex/memory/README.md`: memory 목적, 승격 기준, 업데이트 정책
- `.codex/memory/user-preferences.md`: 사용자 선호와 작업 방식 선호
- `.codex/memory/recurring-mistakes.md`: 반복 실수와 예방 규칙
- `.codex/instructions/workflow.md`: planning/execution/validation/reporting 기본 절차
- `.codex/instructions/review.md`: 리뷰 severity와 체크리스트
- `.codex/instructions/git.md`: commit message와 commit splitting 규칙
- `.codex/instructions/memory.md`: memory 읽기/승격/업데이트 절차
- `.codex/agents/README.md`: custom subagent 목록과 호출 기준
- `.codex/agents/api-senior-code-review.toml`: API senior reviewer 정의
- `.codex/agents/extension-senior-code-review.toml`: extension senior reviewer 정의
- `.agents/skills/*`: repo-local reusable skill 정의 위치

## How To Read

- API만 수정하면 `common`, `architecture`, `api`, 필요한 API 하위 rule과 `instructions`를 읽는다.
- Extension만 수정하면 `common`, `architecture`, `extension`, 필요한 extension 하위 rule과 `instructions`를 읽는다.
- Web만 수정하면 `common`, `architecture`, `web`, 필요한 web 하위 rule과 `instructions`를 읽는다.
- `packages/*`를 수정하거나 boundary를 건드리면 `common`, `architecture`, `packages`를 함께 읽고 contract zod schema 영향 여부를 확인한다.
- API와 extension을 함께 바꾸면 두 개별 규칙을 모두 읽고 contract 영향 여부를 확인한다.
- Web과 API/extension을 함께 바꾸면 domain, CORS, public URL, shared contract 영향 여부를 함께 확인한다.
- 구조나 workflow를 바꾸는 작업이면 `memory/*`도 먼저 읽고, 새 선호나 반복 실수가 생겼는지 확인한다.
- repo-local skill을 직접 만들거나 수정하면 해당 `.agents/skills/*/SKILL.md`와 `agents/openai.yaml`을 함께 본다.
