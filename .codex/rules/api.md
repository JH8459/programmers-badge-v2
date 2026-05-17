# API Rule

`apps/api`는 NestJS backend를 소유한다.
이 파일은 API rule의 entrypoint이고, 상세 기준은 작업 범위에 맞는 하위 문서를 읽는다.

## Ownership

`apps/api`는 아래 surface를 소유한다.

- `/api/sync`, `/api/badge/:slug.svg`, `/api/badge/:slug/mini.svg`, `/api/health` endpoint
- Chrome Web Store 제출용 `/privacy` public legal page
- `/badge/:slug.svg`, `/badge/:slug-mini.svg` 정적 서빙 경로
- payload validation과 normalization
- SQLite persistence와 schema 관리
- pre-rendered SVG asset 생성과 public badge URL 조합

## Read By Scope

- runtime env, Docker, NAS deploy, health check 작업: `.codex/rules/api/runtime.md`
- endpoint, request/response, validation, CORS 작업: `.codex/rules/api/contracts.md`
- persistence, public slug, SVG asset, badge static serving 작업: `.codex/rules/api/badge-delivery.md`

여러 범위를 동시에 바꾸면 관련 하위 문서를 모두 읽는다.

## Guardrails

- `apps/api`는 rendering 규칙을 직접 중복 구현하지 않고 `packages/badge-core`를 사용한다.
- Chrome API나 extension 전용 상태 모델을 API로 끌어오지 않는다.
- persistence 로직은 API 안에 두고 extension으로 새지 않게 유지한다.
- badge asset I/O는 API가 소유하되, 렌더링 자체는 `badge-core`에 유지한다.
- env, URL, slug 정책을 바꾸면 API 응답, extension 소비부, 문서를 함께 갱신한다.

## Validation

- API code 변경 시 영향 범위에 맞게 lint, typecheck, test, build를 확인한다.
- runtime env 규칙을 바꾸면 default 값과 invalid env 실패 케이스를 확인한다.
- public badge 변경이면 status code, response 형식, 민감 정보 노출 여부를 함께 확인한다.
