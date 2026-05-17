# Web Rule

`apps/web`은 React public web UI를 소유한다.
이 파일은 web rule의 entrypoint이고, 상세 기준은 작업 범위에 맞는 하위 문서를 읽는다.

## Ownership

`apps/web`은 아래 surface를 소유한다.

- landing page와 product positioning
- 사용 방법 안내, 설치 안내, badge URL/Markdown 사용 안내
- 문의하기 page와 support entrypoint
- 개인정보처리방침 같은 public legal page
- Chrome Web Store 제출과 연결되는 public documentation surface

## Read By Scope

- UI, layout, component, copy tone 작업: `.codex/rules/web/ui.md`
- landing image, screenshot, generated bitmap asset 작업: `.codex/rules/web/assets.md`
- route, domain, deploy, privacy/legal publishing 작업: `.codex/rules/web/publishing.md`

여러 범위를 동시에 바꾸면 관련 하위 문서를 모두 읽는다.

## Boundary Rules

- `apps/web`은 `apps/api`를 import하지 않고 HTTP contract만 사용한다.
- `apps/web`은 Chrome API를 직접 사용하지 않는다.
- API request/response validation이 필요하면 `packages/shared-types` zod schema를 우선한다.
- web-specific UI state는 web app 안에 두고, extension storage/background state와 공유하지 않는다.
- public page에 민감한 사용자 정보나 운영 secret을 노출하지 않는다.

## Validation

- web code 변경 시 최소 `pnpm --filter @programmers-badge/web lint`, `typecheck`, `build`를 확인한다.
- route나 copy 변경 시 작은 viewport에서 primary action, readability, link target을 확인한다.
- API origin 변경이 포함되면 API, extension, deploy docs를 함께 검증한다.
