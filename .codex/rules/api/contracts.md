# API Contract Rule

## Endpoint Defaults

- sync 응답은 `BadgeSyncResponse`를 반환한다.
- sync request는 Programmers 계정 ID 또는 이전 extension과 호환되는 계정 `name` 식별자와 검증된 전체 통계 snapshot을 받는다. 기존 확장 프로그램에서 넘어오는 `legacyProgrammerHandle`은 이전 public slug를 한 번 이어받는 데만 사용한다.
- 기존 확장 버전 호환을 위해 `/api/sync` payload/response와 기존 badge·health route는 유지하고, 새 기능은 별도 route와 additive persistence migration으로 추가한다.
- sync 응답에는 내부 계정 ID를 포함하지 않는다.
- public badge는 full SVG와 mini SVG를 제공한다.
- malformed slug와 미등록 slug는 같은 404 메시지를 반환한다.
- `/api/sync`는 client IP별 분당 30회로 제한하고 `Retry-After`를 반환한다.
- API badge route는 일치하는 `ETag`에 304를 반환한다. 정적 badge URL은 `ETag`와 `Cache-Control: public, max-age=0, must-revalidate`를 제공한다.
- health endpoint는 minimal readiness 확인용이다.
- Swagger 문서는 `ENABLE_SWAGGER=true`일 때 `/api/docs`와 `/api/docs-json`으로 제공하고, HTTP Basic Auth를 요구한다.
- public legal/privacy page는 web이 소유하며 API는 `/privacy`를 서빙하지 않는다.
- GitHub 연동은 `/api/github/*`가 소유한다. 설치 state는 일회용이며 시작 브라우저의 단기 HttpOnly cookie와 함께 검증하고, session token은 hash만 저장한다.
- GitHub installation token은 API 서버에서 저장소를 지정해 요청 시 발급한다. extension에는 GitHub credential을 전달하지 않는다.
- 풀이 제출은 payload를 재검증한다. GitHub 기록 실패일 때만 재시도용 source code를 보관하고, 성공·건너뜀 또는 연결 해제 시 제거한다.
- 저장소 설정의 `branch` 필드는 기존 extension 계약과 호환되도록 받되, API는 저장소의 기본 브랜치를 사용한다. 기존 설정의 다른 브랜치 값은 응답과 신규 풀이 기록에 적용하지 않고, 실패 기록 재시도 시에도 현재 기본 브랜치를 조회한다.

## Validation And Security

- 입력 검증은 서버에서 수행하고 client 입력을 신뢰하지 않는다.
- SQLite query의 동적 값은 prepared statement의 parameter binding으로 전달한다. 요청값이나 저장값을 SQL 문자열에 직접 보간하지 않는다. 컬럼·정렬 키처럼 바인딩할 수 없는 식별자는 코드 내 allowlist에서 선택한다.
- API contract runtime validation은 `packages/shared-types`의 zod schema를 기본값으로 사용한다.
- Swagger DTO는 문서화용 class로만 두고, runtime request validation은 zod schema와 Nest pipe를 기준으로 한다.
- HTTP boundary에서는 Nest pipe로 zod parse 결과를 받고, normalization은 shared schema 기준을 따른다.
- `PORT`, `PUBLIC_BASE_URL`, `PUBLIC_BADGE_PATH_PREFIX`, `DATABASE_PATH`, `BADGE_OUTPUT_DIR`는 app-local runtime config zod schema로 검증한다.
- CORS web origin은 `ALLOWED_WEB_ORIGINS` env의 comma-separated origin list를 기준으로 허용한다.
- extension CORS와 GitHub session route는 `chrome-extension://` 뒤에 유효한 32자 Chrome extension ID가 오는 origin을 허용한다. 특정 extension ID를 사전에 등록하지 않아도 된다.
- `ALLOWED_EXTENSION_ORIGINS`에 등록된 기존 Chrome extension origin은 계속 지원하며, GitHub 연동에는 이 변수가 필요하지 않다.
- GitHub session routes는 credentialed cookie를 검증한다. `Origin`이 있으면 유효한 Chrome extension origin이어야 한다. `Origin`이 생략된 경우에는 읽기 `GET` 요청에 한해 `Sec-Fetch-Site: none`, `Sec-Fetch-Mode: cors`, `Sec-Fetch-Dest: empty` 조합을 요구한다. 쓰기 요청은 계속 extension `Origin`을 요구해 CSRF 요청을 거부한다.
- local development에서만 `ALLOW_LOCALHOST_ORIGINS=true`로 explicit port가 있는 `http://localhost:*`, `http://127.0.0.1:*` origin을 허용한다.
- public response에는 public badge 제공에 필요 없는 민감 정보를 넣지 않는다.
- solved count는 total을 넘을 수 없고, badge tier는 skill level에서 계산한 값과 일치해야 한다.
- CORS 변경 시 localhost 개발 흐름과 extension origin 허용 범위를 함께 검토한다.

## When Editing

- public response shape를 바꾸면 `packages/shared-types`, extension copy flow, 관련 테스트를 함께 갱신한다.
- sync payload나 response 검증 규칙을 바꾸면 API app-local validator보다 `packages/shared-types` schema를 먼저 갱신한다.
- CORS나 public URL을 바꾸면 web health check, extension API client, deploy 문서를 함께 확인한다.
