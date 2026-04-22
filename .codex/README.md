# Codex Guide

이 디렉토리는 `PROGRAMMERS-BADGE-V2`의 작업 기준 문서다.
규칙은 `.codex/rules/*`, 작업 절차는 `.codex/instructions/*`를 source-of-truth로 사용한다.
`.codex` 밖의 문서와 충돌하면 `.codex`를 우선한다.

## Read Order

1. `.codex/rules/common.md`
2. `.codex/rules/architecture.md`
3. `.codex/memory/user-preferences.md`, `.codex/memory/recurring-mistakes.md`
4. 작업 범위에 맞는 `.codex/rules/api.md`, `.codex/rules/extension.md`, `.codex/rules/packages.md`
5. 관련 `.codex/instructions/*.md`
6. reviewer나 custom subagent를 쓰면 `.codex/agents/README.md`
7. 필요 시 `.codex/rules/roadmap.md`, `.codex/rules/adrs/README.md`

## Directory Map

- `.codex/rules/common.md`: 제품 목표, MVP 범위, 공통 guardrail, repo/runtime 기본값
- `.codex/rules/architecture.md`: monorepo 구조, 책임, dependency boundary, 기본 data flow
- `.codex/rules/api.md`: `apps/api` 전용 규칙, runtime 기본값, persistence/public badge 규칙
- `.codex/rules/extension.md`: `apps/extension` 전용 규칙, Chrome extension 동작/권한 기본값
- `.codex/rules/packages.md`: `packages/*` 전용 규칙, contract/rendering/config boundary
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

## How To Read

- API만 수정하면 `common`, `architecture`, `api`, 필요한 `instructions`를 읽는다.
- Extension만 수정하면 `common`, `architecture`, `extension`, 필요한 `instructions`를 읽는다.
- `packages/*`를 수정하거나 boundary를 건드리면 `common`, `architecture`, `packages`를 함께 읽는다.
- API와 extension을 함께 바꾸면 두 개별 규칙을 모두 읽고 contract 영향 여부를 확인한다.
- 구조나 workflow를 바꾸는 작업이면 `memory/*`도 먼저 읽고, 새 선호나 반복 실수가 생겼는지 확인한다.
