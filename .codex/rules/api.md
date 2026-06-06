# API Rule

`apps/api`는 NestJS backend를 소유한다.
이 파일은 API rule의 entrypoint이고, 상세 기준은 작업 범위에 맞는 하위 문서를 읽는다.

## Ownership

`apps/api`는 아래 surface를 소유한다.

- `/api/sync`, `/api/badge/:slug.svg`, `/api/badge/:slug/mini.svg`, `/api/health` endpoint
- `/badge/:slug.svg`, `/badge/:slug-mini.svg` 정적 서빙 경로
- payload validation과 normalization
- SQLite persistence와 schema 관리
- pre-rendered SVG asset 생성과 public badge URL 조합

## Read By Scope

- runtime env, Docker, NAS deploy, health check 작업: `.codex/rules/api/runtime.md`
- GitHub Actions deploy workflow, environment, secret 작업: `.codex/rules/deployment.md`
- endpoint, request/response, validation, CORS 작업: `.codex/rules/api/contracts.md`
- persistence, public slug, SVG asset, badge static serving 작업: `.codex/rules/api/badge-delivery.md`

여러 범위를 동시에 바꾸면 관련 하위 문서를 모두 읽는다.

## Internal Structure

- domain 기능은 `apps/api/src/{domain}` aggregate module 아래에 둔다.
- public HTTP controller는 `{domain}/presenter/http/*`에 두고 thin adapter 역할만 맡긴다.
- HTTP application flow는 `{domain}/application/use-case/http/*`에서 orchestrate한다.
- state mutation은 `{domain}/application/command/*` command와 handler에 두고 `@nestjs/cqrs` `CommandBus`로 실행한다.
- read model 조회는 `{domain}/application/query/*` query와 handler에 두고 `@nestjs/cqrs` `QueryBus`로 실행한다.
- DB, file system, asset writer 같은 I/O adapter는 `{domain}/infra/*`에 둔다.
- `health`처럼 cross-cutting endpoint는 별도 module을 둘 수 있지만, domain infra를 직접 재구현하지 않는다.

## Test Placement

- API unit spec은 테스트 대상 command/query/use-case/service/module 파일과 같은 source 경로에 둔다.
- API e2e spec은 테스트 대상 HTTP controller와 같은 경로에 둔다.
- Swagger처럼 특정 controller가 아니라 HTTP app setup이 소유하는 route의 e2e spec은 setup 파일과 같은 source 경로에 둔다.
- `apps/api/test`에는 e2e app bootstrap, 임시 DB/asset 같은 e2e 테스트 인프라만 둔다.

## Guardrails

- `apps/api`는 rendering 규칙을 직접 중복 구현하지 않고 `packages/badge-core`를 사용한다.
- Chrome API나 extension 전용 상태 모델을 API로 끌어오지 않는다.
- persistence 로직은 API 안에 두고 extension으로 새지 않게 유지한다.
- badge asset I/O는 API가 소유하되, 렌더링 자체는 `badge-core`에 유지한다.
- controller에서 persistence나 asset writer를 직접 호출하지 않고 use-case를 거친다.
- use-case는 HTTP/application orchestration을 맡고, `CommandBus`/`QueryBus`를 통해 mutation/read 책임을 나눈다.
- env, URL, slug 정책을 바꾸면 API 응답, extension 소비부, 문서를 함께 갱신한다.

## Validation

- API code 변경 시 영향 범위에 맞게 lint, typecheck, test, e2e, API coverage, build를 확인한다.
- API coverage는 `apps/api/src` 전체 statements/branches/functions/lines 100% 기준으로 확인한다.
- runtime env 규칙을 바꾸면 default 값과 invalid env 실패 케이스를 확인한다.
- public badge 변경이면 status code, response 형식, 민감 정보 노출 여부를 함께 확인한다.
