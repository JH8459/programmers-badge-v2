# Packages Rule

## Scope

`packages/*`는 앱 사이의 공유 경계를 제공한다.

- `packages/badge-core`: pure rendering/domain logic
- `packages/shared-types`: request/response contract
- `packages/config`: lint/prettier/tsconfig config

## Boundary Rules

- `packages/*`는 `apps/*`를 import하지 않는다.
- shared package는 app-specific runtime state를 담지 않는다.
- 공통 로직이 app 내부에 중복되면 package로 올릴지 먼저 검토한다.
- 반대로 한 app에만 필요한 구현은 package로 성급히 올리지 않는다.

## `packages/badge-core`

- deterministic helper와 badge rendering rule만 소유한다.
- framework, network, filesystem, Chrome API, env access를 넣지 않는다.
- 입력 모델과 출력 SVG 규칙은 pure function으로 유지한다.

## `packages/shared-types`

- API와 extension 사이의 contract만 소유한다.
- runtime dependency나 app implementation detail을 담지 않는다.
- field rename/add/remove는 API, extension, 테스트, 문서를 함께 움직이는 breaking point로 취급한다.

## `packages/config`

- 공유 lint/prettier/tsconfig 설정만 소유한다.
- product logic나 runtime code를 넣지 않는다.

## When Editing

- contract 변경은 app 양쪽 영향 범위를 먼저 적는다.
- rendering 변경은 API에서 중복 구현하지 않도록 `badge-core`를 우선 수정한다.
- shared package 변경 후에는 해당 consumer package들의 `typecheck`, `test`, `build` 영향을 확인한다.
