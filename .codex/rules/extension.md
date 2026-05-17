# Extension Rule

`apps/extension`은 Chrome extension runtime과 사용자 sync UX를 소유한다.
이 파일은 extension rule의 entrypoint이고, 상세 기준은 작업 범위에 맞는 하위 문서를 읽는다.

## Ownership

`apps/extension`은 아래 surface를 소유한다.

- popup UX와 copy flow
- background service worker와 sync orchestration
- content script 기반 Programmers 페이지 감지와 auto-sync trigger
- Chrome APIs, local extension state, permission 범위
- extension icon과 Chrome Web Store listing image asset

## Read By Scope

- manifest, permissions, Chrome API, runtime bundling 작업: `.codex/rules/extension/runtime.md`
- popup, background, content script, sync flow 작업: `.codex/rules/extension/sync-flow.md`
- icon, store listing asset, zip packaging, release workflow 작업: `.codex/rules/extension/release-assets.md`

여러 범위를 동시에 바꾸면 관련 하위 문서를 모두 읽는다.

## Guardrails

- API contract는 `packages/shared-types`를 기준으로 맞춘다.
- contract runtime validation은 가능하면 shared zod schema를 재사용한다.
- backend URL 전략을 바꾸면 `manifest.json`, background client, 테스트, 문서를 함께 갱신한다.
- extension release artifact를 바꾸면 build output, zip packaging, release workflow를 함께 갱신한다.
- icon을 바꾸면 `manifest.json`, `copy-assets.mjs`, `dist` 포함 여부를 함께 확인한다.
- package script를 바꾸면 local `pnpm package:extension`과 GitHub Actions `release-extension` workflow를 함께 확인한다.
- 페이지 감지나 auto-sync 로직을 바꿀 때는 오탐/중복 sync 방지 규칙을 같이 검토한다.
- popup 변경은 작은 viewport에서도 핵심 액션이 유지되는지 확인한다.

## Validation

- extension code 변경 시 영향 범위에 맞게 lint, typecheck, test, package 검증을 확인한다.
- popup 변경은 작은 viewport와 핵심 액션 노출 여부를 함께 본다.
- permission이나 host permission 변경은 최소 권한과 Chrome Web Store 제출 영향까지 확인한다.
