# Extension Sync Flow Rule

## Sync Defaults

- content script는 Programmers lesson page 매치에서 동작한다.
- background는 logged-in Programmers 세션으로 `https://programmers.co.kr/api/v1/users/record`를 읽는다.
- popup은 수동 sync 진입점과 마지막 sync 상태를 보여준다.
- 성공 시 standard/mini badge preview를 선택할 수 있고, 복사 영역은 선택된 형식의 Badge URL/Markdown 2개 항목만 제공한다.
- content script는 제출 시그널을 감지하면 dedupe와 cooldown을 거쳐 auto-sync를 요청한다.
- background API client는 manifest `host_permissions`의 hosted API origin을 우선 사용하고, 없으면 hosted default URL로 fallback한다.
- external Programmers record와 hosted sync response는 runtime에서 zod parse를 거친다.
- page context에서 가져온 Programmers record는 raw JSON으로 반환하고, extension context에서 다시 zod parse 한다.

## When Editing

- sync state를 바꾸면 popup view-model, background 메시지 처리, 테스트를 함께 갱신한다.
- Programmers record 파싱을 바꾸면 external payload zod schema, contract 영향, fallback 동작을 함께 확인한다.
- 페이지 감지나 auto-sync 로직을 바꿀 때는 오탐/중복 sync 방지 규칙을 같이 검토한다.
- popup copy flow를 바꾸면 API response와 badge URL/Markdown copy format을 함께 확인한다.
