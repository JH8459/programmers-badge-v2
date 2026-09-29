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
- 빈칸 채우기 문제는 화면의 코드 조각과 입력칸 값을 순서대로 합쳐 풀이 코드를 수집한다.
- 문제 난이도는 페이지의 `data-challenge-level` 값을 우선 사용하고, 없을 때만 화면의 레벨 문구를 읽는다.
- GitHub 문제 파일은 `프로그래머스/<레벨>/<문제번호>-<정규화된-문제명>/` 아래에 저장한다. 레벨은 `0`, `1`처럼 숫자만 사용한다. 언어별 파일은 독립적으로 유지하고, 같은 언어의 내용이 다르면 덮어쓰며 같으면 커밋을 생략한다.
- GitHub 설정과 재시도 UX는 popup 소유다. App이 접근할 수 있는 저장소 목록과 풀이 기록 대상의 URL을 표시하고, 저장 설정 이후 정답 제출의 GitHub commit 링크를 보여준다. 저장소 목록과 실패 기록은 독립적으로 갱신해 한쪽 조회 실패가 다른 쪽 표시를 막지 않게 하며, 저장소 조회 실패와 실제 빈 목록을 구분한다.
- popup은 선택한 저장소의 기본 브랜치를 표시하고 브랜치 입력을 받지 않는다. 기록 경로는 선택 입력이며 비우면 저장소 루트에 기본 문제 디렉터리를 만든다.
- popup은 저장소 설정 요청 중 버튼에 진행 상태를 표시하고 중복 저장을 막으며, 저장 실패 시 입력한 경로를 유지한다.
- 풀이 기록은 저장된 저장소 설정이 있을 때 정답 제출 후 자동 실행한다. Badge 자동 동기화 실패와 GitHub 기록 실패는 서로 독립적으로 처리한다.
- popup 초기화 시 GitHub 연결 상태 조회 실패가 마지막 배지 동기화 상태나 자동 동기화 설정을 초기화하지 않도록 각 조회 결과를 독립적으로 반영한다.

## When Editing

- sync state를 바꾸면 popup view-model, background 메시지 처리, 테스트를 함께 갱신한다.
- Programmers record 파싱을 바꾸면 external payload zod schema, contract 영향, fallback 동작을 함께 확인한다.
- 외부 record에는 모든 badge 통계 필드가 있어야 하며 부분 응답을 0으로 보정하지 않는다. stable user ID가 없으면 v0.1.1 호환성을 위해 기존 `name`을 `programmerId` fallback으로 사용한다.
- 페이지 감지나 auto-sync 로직을 바꿀 때는 오탐/중복 sync 방지 규칙을 같이 검토한다.
- popup copy flow를 바꾸면 API response와 badge URL/Markdown copy format을 함께 확인한다.
