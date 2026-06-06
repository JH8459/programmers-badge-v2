# API Badge Delivery Rule

## Badge And Persistence Defaults

- re-sync 시 같은 `programmerHandle`이면 기존 `publicSlug`를 유지한다.
- sync 시 동일 slug의 full/mini SVG asset을 pre-render하여 갱신한다.
- `/badge/*.svg`는 Nest/Express static middleware로 정적 서빙한다.
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
