# Extension Runtime Rule

## Runtime Defaults

- Manifest V3를 사용한다.
- 현재 permission은 `storage`, `activeTab`, `tabs`, `scripting`이다.
- 현재 `host_permissions`는 `https://api.programmers-badge.jh8459.com/*`만 허용한다.
- extension runtime JS는 `esbuild`로 번들링해서 bare package import가 Chrome runtime에 남지 않게 한다.

## Security And Privacy

- raw credential, session token, cookie를 저장하지 않는다.
- extension 권한은 최소 범위를 유지한다.
- 민감한 사용자 정보를 popup, storage, public URL에 과하게 노출하지 않는다.
- backend persistence 규칙이나 admin 성격 로직을 extension에 복제하지 않는다.

## When Editing

- permission 추가는 명시적 근거와 함께 최소 범위로 한다.
- backend URL 전략을 바꾸면 `manifest.json`, background client, 테스트, 문서를 함께 갱신한다.
- `chrome.scripting.executeScript`에 넘긴 함수는 self-contained 하게 유지하고, import 의존 검증은 반환 뒤 extension context에서 처리한다.
