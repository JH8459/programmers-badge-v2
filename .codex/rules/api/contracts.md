# API Contract Rule

## Endpoint Defaults

- sync 응답은 `BadgeSyncResponse`를 반환한다.
- public badge는 full SVG와 mini SVG를 제공한다.
- `/privacy`는 global `/api` prefix 밖에서 HTML 개인정보처리방침 페이지를 제공한다.
- health endpoint는 minimal readiness 확인용이다.

## Validation And Security

- 입력 검증은 서버에서 수행하고 client 입력을 신뢰하지 않는다.
- API contract runtime validation은 `packages/shared-types`의 zod schema를 기본값으로 사용한다.
- HTTP boundary에서는 Nest pipe로 zod parse 결과를 받고, normalization은 shared schema 기준을 따른다.
- `PORT`, `PUBLIC_BASE_URL`, `PUBLIC_BADGE_PATH_PREFIX`, `DATABASE_PATH`, `BADGE_OUTPUT_DIR`는 app-local runtime config zod schema로 검증한다.
- public response에는 public badge 제공에 필요 없는 민감 정보를 넣지 않는다.
- CORS 변경 시 localhost 개발 흐름과 extension origin 허용 범위를 함께 검토한다.

## When Editing

- public response shape를 바꾸면 `packages/shared-types`, extension copy flow, 관련 테스트를 함께 갱신한다.
- sync payload나 response 검증 규칙을 바꾸면 API app-local validator보다 `packages/shared-types` schema를 먼저 갱신한다.
- CORS나 public URL을 바꾸면 web health check, extension API client, deploy 문서를 함께 확인한다.
