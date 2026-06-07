# AGENTS.md

이 문서는 `PROGRAMMERS-BADGE-V2` 작업의 경로 안내 문서다.
source-of-truth는 `.codex/rules/*`와 `.codex/instructions/*`를 사용한다.
`AGENTS.md`에는 경로만 유지하고 세부 정책은 `.codex`에 둔다.

## Review guidelines

- Codex GitHub 원격 리뷰는 `.codex/instructions/remote-code-review.md`를 따른다.
- 리뷰 코멘트와 리뷰 요약은 한국어로 작성한다.
- 모든 finding은 `P0`, `P1`, `P2`, `P3` 중 하나로 분류한다.
- GitHub 원격 리뷰 기본 코멘트는 merge 전에 반드시 봐야 하는 `P0`/`P1`을 우선한다.

## Read Order

1. `.codex/README.md`
2. `.codex/rules/common.md`
3. `.codex/rules/architecture.md`
4. `.codex/memory/user-preferences.md`, `.codex/memory/recurring-mistakes.md`
5. 작업 범위에 맞는 `.codex/rules/api.md`, `.codex/rules/extension.md`, `.codex/rules/web.md`, `.codex/rules/packages.md`
   - api 작업은 `.codex/rules/api.md`를 entrypoint로 읽고, 필요한 `.codex/rules/api/*.md` 하위 rule을 추가로 읽는다.
   - extension 작업은 `.codex/rules/extension.md`를 entrypoint로 읽고, 필요한 `.codex/rules/extension/*.md` 하위 rule을 추가로 읽는다.
   - web 작업은 `.codex/rules/web.md`를 entrypoint로 읽고, 필요한 `.codex/rules/web/*.md` 하위 rule을 추가로 읽는다.
6. 배포/릴리스 workflow를 다루면 `.codex/rules/deployment.md`
7. 관련 `.codex/instructions/*.md`
8. reviewer나 custom subagent를 쓰면 `.codex/agents/README.md`
9. repo-local skill을 쓰거나 수정하면 관련 `.agents/skills/*/SKILL.md`
10. 필요 시 `.codex/rules/roadmap.md`, `.codex/rules/adrs/README.md`

## Path Index

- `.codex/README.md`: 전체 읽기 순서와 문서 지도
- `.codex/rules/common.md`: 공통 제품/범위/guardrail
- `.codex/rules/architecture.md`: monorepo 구조와 boundary
- `.codex/rules/deployment.md`: GitHub Actions deploy/release workflow, environment, secret ownership, NAS production 운영 규칙
- `.codex/rules/api.md`: `apps/api` 전용 entrypoint
- `.codex/rules/api/runtime.md`: API runtime/deploy 규칙
- `.codex/rules/api/contracts.md`: API endpoint/contract/validation 규칙
- `.codex/rules/api/badge-delivery.md`: API persistence/badge delivery 규칙
- `.codex/rules/extension.md`: `apps/extension` 전용 entrypoint
- `.codex/rules/extension/runtime.md`: extension runtime/permission 규칙
- `.codex/rules/extension/sync-flow.md`: extension sync flow 규칙
- `.codex/rules/extension/release-assets.md`: extension asset/zip packaging 규칙
- `.codex/rules/web.md`: `apps/web` 전용 entrypoint
- `.codex/rules/web/ui.md`: web UI/layout/copy 규칙
- `.codex/rules/web/assets.md`: web landing asset 규칙
- `.codex/rules/web/publishing.md`: web route/domain/deploy/legal publishing 규칙
- `.codex/rules/packages.md`: `packages/*` 전용 규칙
- `.codex/rules/roadmap.md`: 현재 상태와 다음 단계
- `.codex/rules/adrs/README.md`: ADR 위치
- `.codex/memory/README.md`: memory 목적과 업데이트 기준
- `.codex/memory/user-preferences.md`: 사용자 선호와 작업 방식 선호
- `.codex/memory/recurring-mistakes.md`: 반복 실수와 예방 규칙
- `.codex/instructions/workflow.md`: 작업 절차
- `.codex/instructions/review.md`: 리뷰 기준
- `.codex/instructions/remote-code-review.md`: Codex GitHub 원격 리뷰 기준
- `.codex/instructions/git.md`: Git 규칙
- `.codex/instructions/memory.md`: memory 읽기/승격/업데이트 절차
- `.codex/agents/README.md`: custom subagent 목록과 호출 기준
- `.codex/agents/api-senior-code-review.toml`: API senior reviewer 정의
- `.codex/agents/extension-senior-code-review.toml`: extension senior reviewer 정의
- `.agents/skills/senior-review-flow/SKILL.md`: reviewer 호출 시점 제어 skill
- `.agents/skills/review-workflow/SKILL.md`: senior/critical lens 종합 리뷰 skill
- `.agents/skills/critical-review/SKILL.md`: 비판적 diff/PR 리뷰 skill
- `.agents/skills/nas-deploy/SKILL.md`: API DockerHub to NAS deploy workflow skill
- `.agents/skills/commit/SKILL.md`: commit splitting, staging, push planning skill
- `.agents/skills/pr-workflow/SKILL.md`: PR 작성 전 커밋 분리, 메시지, PR 템플릿 workflow skill
- `.agents/skills/docs-update/SKILL.md`: diff 기반 docs update skill
- `.agents/skills/extension-release/SKILL.md`: Chrome extension release 검증, GitHub Release, Chrome Web Store publish, `extension-v*` tag push workflow skill
- `.agents/skills/web-publish/SKILL.md`: public web UI/page publishing skill
