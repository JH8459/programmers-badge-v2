# API Badge Delivery Rule

## Badge And Persistence Defaults

- re-sync 시 같은 안정적인 `programmerId`이면 표시 이름이 바뀌어도 기존 `publicSlug`를 유지한다.
- 기존 DB row는 username key를 stable ID로 backfill하고, 구버전 extension이 전달하는 이전 handle 또는 유일하게 일치하는 이전 표시 이름으로 첫 stable ID sync에 채택한다.
- 오래된 `syncedAt` snapshot은 최신 row를 덮어쓰지 않는다.
- sync 시 동일 slug의 full/mini SVG asset을 pre-render하며, 렌더 결과가 같으면 파일을 다시 쓰지 않는다.
- `/badge/*.svg`는 Nest/Express static middleware로 정적 서빙한다.
- API badge route와 static asset은 ETag 조건부 요청을 처리하고 재검증 캐시 헤더를 제공한다.
- full badge의 display name은 XML 텍스트로 escape하고 XML 1.0에서 허용하지 않는 제어 문자를 제거한다.
- public slug는 소문자 hex 12자로 검증하며 malformed/미등록 slug는 동일한 404 응답을 반환한다.
- `/api/sync` 요청은 client IP별 분당 30회로 제한한다. rate-limit 상태는 단일 API 프로세스 내에서 관리한다.
- persistence schema 변경은 현재 additive migration 패턴을 우선한다.
- badge aggregate는 `apps/api/src/badge` 아래에서 sync와 public badge delivery를 함께 소유한다.

## CQRS Flow

- sync HTTP flow는 `SyncHttpController -> SyncBadgeUseCase -> CommandBus -> SyncBadgeCommandHandler -> BadgeProfileRepository` 순서로 둔다.
- sync use-case는 command 결과 record로 full/mini SVG asset을 pre-render하고 `BadgeSyncResponse`를 만든다.
- public badge HTTP flow는 `BadgeHttpController -> GetPublicBadgeUseCase -> QueryBus -> GetPublicBadgeQueryHandler -> BadgeProfileRepository` 순서로 둔다.
- public badge use-case는 asset cache를 먼저 읽고, cache miss면 query로 record를 조회해 SVG asset을 재생성한다.

## Boundary Rules

- badge asset I/O는 API가 소유한다.
- badge rendering 규칙은 `packages/badge-core`에 유지하고 API에서 직접 중복 구현하지 않는다.
- persistence 로직은 API 내부에 두고 extension이나 web으로 새지 않게 유지한다.

## When Editing

- badge SVG 규칙을 바꾸면 `packages/badge-core`로 이동 가능한지 먼저 검토한다.
- persistence/schema를 바꾸면 기존 DB 호환성과 re-sync semantics를 먼저 확인한다.
- public slug 정책을 바꾸면 기존 badge URL 호환성과 extension copy flow를 함께 확인한다.
- reverse-proxy 뒤에서 IP 제한을 쓸 때 Express `trust proxy` hop 수가 `.codex/rules/deployment.md`와 맞는지 확인한다.
