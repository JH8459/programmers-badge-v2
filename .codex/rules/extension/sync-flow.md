# Extension Sync Flow Rule

## Sync Defaults

- content script는 Programmers lesson page 매치에서 동작한다.
- background는 logged-in Programmers 세션으로 `https://programmers.co.kr/api/v1/users/record`를 읽는다.
- popup은 수동 sync 진입점과 마지막 sync 상태를 보여준다.
- popup은 자동 동기화 on/off와 마지막 성공 동기화 시각을 보여준다. 자동 동기화 설정은 extension local storage에 저장되고, 꺼져 있어도 수동 sync는 동작한다.
- 성공 시 standard/mini badge preview를 선택할 수 있고, 복사 영역은 선택된 형식의 Badge URL/Markdown 2개 항목만 제공한다.
- content script는 제출 시그널을 감지하면 dedupe와 cooldown을 거쳐 auto-sync를 요청한다.
- accepted 결과를 감지한 뒤 2초 기다려 최신 Programmers 통계를 읽고, upstream의 일시 오류와 API의 네트워크/408/429/5xx 오류는 제한된 횟수만 재시도한다.
- background API client는 manifest `host_permissions`의 hosted API origin을 우선 사용하고, 없으면 hosted default URL로 fallback한다.
- external Programmers record와 hosted sync response는 runtime에서 zod parse를 거친다.
- page context에서 가져온 Programmers record는 raw JSON으로 반환하고, extension context에서 다시 zod parse 한다.
- 정답 제출 감지 후 사용자가 GitHub App을 연결한 경우에만 현재 Programmers 문제의 metadata와 편집기 source를 API로 보낸다.
- GitHub 문제 파일은 `프로그래머스/<레벨>/<문제번호>-<정규화된-문제명>/` 아래에 저장한다. 레벨은 `0`, `1`처럼 숫자만 사용한다. 언어별 파일은 독립적으로 유지하고, 같은 언어의 내용이 다르면 덮어쓰며 같으면 커밋을 생략한다.
- GitHub 설정과 재시도 UX는 popup 소유다. Badge 자동 동기화 실패와 GitHub 기록 실패는 서로 독립적으로 처리한다.

## When Editing

- sync state를 바꾸면 popup view-model, background 메시지 처리, 테스트를 함께 갱신한다.
- Programmers record 파싱을 바꾸면 external payload zod schema, contract 영향, fallback 동작을 함께 확인한다.
- 외부 record에는 stable user ID와 모든 badge 통계 필드가 있어야 하며 부분 응답을 0으로 보정하지 않는다.
- 페이지 감지나 auto-sync 로직을 바꿀 때는 오탐/중복 sync 방지 규칙을 같이 검토한다.
- popup copy flow를 바꾸면 API response와 badge URL/Markdown copy format을 함께 확인한다.
