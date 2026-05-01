# Extension Rule

## Ownership

`apps/extension`은 Chrome extension으로서 아래를 소유한다.

- popup UX와 copy flow
- background service worker와 sync orchestration
- content script 기반 Programmers 페이지 감지와 auto-sync trigger
- Chrome APIs, local extension state, permission 범위

## Runtime Defaults

- Manifest V3를 사용한다.
- 현재 permission은 `storage`, `activeTab`, `tabs`, `scripting`이다.
- 현재 `host_permissions`는 `https://programmers-badge.jh8459.com/*`만 허용한다.
- content script는 Programmers lesson page 매치에서 동작한다.
- background는 logged-in Programmers 세션으로 `https://programmers.co.kr/api/v1/users/record`를 읽는다.

## Current Behavior Defaults

- popup은 수동 sync 진입점과 마지막 sync 상태를 보여준다.
- 성공 시 badge preview, public badge URL, Markdown snippet 복사를 제공한다.
- content script는 제출 시그널을 감지하면 dedupe와 cooldown을 거쳐 auto-sync를 요청한다.
- 현재 API base URL은 `https://programmers-badge.jh8459.com` 상수에 고정돼 있다.

## Security And Privacy

- raw credential, session token, cookie를 저장하지 않는다.
- extension 권한은 최소 범위를 유지한다.
- 민감한 사용자 정보를 popup, storage, public URL에 과하게 노출하지 않는다.
- backend persistence 규칙이나 admin 성격 로직을 extension에 복제하지 않는다.

## Guardrails

- API contract는 `packages/shared-types`를 기준으로 맞춘다.
- backend URL 전략을 바꾸면 `manifest.json`, background client, 테스트, 문서를 함께 갱신한다.
- 페이지 감지나 auto-sync 로직을 바꿀 때는 오탐/중복 sync 방지 규칙을 같이 검토한다.
- popup 변경은 작은 viewport에서도 핵심 액션이 유지되는지 확인한다.

## When Editing

- permission 추가는 명시적 근거와 함께 최소 범위로 한다.
- sync state를 바꾸면 popup view-model, background 메시지 처리, 테스트를 함께 갱신한다.
- Programmers record 파싱을 바꾸면 contract 영향과 fallback/validation 동작을 함께 확인한다.
